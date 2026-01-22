import { io, Socket } from 'socket.io-client';
import type { Person, Link, FeatureRequest } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export type SocketEventHandlers = {
  onPersonCreated?: (person: Person) => void;
  onPersonUpdated?: (person: Person) => void;
  onPersonDeleted?: (data: { id: string }) => void;
  onLinkCreated?: (link: Link) => void;
  onLinkUpdated?: (link: Link) => void;
  onLinkDeleted?: (data: { id: string }) => void;
  onFeatureRequestCreated?: (request: FeatureRequest) => void;
  onFeatureRequestDeleted?: (data: { id: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

export function initializeSocket(handlers: SocketEventHandlers): Socket {
  if (socket) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Connected to server');
    handlers.onConnect?.();
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    handlers.onDisconnect?.();
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

  // Person events
  socket.on('person:created', (person: Person) => {
    handlers.onPersonCreated?.(person);
  });

  socket.on('person:updated', (person: Person) => {
    handlers.onPersonUpdated?.(person);
  });

  socket.on('person:deleted', (data: { id: string }) => {
    handlers.onPersonDeleted?.(data);
  });

  // Link events
  socket.on('link:created', (link: Link) => {
    handlers.onLinkCreated?.(link);
  });

  socket.on('link:updated', (link: Link) => {
    handlers.onLinkUpdated?.(link);
  });

  socket.on('link:deleted', (data: { id: string }) => {
    handlers.onLinkDeleted?.(data);
  });

  // Feature request events
  socket.on('featureRequest:created', (request: FeatureRequest) => {
    handlers.onFeatureRequestCreated?.(request);
  });

  socket.on('featureRequest:deleted', (data: { id: string }) => {
    handlers.onFeatureRequestDeleted?.(data);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
