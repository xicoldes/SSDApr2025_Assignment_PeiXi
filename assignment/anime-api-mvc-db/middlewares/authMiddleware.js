const jwt = require('jsonwebtoken');

module.exports = {
  // Middleware to authenticate user
  authenticate: (req, res, next) => {
    // Get token from headers
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    // Verify token and extract user information
    try {
      // add user info to request
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid token' });
    }
  },

  // Middleware to authorize user roles (admin only)
  authorize: (roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };
  }
};