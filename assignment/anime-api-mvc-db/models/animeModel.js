const { poolPromise, sql } = require('../dbConfig');

class AnimeModel {
  async getAll() {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT 
      anime_id, title, description, genre, episodes, 
      CONVERT(varchar, release_date, 23) as release_date,
      studio, rating, poster_url,
      created_at, updated_at
    FROM anime
  `);
  return result.recordset;
}

  async getById(anime_id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('anime_id', sql.Int, anime_id)
      .query('SELECT * FROM anime WHERE anime_id = @anime_id');
    return result.recordset[0];
  }

  async create(title, description, genre, episodes, studio) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('title', sql.VarChar, title)
      .input('description', sql.Text, description)
      .input('genre', sql.VarChar, genre)
      .input('episodes', sql.Int, episodes)
      .input('studio', sql.VarChar, studio)
      .query(`INSERT INTO anime (title, description, genre, episodes, studio) 
              OUTPUT INSERTED.anime_id 
              VALUES (@title, @description, @genre, @episodes, @studio)`);
    return result.recordset[0];
  }
}

module.exports = new AnimeModel();