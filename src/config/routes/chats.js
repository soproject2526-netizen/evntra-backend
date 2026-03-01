const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../../middleware/authMiddleware'); 

router.post('/start', auth, chatController.startChat);
router.get('/:roomId/messages', auth, chatController.getMessages);

module.exports = router;
