const jwt = require('jsonwebtoken');
const { ChatRoomMoreInfo, ChatMessage } = require('../models');

const onlineUsers = new Map(); // OK for single server

module.exports = io => {

  /**
   * AUTH MIDDLEWARE FOR SOCKET
   */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id };

      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', socket => {
    const userId = socket.user.id;

    // Mark user online
    onlineUsers.set(userId, socket.id);

    /**
     * JOIN CHAT ROOM
     */
    socket.on('join-room', async roomId => {
      try {
        const room = await ChatRoomMoreInfo.findOne({
          where: {
            id: roomId,
            [require('sequelize').Op.or]: [
              { user_id: userId },
              { organizer_id: userId }
            ]
          }
        });

        if (!room) {
          return socket.emit('error', 'Access denied');
        }

        socket.join(`chat:${roomId}`);
      } catch (err) {
        console.error('Join room error:', err);
        socket.emit('error', 'Failed to join room');
      }
    });

    /**
     * SEND MESSAGE
     */
    socket.on('send-message', async payload => {
      try {
        const { roomId, message } = payload;

        if (!roomId || !message) {
          return socket.emit('error', 'Invalid payload');
        }

        // Validate membership
        const room = await ChatRoomMoreInfo.findOne({
          where: {
            id: roomId,
            [require('sequelize').Op.or]: [
              { user_id: userId },
              { organizer_id: userId }
            ]
          }
        });

        if (!room) {
          return socket.emit('error', 'Unauthorized');
        }

        const msg = await ChatMessage.create({
          chat_room_id: roomId,
          sender_id: userId,
          message
        });

        io.to(`chat:${roomId}`).emit('new-message', {
          id: msg.id,
          chat_room_id: roomId,
          sender_id: userId,
          message: msg.message,
          created_at: msg.created_at
        });

      } catch (err) {
        console.error('Send message error:', err);
        socket.emit('error', 'Message send failed');
      }
    });

    /**
     * DISCONNECT
     */
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
    });
  });
};
