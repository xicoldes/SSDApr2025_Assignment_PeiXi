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
  },

  createComment: async (req, res) => {
  try {
    const { thread_id, content, parent_comment_id } = req.body;
    const newComment = await forumModel.createComment(
      thread_id,
      req.user.id,
      content,
      parent_comment_id
    );
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create comment' });
  }
},

getComments: async (req, res) => {
  try {
    const comments = await forumModel.getCommentsByThread(req.params.thread_id);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
},

upvoteComment: async (req, res) => {
  try {
    await forumModel.upvoteComment(req.params.id);
    res.json({ message: 'Comment upvoted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upvote comment' });
  }
},

  deleteThread: async (req, res) => {
    try {
      const threadId = req.params.id;
      const pool = await poolPromise;

      // 1. Verify if thread exists
      const threadCheck = await pool.request()
        .input('thread_id', sql.Int, threadId)
        .query('SELECT thread_id FROM forum_threads WHERE thread_id = @thread_id');

      if (threadCheck.recordset.length === 0) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      // 2. Delete thread (admin bypasses ownership check)
      await pool.request()
        .input('thread_id', sql.Int, threadId)
        .query('DELETE FROM forum_threads WHERE thread_id = @thread_id');

      // 3. Also delete associated comments
      await pool.request()
        .input('thread_id', sql.Int, threadId)
        .query('DELETE FROM forum_comments WHERE thread_id = @thread_id');

      res.status(204).end(); // Successful deletion (no content)
      
    } catch (error) {
      console.error('Delete thread error:', error);
      res.status(500).json({ error: 'Failed to delete thread' });
    }
  },

};

