const { sequelize, Sequelize } = require("../models");

module.exports = async (req, res, next) => {
  const organizer = await sequelize.query(
    `SELECT * FROM organizers
     WHERE user_id = :uid
     AND approval_status = 'APPROVED'
     AND is_active = 1
     LIMIT 1`,
    {
      replacements: { uid: req.user.id },
      type: Sequelize.QueryTypes.SELECT,
    },
  );

  if (!organizer.length) {
    return res.status(403).json({
      message: "Organizer access required",
    });
  }

  req.organizer = organizer[0];
  next();
};
