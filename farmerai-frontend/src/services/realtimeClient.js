// src/services/realtimeClient.js
import { io } from 'socket.io-client';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5002').replace(/\/$/, '');
let socket;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE, {
      withCredentials: true,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function onWarehouseEvent(handler) {
  const s = getSocket();
  s.on('warehouse:event', handler);
  return () => s.off('warehouse:event', handler);
}

export function onBookingEvent(handler) {
  const s = getSocket();
  s.on('booking:event', handler);
  return () => s.off('booking:event', handler);
}