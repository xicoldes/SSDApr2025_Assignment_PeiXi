const forumModel = require('../models/forumModel');
const { poolPromise, sql } = require('../dbConfig');

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
      const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
      const offset = (page - 1) * limit;
      
      const pool = await poolPromise;
      
      const validSortColumns = ['created_at', 'title', 'view_count'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
      const sortDirection = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      const result = await pool.request()
        .input('anime_id', sql.Int, req.params.anime_id)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, parseInt(limit))
        .query(`
          SELECT t.*, u.username 
          FROM forum_threads t
          JOIN users u ON t.user_id = u.user_id
          WHERE t.anime_id = @anime_id
          ORDER BY t.${sortColumn} ${sortDirection}
          OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);
      
      // Get total count
      const countResult = await pool.request()
        .input('anime_id', sql.Int, req.params.anime_id)
        .query(`SELECT COUNT(*) as total FROM forum_threads WHERE anime_id = @anime_id`);
      
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
      res.status(500).json({ error: 'Failed to fetch threads' });
    }
  },

  // NEW: Update thread (only users can edit their own threads)
  updateThread: async (req, res) => {
    try {
      const { title, content } = req.body;
      const threadId = req.params.id;
      const pool = await poolPromise;
      
      // Check if thread exists and user owns it (or is admin)
      const threadCheck = await pool.request()
        .input('thread_id', sql.Int, threadId)
        .query('SELECT user_id FROM forum_threads WHERE thread_id = @thread_id');
      
      if (threadCheck.recordset.length === 0) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      // Get thread owner ID 
      const threadOwnerId = threadCheck.recordset[0].user_id;
      
      // Allow update if user owns thread or is admin
      if (threadOwnerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this thread' });
      }

      await pool.request()
        .input('thread_id', sql.Int, threadId)
        .input('title', sql.VarChar, title)
        .input('content', sql.Text, content)
        .query(`
          UPDATE forum_threads 
          SET title = @title, content = @content, updated_at = GETDATE()
          WHERE thread_id = @thread_id
        `);
      
      res.json({ message: 'Thread updated successfully' });
    } catch (error) {
      console.error('Update thread error:', error);
      res.status(500).json({ error: 'Failed to update thread' });
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

  // NEW: Delete comment
  deleteComment: async (req, res) => {
    try {
      const commentId = req.params.id;
      const pool = await poolPromise;
      
      // Check if comment exists and user owns it (or is admin)
      const commentCheck = await pool.request()
        .input('comment_id', sql.Int, commentId)
        .query('SELECT user_id FROM forum_comments WHERE comment_id = @comment_id');
      
      if (commentCheck.recordset.length === 0) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      
      const commentOwnerId = commentCheck.recordset[0].user_id;
      
      // Allow deletion if user owns comment or is admin
      if (commentOwnerId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }
      
      await pool.request()
        .input('comment_id', sql.Int, commentId)
        .query('DELETE FROM forum_comments WHERE comment_id = @comment_id');
      
      res.status(204).end();
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ error: 'Failed to delete comment' });
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

      res.status(204).end();
      
    } catch (error) {
      console.error('Delete thread error:', error);
      res.status(500).json({ error: 'Failed to delete thread' });
    }
  }
};