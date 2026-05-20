const { sequelize, Sequelize } = require("../models");

module.exports = async (req, res, next) => {
  console.log("USER ID:", req.user.id);

  const organizer = await sequelize.query(
    `SELECT * FROM organizers WHERE user_id = :uid`,
    {
      replacements: { uid: req.user.id },
      type: Sequelize.QueryTypes.SELECT,
    },
  );

  console.log("ORG RESULT:", organizer);

  if (!organizer.length) {
    return res.status(403).json({
      message: "Organizer access required",
    });
  }

  req.organizer = organizer[0];
  next();
};
