const animeModel = require('../models/animeModel');

module.exports = {
  getAllAnime: async (req, res) => {
    try {
      const anime = await animeModel.getAll();
      res.json(anime);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch anime' });
    }
  },

  getAnimeById: async (req, res) => {
    try {
      const anime = await animeModel.getById(req.params.id);
      if (!anime) return res.status(404).json({ error: 'Anime not found' });
      res.json(anime);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch anime' });
    }
  },

  createAnime: async (req, res) => {
    try {
      const { title, description, genre, episodes, studio } = req.body;
      const newAnime = await animeModel.create(title, description, genre, episodes, studio);
      res.status(201).json(newAnime);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create anime' });
    }
  }
};