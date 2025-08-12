const animeModel = require('../models/animeModel');
const { poolPromise, sql } = require('../dbConfig');

module.exports = {
  // Enhanced Get all anime with filtering, sorting, pagination
  getAllAnime: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        genre,
        studio,
        sortBy = 'title',
        sortOrder = 'ASC',
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const pool = await poolPromise;
      
      // Build dynamic query
      let query = `
        SELECT 
          anime_id, title, description, genre, episodes, 
          CONVERT(varchar, release_date, 23) as release_date,
          studio, rating, poster_url, created_at, updated_at
        FROM anime
        WHERE 1=1
      `;
      
      const request = pool.request();
      
      // Add filters
      if (genre) {
        query += ` AND genre LIKE @genre`;
        request.input('genre', sql.VarChar, `%${genre}%`);
      }
      
      if (studio) {
        query += ` AND studio LIKE @studio`;
        request.input('studio', sql.VarChar, `%${studio}%`);
      }
      
      if (search) {
        query += ` AND (title LIKE @search OR description LIKE @search)`;
        request.input('search', sql.VarChar, `%${search}%`);
      }
      
      // Add sorting
      const validSortColumns = ['title', 'episodes', 'rating', 'release_date', 'created_at'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'title';
      const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
      
      query += ` ORDER BY ${sortColumn} ${sortDirection}`;
      
      // Add pagination
      query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
      request.input('offset', sql.Int, parseInt(offset));
      request.input('limit', sql.Int, parseInt(limit));
      
      const result = await request.query(query);
      
      // Get total count for pagination metadata
      let countQuery = `SELECT COUNT(*) as total FROM anime WHERE 1=1`;
      const countRequest = pool.request();
      
      if (genre) {
        countQuery += ` AND genre LIKE @genre`;
        countRequest.input('genre', sql.VarChar, `%${genre}%`);
      }
      
      if (studio) {
        countQuery += ` AND studio LIKE @studio`;
        countRequest.input('studio', sql.VarChar, `%${studio}%`);
      }
      
      if (search) {
        countQuery += ` AND (title LIKE @search OR description LIKE @search)`;
        countRequest.input('search', sql.VarChar, `%${search}%`);
      }
      
      const countResult = await countRequest.query(countQuery);
      const total = countResult.recordset[0].total;
      
      res.json({
        data: result.recordset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: {
          genre,
          studio,
          search,
          sortBy: sortColumn,
          sortOrder: sortDirection
        }
      });
    } catch (error) {
      console.error('Get all anime error:', error);
      res.status(500).json({ error: 'Failed to fetch anime' });
    }
  },

  // Get anime by ID
  getAnimeById: async (req, res) => {
    try {
      const anime = await animeModel.getById(req.params.id);
      if (!anime) return res.status(404).json({ error: 'Anime not found' });
      res.json(anime);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch anime' });
    }
  },

  // Create new anime
  createAnime: async (req, res) => {
    try {
      const { title, description, genre, episodes, studio } = req.body;
      const newAnime = await animeModel.create(title, description, genre, episodes, studio);
      res.status(201).json(newAnime);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create anime' });
    }
  },

  // Update anime by ID
  updateAnime: async (req, res) => {
    try {
      const { title, description, genre, episodes, studio } = req.body;
      const pool = await poolPromise;
      
      await pool.request()
        .input('anime_id', sql.Int, req.params.id)
        .input('title', sql.VarChar, title)
        .input('description', sql.Text, description)
        .input('genre', sql.VarChar, genre)
        .input('episodes', sql.Int, episodes)
        .input('studio', sql.VarChar, studio)
        .query(`
          UPDATE anime 
          SET title = @title, 
              description = @description,
              genre = @genre,
              episodes = @episodes,
              studio = @studio,
              updated_at = GETDATE()
          WHERE anime_id = @anime_id
        `);
      
      res.json({ message: 'Anime updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update anime' });
    }
  },

  // Delete anime by ID including related data
  deleteAnime: async (req, res) => {
    try {
      const animeId = req.params.id;
      const pool = await poolPromise;

      console.log(`Starting deletion process for anime ID: ${animeId}`);

      const transaction = new sql.Transaction(pool);
      transaction.isolationLevel = sql.ISOLATION_LEVEL.READ_COMMITTED;
      await transaction.begin();
      console.log('Transaction begun');

      try {
        // 1. Delete comments
        console.log('Deleting comments...');
        const deleteComments = new sql.Request(transaction);
        const commentsResult = await deleteComments
          .query(`
            DELETE fc
            FROM forum_comments fc
            INNER JOIN forum_threads ft ON fc.thread_id = ft.thread_id
            WHERE ft.anime_id = ${animeId}
          `);
        console.log(`Deleted ${commentsResult.rowsAffected} comments`);

        // 2. Delete threads
        console.log('Deleting threads...');
        const deleteThreads = new sql.Request(transaction);
        const threadsResult = await deleteThreads
          .query(`DELETE FROM forum_threads WHERE anime_id = ${animeId}`);
        console.log(`Deleted ${threadsResult.rowsAffected} threads`);

        // 3. Delete watchlist entries
        console.log('Deleting watchlist entries...');
        const deleteWatchlist = new sql.Request(transaction);
        const watchlistResult = await deleteWatchlist
          .query(`DELETE FROM user_anime_list WHERE anime_id = ${animeId}`);
        console.log(`Deleted ${watchlistResult.rowsAffected} watchlist entries`);

        // 4. Delete anime
        console.log('Deleting anime...');
        const deleteAnime = new sql.Request(transaction);
        const animeResult = await deleteAnime
          .query(`DELETE FROM anime WHERE anime_id = ${animeId}`);
        console.log(`Deleted ${animeResult.rowsAffected} anime`);

        await transaction.commit();
        console.log('Transaction committed successfully');
        
        if (animeResult.rowsAffected[0] === 0) {
          return res.status(404).json({ error: 'Anime not found' });
        }

        res.status(204).end();
      } catch (innerError) {
        console.error('Inner transaction error:', innerError);
        await transaction.rollback();
        console.log('Transaction rolled back');
        throw innerError;
      }
    } catch (error) {
      console.error('Full error details:', error);
      res.status(500).json({ 
        error: 'Failed to delete anime',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};