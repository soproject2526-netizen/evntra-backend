const express = require('express');
const router = express.Router();

const organizerBusinessController = require('../../controllers/organizerBusinessController');

// Create or Update Business Info
router.post('/:organizerId/business-info', organizerBusinessController.upsertBusinessInfo);

// Get Business Info (optional but recommended)
router.get('/:organizerId/business-info', organizerBusinessController.getBusinessInfo);

module.exports = router;
