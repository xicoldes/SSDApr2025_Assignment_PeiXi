const { poolPromise, sql } = require('../dbConfig');
const bcrypt = require('bcryptjs');

class UserModel {
  async findByUsername(username) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT * FROM users WHERE username = @username');
    return result.recordset[0];
  }

  async createUser(username, email, password, role = 'user') {
    const pool = await poolPromise;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .input('email', sql.VarChar, email)
      .input('password_hash', sql.VarChar, hashedPassword)
      .input('role', sql.VarChar, role)
      .query(`INSERT INTO users (username, email, password_hash, role) 
              OUTPUT INSERTED.user_id, INSERTED.username, INSERTED.role 
              VALUES (@username, @email, @password_hash, @role)`);
    return result.recordset[0];
  }
}

module.exports = new UserModel();