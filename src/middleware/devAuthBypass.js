module.exports = (req, res, next) => {
  // Fake logged-in user for testing
  req.user = {
    id: 1,          // MUST exist in users table
    name: 'Dev User'
  };
  next();
};
