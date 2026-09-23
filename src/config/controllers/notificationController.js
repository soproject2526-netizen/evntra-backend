const notificationService = require('../../services/notificationService');

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { page = 1, limit = 20 } = req.query;

    const result = await notificationService.getNotifications(
      userId,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const count = await notificationService.getUnreadCount(userId);

    return res.status(200).json({
      success: true,
      unread_count: count,
    });
  } catch (error) {
    console.error('Get unread notification count error:', error);
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const notificationId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification id',
      });
    }

    const notification =
      await notificationService.markAsRead(
        notificationId,
        userId
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const updatedCount =
      await notificationService.markAllAsRead(userId);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updated_count: updatedCount,
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};