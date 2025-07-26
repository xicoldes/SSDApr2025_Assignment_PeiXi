const animeModel = require('../models/animeModel');

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

  // Delete anime by ID
  deleteAnime: async (req, res) => {
    try {
      const animeId = req.params.id;
      const pool = await poolPromise;
    
    await pool.request()
      .input('anime_id', sql.Int, animeId)
      .query('DELETE FROM anime WHERE anime_id = @anime_id');
    
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete anime' });
  }
 }
};

