// src/sockets/socketServer.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Message, ChatRoom, User } = require('../config/models');

function initSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*' }, // restrict in prod
    maxHttpBufferSize: 1e6
  });

  // middleware: authenticate socket using token sent in handshake (socket.handshake.auth.token)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error'));
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
      if (!payload || !payload.id) return next(new Error('Authentication error'));
      const user = await User.findByPk(payload.id, { attributes: ['id','name','avatar_url'] });
      if (!user) return next(new Error('Authentication error'));
      socket.user = user.toJSON();
      return next();
    } catch (err) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`socket connected: ${socket.id} user ${socket.user.id}`);

    socket.on('join_room', async ({ room }) => {
      if (!room) return;
      socket.join(room);
      // optionally persist participant
      try {
        const roomRow = await ChatRoom.findOne({ where: { id: room } });
        // if chat rooms are event_<id> style, you may parse numeric id
        // Save participant
        // await ChatRoomParticipant.findOrCreate({ where: { room_id: room, user_id: socket.user.id } });
      } catch (err) { console.error(err); }
      socket.to(room).emit('user_joined', { user: socket.user, room });
    });

    socket.on('leave_room', ({ room }) => {
      if (!room) return;
      socket.leave(room);
      socket.to(room).emit('user_left', { user: socket.user, room });
    });

    // send_message event with { room, message, attachments }
    socket.on('send_message', async (payload) => {
      try {
        const { room, message, attachments } = payload;
        if (!room || !message || message.trim().length === 0) return;
        // rate limit / anti-spam should be applied here

        const saved = await Message.create({
          room_id: room,
          sender_id: socket.user.id,
          message,
          attachments: attachments ? JSON.stringify(attachments) : null
        });

        const msgOut = {
          id: saved.id,
          room_id: saved.room_id,
          sender: { id: socket.user.id, name: socket.user.name, avatar_url: socket.user.avatar_url },
          message: saved.message,
          attachments: attachments || null,
          created_at: saved.created_at
        };

        io.to(room).emit('new_message', msgOut);
      } catch (err) {
        console.error('send_message error', err);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`socket disconnected: ${socket.id} reason:${reason}`);
    });
  });

  return io;
}

module.exports = { initSocket };
