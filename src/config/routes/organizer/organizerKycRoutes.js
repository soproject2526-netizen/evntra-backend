const express = require('express');
const router = express.Router();

const auth = require('../../../middleware/authMiddleware');
const upload = require('../../../middleware/upload');
const organizerKycController = require('../../controllers/organizerKycController');

// Submit / Update KYC
router.post(
  '/kyc',
  auth,
  upload.fields([
    { name: 'aadhar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  organizerKycController.submitKYC
);

module.exports = router;
