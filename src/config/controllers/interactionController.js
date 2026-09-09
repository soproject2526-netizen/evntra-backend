// src/controllers/interactionController.js
const { Like, Share, Favorite, Event, Comment, User } = require('../models');
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
      // 🔴 UNLIKE
      await existing.destroy({ transaction: t });
      isLiked = false;
    } else {
      // 🟢 LIKE
      await Like.create(
        { user_id: userId, event_id: eventId },
        { transaction: t }
      );
      isLiked = true;
    }

    // ✅ ALWAYS RE-CALCULATE COUNT (MOST IMPORTANT FIX)
    const likesCount = await Like.count({
      where: { event_id: eventId },
      transaction: t
    });

    await t.commit();

    return res.json({
      success: true,
      is_liked: isLiked,
      likes_count: likesCount
    });

  } catch (err) {
    await t.rollback();
    console.error("❌ LIKE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle like"
    });
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
    const eventId = Number(req.params.id);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      });
    }

    const event = await Event.findByPk(eventId, {
      attributes: ['id'],
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    let page = parseInt(req.query.page || '1', 10);
    let limit = parseInt(req.query.limit || '20', 10);

    if (!Number.isInteger(page) || page < 1) {
      page = 1;
    }

    if (!Number.isInteger(limit) || limit < 1) {
      limit = 20;
    }

    limit = Math.min(limit, 50);

    const offset = (page - 1) * limit;

    const { rows, count } = await Comment.findAndCountAll({
      where: {
        event_id: eventId,
        parent_id: null,
      },

      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'full_name',
            'profile_image',
          ],
        },
      ],

      order: [
        ['created_at', 'ASC'],
        ['id', 'ASC'],
      ],

      limit,
      offset,
    });

    return res.status(200).json({
      success: true,

      page,
      limit,
      total: count,

      has_more: offset + rows.length < count,

      data: rows,
    });
  } catch (err) {
    console.error('❌ LIST COMMENTS ERROR:', err);
    return next(err);
  }
}

async function createComment(req, res, next) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const userId = Number(user.id);
  const eventId = Number(req.params.id);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid event ID',
    });
  }

  const rawMessage = req.body?.message;

  if (typeof rawMessage !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Comment message is required',
    });
  }

  const message = rawMessage.trim();

  if (message.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Comment cannot be empty',
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Comment cannot exceed 1000 characters',
    });
  }

  let parentId = null;

  if (
    req.body.parent_id !== undefined &&
    req.body.parent_id !== null &&
    req.body.parent_id !== ''
  ) {
    parentId = Number(req.body.parent_id);

    if (!Number.isInteger(parentId) || parentId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent comment ID',
      });
    }
  }

  const transaction = await sequelize.transaction();

  try {
    const event = await Event.findByPk(eventId, {
      attributes: ['id'],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!event) {
      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (parentId !== null) {
      const parentComment = await Comment.findOne({
        where: {
          id: parentId,
          event_id: eventId,
        },
        attributes: ['id'],
        transaction,
      });

      if (!parentComment) {
        await transaction.rollback();

        return res.status(400).json({
          success: false,
          message: 'Parent comment not found',
        });
      }
    }

    const comment = await Comment.create(
      {
        user_id: userId,
        event_id: eventId,
        parent_id: parentId,
        message,
      },
      {
        transaction,
      }
    );

    await Event.increment(
      {
        comments_count: 1,
      },
      {
        where: {
          id: eventId,
        },
        transaction,
      }
    );

    await transaction.commit();

    const createdComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'full_name',
            'profile_image',
          ],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: createdComment,
    });
  } catch (err) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error('❌ CREATE COMMENT ERROR:', err);

    return next(err);
  }
}

module.exports = {
  toggleLike,
  toggleFavorite,
  logShare,
  listComments,
  createComment
};
