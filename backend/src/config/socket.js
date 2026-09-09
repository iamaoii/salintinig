const { Server } = require('socket.io');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    // Allow clients to join their specific user room or role room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('join_role', (role) => {
      if (role) {
        socket.join(`role:${role}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  console.log('⚡ Socket.io real-time server initialized.');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
}

function emitNotification(userId, notificationData) {
  if (!io) return;
  if (userId) {
    // Send to specific user
    io.to(`user:${userId}`).emit('notification:new', notificationData);
  } else {
    // Broadcast to all connected clients
    io.emit('notification:new', notificationData);
  }
  io.emit('notifications:updated');
}

module.exports = {
  initSocket,
  getIO,
  emitNotification,
};
