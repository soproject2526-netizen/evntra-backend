// src/routes/interactionRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/requireAuth');
// create requireAuth to enforce login
const {
  toggleLike,
  toggleFavorite,
  logShare,
  listComments,
  createComment
} = require('../controllers/interactionController');

router.post('/:id/like', auth, toggleLike);
router.post('/:id/favorite', auth, toggleFavorite);
router.post('/:id/share', logShare); 

router.get('/:id/comments', listComments);
router.post('/:id/comments', auth, createComment);

module.exports = router;
