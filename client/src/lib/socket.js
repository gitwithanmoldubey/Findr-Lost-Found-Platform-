import { io } from 'socket.io-client';
import { API_BASE } from './api';

let socket;
const SOCKET_ENABLED = import.meta.env.VITE_ENABLE_SOCKET === 'true';

export function connectSocket(userId) {
  if (!SOCKET_ENABLED) return null;
  if (!socket) {
    socket = io(API_BASE, {
      reconnectionAttempts: 2,
      timeout: 3000
    });
  }
  if (userId) {
    socket.emit('auth:join', { userId });
  }
  return socket;
}

export function getSocket() {
  return socket;
}
