// src/middleware/requireAuth.js
const jwt = require('jsonwebtoken');
const { User } = require('../config/models');

module.exports = async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Authorization required' });

    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
    if (!payload || !payload.id) return res.status(401).json({ message: 'Invalid token' });

    const user = await User.findByPk(payload.id, { attributes: ['id','name','avatar_url','preferred_city_id'] });
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user.toJSON();
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
