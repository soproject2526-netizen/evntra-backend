const express = require('express');
const router = express.Router();

const { selectCity } = require('../controllers/userController');
// const { protect } = require('../middlewares/authMiddleware');
const protect = require('../../middleware/requireAuth');


router.post('/select-city', protect, selectCity);

module.exports = router;
