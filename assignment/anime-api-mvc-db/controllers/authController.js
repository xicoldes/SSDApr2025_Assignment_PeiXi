const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');


module.exports = {
  // User registration
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // 1. Validate input
      const existingUser = await userModel.findByUsername(username);
      if (existingUser) return res.status(400).json({ error: 'Username exists' });
      // 2. Create user
      const newUser = await userModel.createUser(username, email, password);
      const token = jwt.sign(
        { id: newUser.user_id, username: newUser.username, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ token, user: newUser });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  },

// User login
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // 1. Find user
      const user = await userModel.findByUsername(username);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      // 2. Compare passwords
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

      // 3. Generate token
      const token = jwt.sign(
        { id: user.user_id, username: user.username, role: user.role },
        process.env.JWT_SECRET
      );

      res.json({ token, user: { id: user.user_id, username: user.username, role: user.role } });
      
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  }
};