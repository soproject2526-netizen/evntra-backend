// dashboard.js
const express = require('express');
const router = express.Router();

// Use the new dashboard routes
router.use('/', require('./dashboardRoutes'));

module.exports = router;
