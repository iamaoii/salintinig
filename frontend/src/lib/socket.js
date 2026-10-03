import { io } from 'socket.io-client';
import { getSocketUrl } from '../config/api.js';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}
