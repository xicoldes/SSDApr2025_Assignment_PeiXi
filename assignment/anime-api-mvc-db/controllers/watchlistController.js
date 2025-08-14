const { poolPromise, sql } = require('../dbConfig');

module.exports = {
  // Add anime to watchlist
  addToWatchlist: async (req, res) => {
    try {
      const { anime_id, status } = req.body;
      const pool = await poolPromise;

      // Check if anime already exists in user's watchlist
      const existing = await pool.request()
        .input('user_id', sql.Int, req.user.id)
        .input('anime_id', sql.Int, anime_id)
        .query(`
          SELECT * FROM user_anime_list 
          WHERE user_id = @user_id AND anime_id = @anime_id
        `);

      if (existing.recordset.length > 0) {
        return res.status(400).json({ error: 'Anime already in watchlist' });
      }
      
      await pool.request()
        .input('user_id', sql.Int, req.user.id)
        .input('anime_id', sql.Int, anime_id)
        .input('status', sql.VarChar, status)
        .query(`
          INSERT INTO user_anime_list (user_id, anime_id, status)
          VALUES (@user_id, @anime_id, @status)
        `);
      
      res.status(201).json({ message: 'Added to watchlist' });
    } catch (error) {
      console.error('Watchlist error:', error);
      res.status(500).json({ error: 'Failed to update watchlist' });
    }
  },

  getUserWatchlist: async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'updated_at', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    const pool = await poolPromise;
    
    let query = `
      SELECT a.*, ual.status, ual.rating, ual.progress, ual.notes, ual.updated_at as watchlist_updated
      FROM user_anime_list ual
      JOIN anime a ON ual.anime_id = a.anime_id
      WHERE ual.user_id = @user_id
    `;
    
    const request = pool.request().input('user_id', sql.Int, req.params.user_id);
    
    // Add status filter if provided
    if (status) {
      query += ` AND ual.status = @status`;
      request.input('status', sql.VarChar, status);
    }
    
    // Add sorting - FIXED VERSION
    const validSortColumns = ['updated_at', 'title', 'rating'];
    let sortColumn;
    
    if (sortBy === 'updated_at') {
      sortColumn = 'ual.updated_at';
    } else if (sortBy === 'title') {
      sortColumn = 'a.title';
    } else if (sortBy === 'rating') {
      sortColumn = 'ual.rating';
    } else {
      sortColumn = 'ual.updated_at'; // default
    }
    
    const sortDirection = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;
    query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
    
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, parseInt(limit));
    
    const result = await request.query(query);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM user_anime_list ual 
      WHERE ual.user_id = @user_id
    `;
    
    const countRequest = pool.request().input('user_id', sql.Int, req.params.user_id);
    
    if (status) {
      countQuery += ` AND ual.status = @status`;
      countRequest.input('status', sql.VarChar, status);
    }
    
    const countResult = await countRequest.query(countQuery);
    const total = countResult.recordset[0].total;
    
    res.json({
      data: result.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
},

  // NEW: Update watchlist entry
  updateWatchlistEntry: async (req, res) => {
    try {
      const { status, rating, progress, notes } = req.body;
      const { anime_id } = req.params;
      const pool = await poolPromise;
      
      // Check if entry exists
      const existing = await pool.request()
        .input('user_id', sql.Int, req.user.id)
        .input('anime_id', sql.Int, anime_id)
        .query(`
          SELECT * FROM user_anime_list 
          WHERE user_id = @user_id AND anime_id = @anime_id
        `);
      
      if (existing.recordset.length === 0) {
        return res.status(404).json({ error: 'Watchlist entry not found' });
      }
      
      let updateQuery = 'UPDATE user_anime_list SET ';
      const updates = [];
      const request = pool.request()
        .input('user_id', sql.Int, req.user.id)
        .input('anime_id', sql.Int, anime_id);
      
      if (status) {
        updates.push('status = @status');
        request.input('status', sql.VarChar, status);
      }
      
      if (rating !== undefined) {
        updates.push('rating = @rating');
        request.input('rating', sql.Int, rating);
      }
      
      if (progress !== undefined) {
        updates.push('progress = @progress');
        request.input('progress', sql.Int, progress);
      }
      
      if (notes !== undefined) {
        updates.push('notes = @notes');
        request.input('notes', sql.Text, notes);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      updates.push('updated_at = GETDATE()');
      updateQuery += updates.join(', ');
      updateQuery += ' WHERE user_id = @user_id AND anime_id = @anime_id';
      
      await request.query(updateQuery);
      
      res.json({ message: 'Watchlist entry updated successfully' });
    } catch (error) {
      console.error('Update watchlist error:', error);
      res.status(500).json({ error: 'Failed to update watchlist entry' });
    }
  },

  // NEW: Remove from watchlist
  removeFromWatchlist: async (req, res) => {
    try {
      const { anime_id } = req.params;
      const pool = await poolPromise;
      
      const result = await pool.request()
        .input('user_id', sql.Int, req.user.id)
        .input('anime_id', sql.Int, anime_id)
        .query(`
          DELETE FROM user_anime_list 
          WHERE user_id = @user_id AND anime_id = @anime_id
        `);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Watchlist entry not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Remove from watchlist error:', error);
      res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
  }
};