
const express = require('express');
const router = express.Router();
//const { getDashboard } = require('../controllers/dashboardController');
const authOptional = require('../../middleware/requireAuth');

const {
  getDashboard,
  getCategories,
  getCities,
  getRecentEvents
} = require('../controllers/dashboardController');

router.get('/', getDashboard);
router.get('/stats', authOptional, getDashboard);
router.get('/categories',getCategories);
router.get('/cities', getCities);
router.get('/recent-events', authOptional, getRecentEvents);

module.exports = router;
