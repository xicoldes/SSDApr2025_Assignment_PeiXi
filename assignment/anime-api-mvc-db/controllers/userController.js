const { poolPromise, sql } = require('../dbConfig');
const bcrypt = require('bcryptjs');

module.exports = {
  // Get user profile by ID
  getUserProfile: async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('user_id', sql.Int, req.params.id)
        .query('SELECT user_id, username, email, role, profile_pic, bio FROM users WHERE user_id = @user_id');
      
      if (!result.recordset[0]) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(result.recordset[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { username, email, password, bio } = req.body;
      const pool = await poolPromise;
      
      let updateQuery = 'UPDATE users SET ';
      const inputs = {
        user_id: { value: req.params.id, type: sql.Int }
      };
      
      if (username) {
        updateQuery += 'username = @username, ';
        inputs.username = { value: username, type: sql.VarChar };
      }
      
      if (email) {
        updateQuery += 'email = @email, ';
        inputs.email = { value: email, type: sql.VarChar };
      }
      
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateQuery += 'password_hash = @password_hash, ';
        inputs.password_hash = { value: hashedPassword, type: sql.VarChar };
      }
      
      if (bio) {
        updateQuery += 'bio = @bio, ';
        inputs.bio = { value: bio, type: sql.Text };
      }
      
      updateQuery += 'updated_at = GETDATE() WHERE user_id = @user_id';
      
      const request = pool.request();
      for (const [key, value] of Object.entries(inputs)) {
        request.input(key, value.type, value.value);
      }
      
      await request.query(updateQuery);
      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
};