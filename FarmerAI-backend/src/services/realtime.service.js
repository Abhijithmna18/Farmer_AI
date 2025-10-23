// src/services/realtime.service.js
const { Server } = require('socket.io');
let ioInstance = null;

function initRealtime(httpServer, allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']) {
  if (ioInstance) {
    return ioInstance;
  }
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  });

  io.on('connection', (socket) => {
    // Optional: auth can be added later
    // Rooms by role or ownerId can be implemented if needed
    socket.on('disconnect', () => {});
  });

  ioInstance = io;
  return ioInstance;
}

function getIO() {
  if (!ioInstance) throw new Error('Socket.IO not initialized');
  return ioInstance;
}

function emitWarehouseEvent(type, payload) {
  try {
    getIO().emit('warehouse:event', { type, payload, ts: Date.now() });
  } catch (_) {}
}

function emitBookingEvent(type, payload) {
  try {
    getIO().emit('booking:event', { type, payload, ts: Date.now() });
  } catch (_) {}
}

module.exports = { initRealtime, getIO, emitWarehouseEvent, emitBookingEvent };
