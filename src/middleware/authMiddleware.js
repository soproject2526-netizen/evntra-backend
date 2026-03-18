// authMiddleware.js (FIXED)
const jwt = require('jsonwebtoken');
const { User } = require('../config/models');

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ message: 'Authorization required' });

    const token = header.split(' ')[1];

    // Verify JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');

    if (!payload || !payload.id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Fetch user from DB
    const user = await User.findByPk(payload.id, {
      attributes: ['id', 'name', 'email', 'role'], // include role
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to req
    req.user = user.toJSON();
    next();
  } catch (err) {
    console.error('AUTH ERROR:', err.message);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};