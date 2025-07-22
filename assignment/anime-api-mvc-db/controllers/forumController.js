const forumModel = require('../models/forumModel');

module.exports = {
  createThread: async (req, res) => {
    try {
      const { anime_id, title, content } = req.body;
      const newThread = await forumModel.createThread(
        anime_id,
        req.user.id,
        title,
        content
      );
      res.status(201).json(newThread);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create thread' });
    }
  },

  getThreadsByAnime: async (req, res) => {
    try {
      const threads = await forumModel.getThreadsByAnime(req.params.anime_id);
      res.json(threads);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch threads' });
    }
  }
};