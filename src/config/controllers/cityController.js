const { City } = require('../models');

async function listCities(req, res, next) {
  try {
    const cities = await City.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
      attributes: ['id','name','state','slug']
    });
    res.json({ success: true, data: cities });
  } catch (err) {
    next(err);
  }
}

module.exports = { listCities };
