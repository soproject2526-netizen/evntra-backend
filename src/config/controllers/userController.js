const { City, User } = require('../models');

async function selectCity(req, res, next) {
  try {
    const { city_id } = req.body;

    if (!city_id)
      return res.status(400).json({ message: 'city_id is required' });

    // Check city exists & active
    const city = await City.findOne({
      where: { id: city_id, is_active: true }
    });

    if (!city)
      return res.status(404).json({ message: 'City not found' });

    // Save selected city to logged-in user
    // req.user.city_id = city_id;
    // await req.user.save();

    // Fetch logged-in user from DB (req.user is JWT payload)
const user = await User.findByPk(req.user.id);

if (!user)
  return res.status(404).json({ message: 'User not found' });

user.city_id = city_id;
await user.save();



    return res.json({
      success: true,
      message: 'City selected successfully',
      city: {
        id: city.id,
        name: city.name,
        state: city.state,
        slug: city.slug
      }
    });

  } catch (err) {
    next(err);
  }
}

module.exports = { selectCity };
