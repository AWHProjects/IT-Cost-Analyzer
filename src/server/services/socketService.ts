import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { SOCKET_EVENTS } from '../../shared/constants';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const setupSocketHandlers = (io: SocketIOServer): void => {
  io.on(SOCKET_EVENTS.CONNECTION, (socket: any) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle user authentication for socket
    socket.on('authenticate', (data: { token: string }) => {
      try {
        // TODO: Implement JWT token verification
        // For now, we'll accept any token
        socket.userId = data.token; // This should be the actual user ID from JWT
        socket.join(`user_${socket.userId}`);
        logger.info(`User authenticated: ${socket.userId}`);
        
        socket.emit('authenticated', { success: true });
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        socket.emit('authentication_error', { message: 'Invalid token' });
      }
    });

    // Handle joining specific rooms
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomName: string) => {
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined room: ${roomName}`);
      socket.emit('joined_room', { room: roomName });
    });

    // Handle leaving rooms
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomName: string) => {
      socket.leave(roomName);
      logger.info(`Socket ${socket.id} left room: ${roomName}`);
      socket.emit('left_room', { room: roomName });
    });

    // Handle disconnection
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Global error handler
  io.engine.on('connection_error', (err: any) => {
    logger.error('Socket.IO connection error:', {
      message: err.message,
      description: err.description,
      context: err.context,
      type: err.type
    });
  });
};

// Utility functions for emitting events
export class SocketService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  // Emit to a specific user
  emitToUser(userId: string, event: string, data: any): void {
    this.io.to(`user_${userId}`).emit(event, data);
    logger.debug(`Emitted ${event} to user ${userId}`, data);
  }

  // Emit to all users in a room
  emitToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
    logger.debug(`Emitted ${event} to room ${room}`, data);
  }

  // Emit to all connected clients
  emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
    logger.debug(`Emitted ${event} to all clients`, data);
  }

  // Emit new alert notification
  emitNewAlert(userId: string, alert: any): void {
    this.emitToUser(userId, SOCKET_EVENTS.NEW_ALERT, alert);
  }

  // Emit cost update notification
  emitCostUpdate(userId: string, costData: any): void {
    this.emitToUser(userId, SOCKET_EVENTS.COST_UPDATE, costData);
  }

  // Emit sync completion notification
  emitSyncComplete(userId: string, syncData: any): void {
    this.emitToUser(userId, SOCKET_EVENTS.SYNC_COMPLETE, syncData);
  }

  // Emit file processing completion
  emitFileProcessed(userId: string, fileData: any): void {
    this.emitToUser(userId, SOCKET_EVENTS.FILE_PROCESSED, fileData);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.io.engine.clientsCount;
  }

  // Get clients in a specific room
  async getClientsInRoom(room: string): Promise<string[]> {
    const sockets = await this.io.in(room).fetchSockets();
    return sockets.map(socket => socket.id);
  }

  // Disconnect a specific user
  disconnectUser(userId: string): void {
    this.io.to(`user_${userId}`).disconnectSockets();
    logger.info(`Disconnected all sockets for user: ${userId}`);
  }
}

// Export singleton instance
let socketService: SocketService;

export const initializeSocketService = (io: SocketIOServer): SocketService => {
  socketService = new SocketService(io);
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error('Socket service not initialized. Call initializeSocketService first.');
  }
  return socketService;
};