const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

module.exports = {
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const existingUser = await userModel.findByUsername(username);
      if (existingUser) return res.status(400).json({ error: 'Username exists' });

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

  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await userModel.findByUsername(username);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { id: user.user_id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ token, user: { user_id: user.user_id, username: user.username, role: user.role } });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  }
};