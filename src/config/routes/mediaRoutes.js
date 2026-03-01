// src/routes/mediaRoutes.js
const express = require('express');
const router = express.Router();
const { signS3, completeMedia } = require('../controllers/mediaController');
const requireAuth = require('../../middleware/requireAuth');

router.post('/sign-s3', requireAuth, signS3);
router.post('/events/:id/media/complete', requireAuth, completeMedia);

module.exports = router;
