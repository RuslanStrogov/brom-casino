import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WSEvent } from '@brom-casino/shared';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private readonly connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.userId = payload.sub;
      client.username = payload.email || 'Anonymous';
      this.connectedUsers.set(payload.sub, client.id);

      this.logger.log(`Client connected: ${client.userId} (${client.id})`);
    } catch (error) {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`Client disconnected: ${client.userId}`);
    }
  }

  // Send balance update to specific user
  sendBalanceUpdate(userId: string, data: { balance: string; bonusBalance: string; currency: string }) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(WSEvent.BALANCE_UPDATE, data);
    }
  }

  // Send game result to specific user
  sendGameResult(userId: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(WSEvent.GAME_RESULT, data);
    }
  }

  // Send game error to specific user
  sendGameError(userId: string, error: { code: string; message: string }) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(WSEvent.GAME_ERROR, error);
    }
  }

  // Broadcast crash game tick to all in room
  broadcastCrashTick(room: string, data: { multiplier: number; elapsed: number }) {
    this.server.to(room).emit(WSEvent.CRASH_TICK, data);
  }

  // Broadcast crash game result to all in room
  broadcastCrashResult(room: string, data: { crashPoint: number; bets: any[] }) {
    this.server.to(room).emit(WSEvent.CRASH_RESULT, data);
  }

  // Broadcast chat message
  broadcastChatMessage(room: string, data: { userId: string; username: string; message: string; timestamp: Date }) {
    this.server.to(room).emit(WSEvent.CHAT_NEW_MESSAGE, data);
  }

  // Send notification to specific user
  sendNotification(userId: string, data: { type: string; title: string; message: string }) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(WSEvent.NOTIFICATION, data);
    }
  }

  // Broadcast notification to all connected users
  broadcastNotification(data: { type: string; title: string; message: string }) {
    this.server.emit(WSEvent.NOTIFICATION, data);
  }

  // Get online users count
  getOnlineCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
