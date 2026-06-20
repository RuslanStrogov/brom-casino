import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { GameServerModule } from './game-server.module';

class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    const server = new Server(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(GameServerModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // Enable CORS for HTTP
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  });

  // Use custom Socket.io adapter
  app.useWebSocketAdapter(new SocketIoAdapter(app));

  const port = process.env.GAME_SERVER_PORT || 4001;

  await app.listen(port);

  console.log('');
  console.log('🎰 Brom Casino Game Server');
  console.log('═══════════════════════════════════');
  console.log(`📡 WebSocket server running on port ${port}`);
  console.log(`🎮 Game namespace: ws://localhost:${port}/game`);
  console.log(`💬 Chat namespace: ws://localhost:${port}/chat`);
  console.log(`🔑 JWT auth: enabled`);
  console.log(`🎲 Provably fair: enabled`);
  console.log('═══════════════════════════════════');
  console.log('');
  console.log('Available games:');
  console.log('  🎰 Slot (5x3, 9 paylines, 96% RTP)');
  console.log('  ✈️  Crash (real-time multiplier)');
  console.log('  🎲 Dice (0.00-99.99, over/under)');
  console.log('  🔵 Plinko (8/12/16 rows, 3 risk levels)');
  console.log('');
}

bootstrap().catch((err) => {
  console.error('Failed to start game server:', err);
  process.exit(1);
});
