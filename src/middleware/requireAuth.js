const jwt = require('jsonwebtoken');
const { User } = require('../config/models'); // FIX PATH ALSO

module.exports = async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization required' });
    }

    const token = auth.split(' ')[1];

    console.log("🔐 TOKEN RECEIVED:", token); //  DEBUG

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');

    console.log("📦 TOKEN PAYLOAD:", payload); //  DEBUG

    if (!payload || !payload.id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await User.findByPk(payload.id, {
      attributes: ['id', 'first_name', 'last_name', 'email', 'role']
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    console.log("👤 USER FROM DB:", user.toJSON()); // ✅ DEBUG

    req.user = user.toJSON();

    next();
  } catch (err) {
    console.error("❌ AUTH ERROR:", err.message);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};