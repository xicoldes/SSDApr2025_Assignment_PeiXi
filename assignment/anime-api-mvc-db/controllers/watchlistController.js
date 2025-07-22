const { poolPromise, sql } = require('../dbConfig');
const { authenticate } = require('../middlewares/authMiddleware');

module.exports = {
  addToWatchlist: async (req, res) => {
    try {
      const { anime_id, status } = req.body;
      const pool = await poolPromise;
      
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
      const pool = await poolPromise;
      const result = await pool.request()
        .input('user_id', sql.Int, req.params.user_id)
        .query(`
          SELECT a.*, ual.status 
          FROM user_anime_list ual
          JOIN anime a ON ual.anime_id = a.anime_id
          WHERE ual.user_id = @user_id
        `);
      
      res.json(result.recordset);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
  }
};