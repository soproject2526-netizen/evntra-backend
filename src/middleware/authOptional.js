const { verifyToken } = require('../utils/jwt');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    req.user = null;
    return next();
  }

  try {
    const [, token] = header.split(' ');
    req.user = verifyToken(token);
  } catch (e) {
    req.user = null;
  }

  next();
};
