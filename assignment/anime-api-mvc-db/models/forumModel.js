const { poolPromise, sql } = require('../dbConfig');

class ForumModel {
  async createThread(anime_id, user_id, title, content) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('anime_id', sql.Int, anime_id)
      .input('user_id', sql.Int, user_id)
      .input('title', sql.VarChar, title)
      .input('content', sql.Text, content)
      .query(`INSERT INTO forum_threads (anime_id, user_id, title, content) 
              OUTPUT INSERTED.thread_id 
              VALUES (@anime_id, @user_id, @title, @content)`);
    return result.recordset[0];
  }

  async getThreadsByAnime(anime_id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('anime_id', sql.Int, anime_id)
      .query(`SELECT t.*, u.username 
              FROM forum_threads t
              JOIN users u ON t.user_id = u.user_id
              WHERE t.anime_id = @anime_id`);
    return result.recordset;
  }

  async createComment(thread_id, user_id, content, parent_comment_id = null) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('thread_id', sql.Int, thread_id)
    .input('user_id', sql.Int, user_id)
    .input('content', sql.Text, content)
    .input('parent_comment_id', sql.Int, parent_comment_id)
    .query(`INSERT INTO forum_comments (thread_id, user_id, content, parent_comment_id) 
            OUTPUT INSERTED.comment_id 
            VALUES (@thread_id, @user_id, @content, @parent_comment_id)`);
  return result.recordset[0];
}

async getCommentsByThread(thread_id) {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('thread_id', sql.Int, thread_id)
    .query(`SELECT c.*, u.username 
            FROM forum_comments c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.thread_id = @thread_id
            ORDER BY c.created_at DESC`);
  return result.recordset;
}
  
async upvoteComment(comment_id) {
  const pool = await poolPromise;
  await pool.request()
    .input('comment_id', sql.Int, comment_id)
    .query(`UPDATE forum_comments 
            SET upvotes = upvotes + 1 
            WHERE comment_id = @comment_id`);
}

};

module.exports = new ForumModel();