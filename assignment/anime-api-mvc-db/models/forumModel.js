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
}

module.exports = new ForumModel();