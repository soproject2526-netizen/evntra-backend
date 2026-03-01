const express = require('express');
const router = express.Router();
const { listCities } = require('../controllers/cityController');

router.get('/', listCities);

module.exports = router;
