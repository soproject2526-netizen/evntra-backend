const { Op } = require('sequelize');
const { Notification } = require('../config/models/notification');

const MAX_LIMIT = 50;

const notificationService = {
  async createNotification({
    userId,
    type,
    title,
    message,
    referenceType = null,
    referenceId = null,
  }) {
    if (!userId) {
      throw new Error('userId is required');
    }

    if (!type) {
      throw new Error('Notification type is required');
    }

    if (!title) {
      throw new Error('Notification title is required');
    }

    if (!message) {
      throw new Error('Notification message is required');
    }

    return Notification.create({
      user_id: userId,
      type,
      title,
      message,
      reference_type: referenceType,
      reference_id: referenceId,
      is_read: false,
    });
  },

  async getNotifications(userId, page = 1, limit = 20) {
    const safePage = Math.max(Number(page) || 1, 1);

    const safeLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      MAX_LIMIT
    );

    const offset = (safePage - 1) * safeLimit;

    const result = await Notification.findAndCountAll({
      where: {
        user_id: userId,
      },

      attributes: [
        'id',
        'type',
        'title',
        'message',
        'reference_type',
        'reference_id',
        'is_read',
        'created_at',
        'updated_at',
      ],

      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],

      limit: safeLimit,
      offset,

      distinct: true,
    });

    return {
      notifications: result.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: result.count,
        total_pages: Math.ceil(result.count / safeLimit),
        has_next_page:
          safePage < Math.ceil(result.count / safeLimit),
      },
    };
  },

  async getUnreadCount(userId) {
    const count = await Notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });

    return count;
  },

  async markAsRead(notificationId, userId) {
    const [updatedRows] = await Notification.update(
      {
        is_read: true,
      },
      {
        where: {
          id: notificationId,
          user_id: userId,
          is_read: false,
        },
      }
    );

    if (updatedRows === 0) {
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          user_id: userId,
        },
        attributes: ['id', 'is_read'],
      });

      if (!notification) {
        return null;
      }

      return notification;
    }

    return Notification.findOne({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });
  },

  async markAllAsRead(userId) {
    const [updatedRows] = await Notification.update(
      {
        is_read: true,
      },
      {
        where: {
          user_id: userId,
          is_read: false,
        },
      }
    );

    return updatedRows;
  },
};

module.exports = notificationService;