// src/controllers/interactionController.js
const { Like, Share, Favorite, Event, Comment } = require('../models');
const { sequelize } = require('../models');

/**
 * POST /api/events/:id/like
 * Toggle like. Returns updated likes_count and is_liked.
 */
async function toggleLike(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userId = req.user.id;
  const eventId = parseInt(req.params.id, 10);

  const t = await sequelize.transaction();

  try {
    console.log("👍 LIKE REQUEST:", { userId, eventId });

    const event = await Event.findByPk(eventId, { transaction: t });

    if (!event) {
      await t.rollback();
      return res.status(404).json({ message: 'Event not found' });
    }

    const existing = await Like.findOne({
      where: { user_id: userId, event_id: eventId },
      transaction: t
    });

    let isLiked;

    if (existing) {
      await existing.destroy({ transaction: t });

      if (event.likes_count > 0) {
        await event.decrement('likes_count', { by: 1, transaction: t });
      }

      isLiked = false;
    } else {
      await Like.create(
        { user_id: userId, event_id: eventId },
        { transaction: t }
      );

      await event.increment('likes_count', { by: 1, transaction: t });

      isLiked = true;
    }

    await t.commit();

    await event.reload();

    console.log("✅ LIKE UPDATED:", {
      userId,
      eventId,
      isLiked,
      likes: event.likes_count
    });

    return res.json({
      is_liked: isLiked,
      likes_count: Number(event.likes_count) || 0
    });

  } catch (err) {
    await t.rollback();
    console.error("❌ LIKE ERROR:", err);
    next(err);
  }
}



/**
 * POST /api/events/:id/favorite
 * Save event for user (toggle)
 */
async function toggleFavorite(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'Authentication required' });
  const userId = user.id;
  const eventId = req.params.id;
  try {
    const existing = await Favorite.findOne({ where: { user_id: userId, event_id: eventId } });
    if (existing) {
      await existing.destroy();
      return res.json({ is_favorite: false });
    } else {
      await Favorite.create({ user_id: userId, event_id: eventId });
      return res.json({ is_favorite: true });
    }
  } catch (err) { next(err); }
}

/**
 * POST /api/events/:id/share
 * Log a share action (platform optional)
 */
async function logShare(req, res, next) {
  try {
    const user = req.user || null;
    const eventId = req.params.id;
    const { platform } = req.body;
    const share = await Share.create({ user_id: user ? user.id : null, event_id: eventId, platform: platform || null });
    return res.status(201).json({ id: share.id, event_id: share.event_id, platform: share.platform, created_at: share.created_at });
  } catch (err) { next(err); }
}

/**
 * GET /api/events/:id/comments
 * POST /api/events/:id/comments
 */
async function listComments(req, res, next) {
  try {
    const eventId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const offset = (page - 1) * limit;

    const { rows, count } = await Comment.findAndCountAll({
      where: { event_id: eventId },
      order: [['created_at', 'ASC']],
      limit, offset
    });

    return res.json({ page, limit, total: count, data: rows });
  } catch (err) { next(err); }
}

async function createComment(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'Authentication required' });
  const userId = user.id;
  const eventId = req.params.id;
  const { message, parent_id } = req.body;
  if (!message || message.trim().length === 0) return res.status(400).json({ message: 'Message required' });

  const t = await sequelize.transaction();
  try {
    const comment = await Comment.create({ user_id: userId, event_id: eventId, parent_id: parent_id || null, message }, { transaction: t });
    // update counter if not using triggers
    await Event.increment({ comments_count: 1 }, { where: { id: eventId }, transaction: t });
    await t.commit();
    return res.status(201).json(comment);
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

module.exports = {
  toggleLike,
  toggleFavorite,
  logShare,
  listComments,
  createComment
};
