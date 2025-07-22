const jwt = require('jsonwebtoken');

module.exports = {
  authenticate: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid token' });
    }
  },

  authorize: (roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };
  }
};