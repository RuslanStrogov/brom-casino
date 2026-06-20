import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface ChatUser {
  userId: string;
  username: string;
  socketId: string;
  joinedAt: Date;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  room: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers: Map<string, ChatUser> = new Map(); // socketId -> ChatUser
  private readonly messageHistory: ChatMessage[] = [];
  private readonly MAX_HISTORY = 100;
  private readonly MAX_MESSAGE_LENGTH = 500;

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId || client.handshake.query?.userId as string;
    const username = client.handshake.auth?.username || client.handshake.query?.username as string || 'Anonymous';

    if (!userId) {
      this.logger.warn(`Chat connection without userId: ${client.id}`);
      // Allow connection but with limited access
    }

    const chatUser: ChatUser = {
      userId: userId || `guest-${client.id.substring(0, 8)}`,
      username: username || `Guest_${client.id.substring(0, 6)}`,
      socketId: client.id,
      joinedAt: new Date(),
    };

    this.connectedUsers.set(client.id, chatUser);
    client.join('general');

    this.logger.log(`Chat user connected: ${chatUser.username} (${chatUser.userId})`);

    // Send recent history to new user
    client.emit('chat:history', this.messageHistory.slice(-50));

    // Announce join
    this.broadcastSystemMessage(`${chatUser.username} joined the chat`, 'general');

    // Update online users list
    this.broadcastOnlineUsers();
  }

  handleDisconnect(client: Socket) {
    const chatUser = this.connectedUsers.get(client.id);
    if (chatUser) {
      this.connectedUsers.delete(client.id);
      this.logger.log(`Chat user disconnected: ${chatUser.username}`);
      this.broadcastSystemMessage(`${chatUser.username} left the chat`, 'general');
      this.broadcastOnlineUsers();
    }
  }

  @SubscribeMessage('chat:message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string; room?: string },
  ) {
    const chatUser = this.connectedUsers.get(client.id);
    if (!chatUser) return;

    const { message, room = 'general' } = data;

    // Validate message
    if (!message || typeof message !== 'string') {
      client.emit('chat:error', { code: 'INVALID_MESSAGE', message: 'Message is required' });
      return;
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) return;
    if (trimmed.length > this.MAX_MESSAGE_LENGTH) {
      client.emit('chat:error', { code: 'MESSAGE_TOO_LONG', message: `Message must be under ${this.MAX_MESSAGE_LENGTH} characters` });
      return;
    }

    // Simple profanity filter could go here

    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: chatUser.userId,
      username: chatUser.username,
      message: trimmed,
      timestamp: new Date(),
      room,
    };

    // Store in history
    this.messageHistory.push(chatMessage);
    if (this.messageHistory.length > this.MAX_HISTORY) {
      this.messageHistory.shift();
    }

    // Broadcast to room
    this.server.to(room).emit('chat:new_message', {
      id: chatMessage.id,
      userId: chatMessage.userId,
      username: chatMessage.username,
      message: chatMessage.message,
      timestamp: chatMessage.timestamp,
    });
  }

  @SubscribeMessage('chat:join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    const chatUser = this.connectedUsers.get(client.id);
    if (!chatUser) return;

    const { room } = data;
    if (!room || typeof room !== 'string') return;

    client.join(room);
    this.broadcastSystemMessage(`${chatUser.username} joined ${room}`, room);
  }

  @SubscribeMessage('chat:leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    const chatUser = this.connectedUsers.get(client.id);
    if (!chatUser) return;

    const { room } = data;
    if (!room || typeof room !== 'string') return;

    client.leave(room);
    this.broadcastSystemMessage(`${chatUser.username} left ${room}`, room);
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { isTyping: boolean },
  ) {
    const chatUser = this.connectedUsers.get(client.id);
    if (!chatUser) return;

    client.broadcast.emit('chat:typing', {
      userId: chatUser.userId,
      username: chatUser.username,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('chat:get_online')
  handleGetOnline(@ConnectedSocket() client: Socket) {
    this.broadcastOnlineUsersTo(client.id);
  }

  private broadcastSystemMessage(content: string, room: string) {
    this.server.to(room).emit('chat:system', {
      content,
      timestamp: new Date(),
      room,
    });
  }

  private broadcastOnlineUsers() {
    const users = Array.from(this.connectedUsers.values()).map(u => ({
      userId: u.userId,
      username: u.username,
    }));

    // Deduplicate by userId
    const unique = Array.from(new Map(users.map(u => [u.userId, u])).values());

    this.server.emit('chat:online_users', {
      count: unique.length,
      users: unique,
    });
  }

  private broadcastOnlineUsersTo(socketId: string) {
    const users = Array.from(this.connectedUsers.values()).map(u => ({
      userId: u.userId,
      username: u.username,
    }));
    const unique = Array.from(new Map(users.map(u => [u.userId, u])).values());

    this.server.to(socketId).emit('chat:online_users', {
      count: unique.length,
      users: unique,
    });
  }

  getOnlineCount(): number {
    const uniqueUsers = new Set<string>();
    for (const user of this.connectedUsers.values()) {
      uniqueUsers.add(user.userId);
    }
    return uniqueUsers.size;
  }
}
