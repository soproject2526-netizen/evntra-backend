// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { createEvent } = require('../controllers/adminEventController');

router.post('/events', requireAuth, createEvent);

module.exports = router;
