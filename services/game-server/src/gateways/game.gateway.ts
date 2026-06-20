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
import { WSEvent } from '@brom-casino/shared';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { SlotEngine } from '../games/slot/slot.engine';
import { CrashEngine } from '../games/crash/crash.engine';
import { DiceEngine } from '../games/dice/dice.engine';
import { PlinkoEngine } from '../games/plinko/plinko.engine';
import { SessionManager } from '../session/session.manager';
import { GameResult, GameType } from '../entities/game-result.entity';

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
  private crashInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly slotEngine: SlotEngine,
    private readonly crashEngine: CrashEngine,
    private readonly diceEngine: DiceEngine,
    private readonly plinkoEngine: PlinkoEngine,
    private readonly sessionManager: SessionManager,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Connection attempt without token: ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'brom-casino-secret-key-change-in-production',
      });

      client.userId = payload.sub;
      client.username = payload.email || payload.username || 'Player';
      this.connectedUsers.set(payload.sub, client.id);

      this.logger.log(`Client connected: ${client.userId} (${client.username})`);

      // Send initial data
      client.emit('connected', {
        userId: client.userId,
        username: client.username,
        balance: this.sessionManager.getBalance(client.userId),
      });
    } catch (error) {
      this.logger.warn(`Unauthorized connection attempt: ${client.id} — ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`Client disconnected: ${client.userId} (${client.username})`);
    }
  }

  // ===== Slot Game =====

  @SubscribeMessage(WSEvent.GAME_SPIN)
  async handleSlotSpin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { betAmount: number; clientSeed?: string },
  ) {
    if (!client.userId) {
      client.emit(WSEvent.GAME_ERROR, { code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }

    const { betAmount, clientSeed } = data;

    if (!betAmount || betAmount <= 0) {
      client.emit(WSEvent.GAME_ERROR, { code: 'INVALID_BET', message: 'Invalid bet amount' });
      return;
    }

    // Check balance
    const balance = this.sessionManager.getBalance(client.userId);
    if (balance < betAmount) {
      client.emit(WSEvent.GAME_ERROR, { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' });
      return;
    }

    // Get or create session
    let session = this.sessionManager.getUserSession(client.userId);
    if (!session) {
      const seedData = this.slotEngine.createSession(uuidv4(), clientSeed);
      session = this.sessionManager.createSession(
        client.userId,
        client.username,
        'SLOT',
        seedData.clientSeed,
        seedData.serverHash,
      );
    }

    // Perform spin
    const result = this.slotEngine.spin(session.id, betAmount);

    // Deduct bet, add win
    this.sessionManager.deductBalance(client.userId, betAmount);
    if (result.totalWin > 0) {
      this.sessionManager.addBalance(client.userId, result.totalWin);
    }

    // Record result
    const gameResult = new GameResult({
      sessionId: session.id,
      userId: client.userId,
      gameType: GameType.SLOT,
      betAmount,
      winAmount: result.totalWin,
      multiplier: result.multiplier,
      provablyFair: {
        serverSeed: '',
        clientSeed: result.clientSeed,
        nonce: result.nonce,
        hash: result.hash,
      },
      details: {
        grid: result.grid,
        winLines: result.winLines,
        isBonus: result.isBonus,
        freeSpinsWon: result.freeSpinsWon,
      },
    });
    this.sessionManager.recordResult(gameResult);

    // Send result
    client.emit(WSEvent.GAME_RESULT, {
      game: 'slot',
      ...result,
      balance: this.sessionManager.getBalance(client.userId),
    });

    // Send balance update
    this.sendBalanceUpdate(client.userId);
  }

  // ===== Crash Game =====

  @SubscribeMessage('crash:join')
  async handleCrashJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { betAmount: number; autoCashout?: number },
  ) {
    if (!client.userId) {
      client.emit(WSEvent.GAME_ERROR, { code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }

    const { betAmount, autoCashout } = data;

    if (!betAmount || betAmount <= 0) {
      client.emit(WSEvent.GAME_ERROR, { code: 'INVALID_BET', message: 'Invalid bet amount' });
      return;
    }

    const balance = this.sessionManager.getBalance(client.userId);
    if (balance < betAmount) {
      client.emit(WSEvent.GAME_ERROR, { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' });
      return;
    }

    // Deduct bet immediately
    this.sessionManager.deductBalance(client.userId, betAmount);

    // Create round if none exists
    if (!this.crashEngine.getCurrentRound() || this.crashEngine.getCurrentRound()!.status !== 'waiting') {
      this.crashEngine.startRound();
      this.startCrashRound();
    }

    // Place bet
    const bet = this.crashEngine.placeBet(
      client.userId,
      client.username!,
      betAmount,
      autoCashout || null,
    );

    if (bet) {
      client.join('crash-room');
      client.emit('crash:bet_placed', {
        betAmount,
        autoCashout: autoCashout || null,
        roundId: this.crashEngine.getCurrentRound()!.id,
        balance: this.sessionManager.getBalance(client.userId),
      });
      this.sendBalanceUpdate(client.userId);
    }
  }

  @SubscribeMessage('crash:cashout')
  async handleCrashCashout(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) return;

    const result = this.crashEngine.cashout(client.userId);
    if (result && result.success) {
      this.sessionManager.addBalance(client.userId, result.winAmount);

      // Record result
      const round = this.crashEngine.getCurrentRound();
      if (round) {
        const gameResult = new GameResult({
          sessionId: `crash-${round.id}`,
          userId: client.userId,
          gameType: GameType.CRASH,
          betAmount: 0, // Already deducted
          winAmount: result.winAmount,
          multiplier: result.multiplier,
          provablyFair: {
            serverSeed: '',
            clientSeed: round.clientSeed,
            nonce: round.nonce,
            hash: round.hash,
          },
          details: { crashPoint: round.crashPoint },
        });
        this.sessionManager.recordResult(gameResult);
      }

      client.emit('crash:cashout_result', {
        multiplier: result.multiplier,
        winAmount: result.winAmount,
        balance: this.sessionManager.getBalance(client.userId),
      });
      this.sendBalanceUpdate(client.userId);
    }
  }

  private startCrashRound() {
    const round = this.crashEngine.getCurrentRound();
    if (!round) return;

    // Wait 5 seconds for bets, then start
    setTimeout(() => {
      this.crashEngine.startGame();
      this.server.to('crash-room').emit('crash:starting', {
        roundId: round.id,
        hash: round.hash,
      });

      // Start ticking
      this.crashInterval = setInterval(() => {
        const tick = this.crashEngine.getTick();
        if (!tick) {
          if (this.crashInterval) clearInterval(this.crashInterval);
          return;
        }

        this.server.to('crash-room').emit(WSEvent.CRASH_TICK, tick);

        if (this.crashEngine.isCrashed()) {
          if (this.crashInterval) clearInterval(this.crashInterval);
          const endedRound = this.crashEngine.endRound();

          if (endedRound) {
            // Process losing bets
            for (const bet of endedRound.bets) {
              if (!bet.cashedOut) {
                const gameResult = new GameResult({
                  sessionId: `crash-${endedRound.id}`,
                  userId: bet.userId,
                  gameType: GameType.CRASH,
                  betAmount: bet.betAmount,
                  winAmount: 0,
                  multiplier: 0,
                  provablyFair: {
                    serverSeed: '',
                    clientSeed: endedRound.clientSeed,
                    nonce: endedRound.nonce,
                    hash: endedRound.hash,
                  },
                  details: { crashPoint: endedRound.crashPoint, lost: true },
                });
                this.sessionManager.recordResult(gameResult);
              }
            }

            this.server.to('crash-room').emit(WSEvent.CRASH_RESULT, {
              crashPoint: endedRound.crashPoint,
              hash: endedRound.hash,
              clientSeed: endedRound.clientSeed,
              nonce: endedRound.nonce,
              bets: endedRound.bets.map(b => ({
                userId: b.userId,
                username: b.username,
                betAmount: b.betAmount,
                cashedOut: b.cashedOut,
                cashoutMultiplier: b.cashoutMultiplier,
                winAmount: b.winAmount,
              })),
            });

            // Start new round after 3 seconds
            setTimeout(() => this.startCrashRound(), 3000);
          }
        }
      }, 50); // 50ms tick rate (20 updates/sec)
    }, 5000);
  }

  // ===== Dice Game =====

  @SubscribeMessage('dice:roll')
  async handleDiceRoll(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { betAmount: number; target: number; isOver: boolean; clientSeed?: string },
  ) {
    if (!client.userId) {
      client.emit(WSEvent.GAME_ERROR, { code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }

    const { betAmount, target, isOver, clientSeed } = data;

    if (!betAmount || betAmount <= 0) {
      client.emit(WSEvent.GAME_ERROR, { code: 'INVALID_BET', message: 'Invalid bet amount' });
      return;
    }

    if (target < 0.01 || target > 99.99) {
      client.emit(WSEvent.GAME_ERROR, { code: 'INVALID_TARGET', message: 'Target must be between 0.01 and 99.99' });
      return;
    }

    const balance = this.sessionManager.getBalance(client.userId);
    if (balance < betAmount) {
      client.emit(WSEvent.GAME_ERROR, { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' });
      return;
    }

    // Get or create session
    let session = this.sessionManager.getUserSession(client.userId);
    if (!session || session.gameType !== 'DICE') {
      const seedData = this.diceEngine.createSession(uuidv4(), clientSeed);
      session = this.sessionManager.createSession(
        client.userId,
        client.username,
        'DICE',
        seedData.clientSeed,
        seedData.serverHash,
      );
    }

    // Roll
    const result = this.diceEngine.roll(session.id, betAmount, target, isOver);

    // Update balance
    this.sessionManager.deductBalance(client.userId, betAmount);
    if (result.winAmount > 0) {
      this.sessionManager.addBalance(client.userId, result.winAmount);
    }

    // Record result
    const gameResult = new GameResult({
      sessionId: session.id,
      userId: client.userId,
      gameType: GameType.DICE,
      betAmount,
      winAmount: result.winAmount,
      multiplier: result.multiplier,
      provablyFair: {
        serverSeed: '',
        clientSeed: result.clientSeed,
        nonce: result.nonce,
        hash: result.hash,
      },
      details: {
        roll: result.result,
        target: result.target,
        isOver: result.isOver,
        won: result.won,
      },
    });
    this.sessionManager.recordResult(gameResult);

    client.emit(WSEvent.GAME_RESULT, {
      game: 'dice',
      ...result,
      balance: this.sessionManager.getBalance(client.userId),
    });

    this.sendBalanceUpdate(client.userId);
  }

  // ===== Plinko Game =====

  @SubscribeMessage('plinko:drop')
  async handlePlinkoDrop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { betAmount: number; rows?: number; risk?: 'low' | 'medium' | 'high'; clientSeed?: string },
  ) {
    if (!client.userId) {
      client.emit(WSEvent.GAME_ERROR, { code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }

    const { betAmount, rows = 8, risk = 'medium', clientSeed } = data;

    if (!betAmount || betAmount <= 0) {
      client.emit(WSEvent.GAME_ERROR, { code: 'INVALID_BET', message: 'Invalid bet amount' });
      return;
    }

    const balance = this.sessionManager.getBalance(client.userId);
    if (balance < betAmount) {
      client.emit(WSEvent.GAME_ERROR, { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' });
      return;
    }

    // Get or create session
    let session = this.sessionManager.getUserSession(client.userId);
    if (!session || session.gameType !== 'PLINKO') {
      const seedData = this.plinkoEngine.createSession(uuidv4(), clientSeed);
      session = this.sessionManager.createSession(
        client.userId,
        client.username,
        'PLINKO',
        seedData.clientSeed,
        seedData.serverHash,
      );
    }

    // Drop
    const result = this.plinkoEngine.drop(session.id, betAmount, rows, risk);

    // Update balance
    this.sessionManager.deductBalance(client.userId, betAmount);
    if (result.winAmount > 0) {
      this.sessionManager.addBalance(client.userId, result.winAmount);
    }

    // Record result
    const gameResult = new GameResult({
      sessionId: session.id,
      userId: client.userId,
      gameType: GameType.PLINKO,
      betAmount,
      winAmount: result.winAmount,
      multiplier: result.multiplier,
      provablyFair: {
        serverSeed: '',
        clientSeed: result.clientSeed,
        nonce: result.nonce,
        hash: result.hash,
      },
      details: {
        slot: result.slot,
        path: result.path,
        rows,
        risk,
      },
    });
    this.sessionManager.recordResult(gameResult);

    client.emit(WSEvent.GAME_RESULT, {
      game: 'plinko',
      ...result,
      balance: this.sessionManager.getBalance(client.userId),
    });

    this.sendBalanceUpdate(client.userId);
  }

  // ===== Session Management =====

  @SubscribeMessage('session:create')
  handleCreateSession(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameType: string; clientSeed?: string },
  ) {
    if (!client.userId) return;

    const { gameType, clientSeed } = data;
    let seedData: { serverHash: string; clientSeed: string };

    switch (gameType?.toUpperCase()) {
      case 'SLOT':
        seedData = this.slotEngine.createSession(uuidv4(), clientSeed);
        break;
      case 'DICE':
        seedData = this.diceEngine.createSession(uuidv4(), clientSeed);
        break;
      case 'PLINKO':
        seedData = this.plinkoEngine.createSession(uuidv4(), clientSeed);
        break;
      default:
        client.emit(WSEvent.GAME_ERROR, { code: 'INVALID_GAME', message: 'Unknown game type' });
        return;
    }

    const session = this.sessionManager.createSession(
      client.userId,
      client.username,
      gameType.toUpperCase(),
      seedData.clientSeed,
      seedData.serverHash,
    );

    client.emit('session:created', {
      sessionId: session.id,
      gameType: session.gameType,
      serverHash: session.serverHash,
      clientSeed: session.clientSeed,
    });
  }

  @SubscribeMessage('session:reveal')
  handleRevealSession(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) return;

    const session = this.sessionManager.getUserSession(client.userId);
    if (!session) {
      client.emit(WSEvent.GAME_ERROR, { code: 'NO_SESSION', message: 'No active session' });
      return;
    }

    let pf;
    switch (session.gameType) {
      case 'SLOT':
        pf = this.slotEngine.getProvablyFair(session.id);
        break;
      case 'DICE':
        pf = this.diceEngine.getProvablyFair(session.id);
        break;
      case 'PLINKO':
        pf = this.plinkoEngine.getProvablyFair(session.id);
        break;
    }

    if (pf) {
      const revealed = pf.reveal();
      client.emit('session:revealed', {
        sessionId: session.id,
        ...revealed,
      });
    }
  }

  // ===== Leaderboard =====

  @SubscribeMessage('leaderboard:get')
  handleGetLeaderboard(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { limit?: number },
  ) {
    const leaderboard = this.sessionManager.getLeaderboard(data?.limit || 10);
    client.emit('leaderboard:data', leaderboard);
  }

  // ===== Balance =====

  @SubscribeMessage('balance:get')
  handleGetBalance(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) return;
    this.sendBalanceUpdate(client.userId);
  }

  // ===== Utility Methods =====

  sendBalanceUpdate(userId: string) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(WSEvent.BALANCE_UPDATE, {
        balance: this.sessionManager.getBalance(userId).toFixed(2),
        currency: 'USDT',
      });
    }
  }

  sendGameResult(userId: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(WSEvent.GAME_RESULT, data);
    }
  }

  sendGameError(userId: string, error: { code: string; message: string }) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(WSEvent.GAME_ERROR, error);
    }
  }

  getOnlineCount(): number {
    return this.connectedUsers.size;
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
