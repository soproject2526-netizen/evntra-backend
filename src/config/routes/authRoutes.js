const express = require('express');
const router = express.Router();
const { signup, signin, sendResetCode, verifyResetCode,  resetPassword } = require('../controllers/authController');
const upload = require('../middleware/upload');

router.post('/signup', upload.single('profile_image'), signup);
router.post('/signin', signin);
router.post('/forgot-password',sendResetCode);
router.post("/verify-reset-code", verifyResetCode);
router.post('/reset-password', resetPassword);



module.exports = router;
