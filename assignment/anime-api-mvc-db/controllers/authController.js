const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../dbConfig');
const logger = require('../utils/logger');
const userModel = require('../models/userModel');

// Verify bcrypt version on startup
const bcryptVersion = require('bcryptjs/package.json').version;
if (bcryptVersion !== '2.4.3') {
  logger.error(`FATAL: Wrong bcryptjs version (${bcryptVersion}). Requires 2.4.3`);
  process.exit(1);
}

module.exports = {
  // User registration
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Basic validation
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      
      // Create user
      const newUser = await userModel.createUser(username, email, password);
      
      // Generate JWT token
      const token = jwt.sign(
        {
          id: newUser.user_id,
          username: newUser.username,
          role: newUser.role
        },
        // Sign with secret key
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      //return token + user information
      res.status(201).json({
        token,
        user: {
          id: newUser.user_id,
          username: newUser.username,
          role: newUser.role,
          email: newUser.email
        }
      });
    } catch (error) {
      if (error.number === 2627) { // SQL Server duplicate key error
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  },

  // User login
  login: async (req, res) => {
    const { username, password } = req.body;
    
    try {
      // 1. Find user by username
      const pool = await poolPromise;
      const userResult = await pool.request()
        .input('username', sql.VarChar, username)
        .query('SELECT * FROM users WHERE username = @username');

      // 2. Check if user exists 
      const user = userResult.recordset[0];
      if (!user) {
        logger.warn(`Login failed: User ${username} not found`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // 3. compare password with stored hash for validation
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        logger.warn(`Login failed: Invalid password for ${username}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // 4. Generate token (with expiration)
      const token = jwt.sign(
        {
          id: user.user_id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // 5. Successful response
      res.json({
        token,
        user: {
          id: user.user_id,
          username: user.username,
          role: user.role,
          email: user.email,
          profile_pic: user.profile_pic
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: "Authentication failed" });
    }
  },

  // // Password reset utility (run once then remove)
  // resetAllPasswords: async (req, res) => {
  //   try {
  //     const users = [
  //       { username: 'admin', password: 'admin123' },
  //       { username: 'jojofan', password: 'jojo123' },
  //       { username: 'bleachlover', password: 'bleach123' }
  //     ];

  //     const pool = await poolPromise;
      
  //     for (const user of users) {
  //       const hash = await bcrypt.hash(user.password, 10);
  //       await pool.request()
  //         .input('username', sql.VarChar, user.username)
  //         .input('hash', sql.VarChar, hash)
  //         .query('UPDATE users SET password_hash = @hash WHERE username = @username');
  //       logger.info(`Updated password for ${user.username}`);
  //     }

  //     res.json({ 
  //       success: true,
  //       message: 'All passwords reset successfully' 
  //     });

  //   } catch (error) {
  //     logger.error('Password reset error:', error);
  //     res.status(500).json({ error: "Password reset failed" });
  //   }
  //}
};