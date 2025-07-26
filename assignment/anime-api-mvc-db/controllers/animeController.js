const animeModel = require('../models/animeModel');
const { poolPromise, sql } = require('../dbConfig');

module.exports = {
  // Get all anime
  getAllAnime: async (req, res) => {
    try {
      const anime = await animeModel.getAll();
      res.json(anime);
    } catch (error) {
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
    // Set isolation level and timeout
    transaction.isolationLevel = sql.ISOLATION_LEVEL.READ_COMMITTED;
    await transaction.begin();
    console.log('Transaction begun');

    try {
      // Create fresh request for each operation
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
