import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api.js';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE_URL || window.location.origin, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}
