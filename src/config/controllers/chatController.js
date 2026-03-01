const { ChatRoomMoreInfo, ChatMessage, Event } = require('../models');
const { Op } = require('sequelize');

/**
 * POST /api/chats/start
 * Create or get chat room for event + user
 */
exports.startChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ message: 'event_id is required' });
    }

    const event = await Event.findByPk(event_id, {
      attributes: ['id', 'organizer_id']
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const [room] = await ChatRoomMoreInfo.findOrCreate({
      where: {
        event_id,
        user_id: userId
      },
      defaults: {
        organizer_id: event.organizer_id
      }
    });

    res.json({
      chat_room_id: room.id,
      organizer_id: event.organizer_id
    });
  } catch (err) {
    console.error('Start chat error:', err);
    res.status(500).json({ message: 'Failed to start chat' });
  }
};

/**
 * GET /api/chats/:roomId/messages
 * Cursor-based message loading
 */
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { cursor } = req.query;

    if (!roomId) {
      return res.status(400).json({ message: 'roomId is required' });
    }

    const messages = await ChatMessage.findAll({
      where: {
        chat_room_id: roomId,
        ...(cursor && { id: { [Op.lt]: cursor } })
      },
      order: [['id', 'DESC']],
      limit: 30
    });

    res.json(messages.reverse());
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Failed to load messages' });
  }
};
