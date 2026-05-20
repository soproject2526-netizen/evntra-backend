module.exports = (req, res, next) => {
  if (!req.user || !req.user.is_organizer) {
    return res.status(403).json({ message: "Organizer access only" });
  }
  next();
};

