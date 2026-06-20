import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { GameCategory, Volatility, PaginationMeta, ProvablyFairData } from '@brom-casino/shared';
import { GameProvider } from './providers/base.provider';
import * as crypto from 'crypto';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
    private readonly pragmaticPlayProvider: GameProvider,
  ) {}

  async listGames(opts: {
    page: number;
    limit: number;
    category?: string;
    provider?: string;
    featured?: boolean;
    search?: string;
  }) {
    const where: any = { isActive: true };

    if (opts.category) where.category = opts.category;
    if (opts.provider) where.providerId = opts.provider;
    if (opts.featured !== undefined) where.isFeatured = opts.featured;
    if (opts.search) {
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { tags: { has: opts.search } },
      ];
    }

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          thumbnailUrl: true,
          bannerUrl: true,
          providerId: true,
          rtp: true,
          volatility: true,
          minBet: true,
          maxBet: true,
          isFeatured: true,
          isNew: true,
          isJackpot: true,
          freeSpins: true,
          demoAvailable: true,
          tags: true,
        },
      }),
      this.prisma.game.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    };

    return { games, meta };
  }

  async getCategories() {
    return Object.values(GameCategory);
  }

  async getProviders() {
    const providers = await this.prisma.game.groupBy({
      by: ['providerId'],
      where: { isActive: true },
      _count: { id: true },
    });

    return providers.map((p) => ({
      id: p.providerId,
      gameCount: p._count.id,
    }));
  }

  async getGame(slug: string) {
    const game = await this.prisma.game.findUnique({ where: { slug } });
    if (!game) throw new NotFoundException('Game not found');
    return game;
  }

  async launchGame(userId: string, slug: string, mode: 'real' | 'demo') {
    const game = await this.prisma.game.findUnique({ where: { slug } });
    if (!game) throw new NotFoundException('Game not found');
    if (!game.isActive) throw new BadRequestException('Game is not available');

    // Generate provably fair data for in-house games
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const serverHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
    const clientSeed = crypto.randomBytes(16).toString('hex');

    const sessionToken = crypto.randomUUID();

    const session = await this.prisma.gameSession.create({
      data: {
        userId,
        gameId: game.id,
        sessionToken,
        mode,
        serverSeed: game.providerId === 'in-house' ? serverSeed : null,
        serverHash: game.providerId === 'in-house' ? serverHash : null,
        clientSeed: game.providerId === 'in-house' ? clientSeed : null,
      },
    });

    // For third-party providers, get launch URL
    let launchUrl: string | undefined;
    if (game.providerId === 'pragmatic-play') {
      launchUrl = await this.pragmaticPlayProvider.getLaunchUrl(game.externalId, {
        userId,
        mode,
        sessionToken,
      });
    }

    return {
      sessionToken: session.sessionToken,
      mode: session.mode,
      launchUrl,
      serverHash: session.serverHash,
      clientSeed: session.clientSeed,
      game: {
        id: game.id,
        name: game.name,
        slug: game.slug,
        category: game.category,
        minBet: game.minBet,
        maxBet: game.maxBet,
        rtp: game.rtp,
        volatility: game.volatility,
      },
    };
  }

  async spin(userId: string, slug: string, dto: { betAmount: string; lines?: number }) {
    const game = await this.prisma.game.findUnique({ where: { slug } });
    if (!game) throw new NotFoundException('Game not found');
    if (game.providerId !== 'in-house') {
      throw new BadRequestException('Direct spin is only available for in-house games');
    }

    const betAmount = Number(dto.betAmount);
    if (betAmount < Number(game.minBet) || betAmount > Number(game.maxBet)) {
      throw new BadRequestException(`Bet must be between ${game.minBet} and ${game.maxBet}`);
    }

    // Check balance
    const balance = await this.walletService.getBalance(userId);
    if (Number(balance.balance) < betAmount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Get active session
    const session = await this.prisma.gameSession.findFirst({
      where: { userId, gameId: game.id, mode: 'real', endedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) {
      throw new BadRequestException('No active game session. Launch the game first.');
    }

    // Deduct bet
    await this.walletService.debit(userId, betAmount, 'BET', `Spin on ${game.name}`);

    // Increment nonce
    const nonce = session.nonce + 1;
    await this.prisma.gameSession.update({
      where: { id: session.id },
      data: { nonce, totalBet: { increment: betAmount } },
    });

    // Calculate result using provably fair
    const result = this.calculateSpinResult(
      session.serverSeed!,
      session.clientSeed!,
      nonce,
      game.config as any,
    );

    // Credit win
    if (result.totalWin > 0) {
      await this.walletService.credit(userId, result.totalWin, 'WIN', `Win on ${game.name}`);
      await this.prisma.gameSession.update({
        where: { id: session.id },
        data: { totalWin: { increment: result.totalWin } },
      });
    }

    // Record bet
    await this.prisma.bet.create({
      data: {
        userId,
        gameId: game.id,
        gameSessionId: session.id,
        amount: betAmount,
        winAmount: result.totalWin,
        multiplier: result.multiplier,
        serverSeed: session.serverSeed,
        serverHash: session.serverHash,
        clientSeed: session.clientSeed,
        nonce,
        result: result as any,
        provablyFair: {
          serverSeed: session.serverSeed,
          clientSeed: session.clientSeed,
          nonce,
        } as any,
      },
    });

    return {
      reels: result.reels,
      winLines: result.winLines,
      totalWin: result.totalWin,
      multiplier: result.multiplier,
      isBonus: result.isBonus,
      freeSpinsWon: result.freeSpinsWon,
      nonce,
      serverHash: session.serverHash,
    };
  }

  async getSession(sessionToken: string, userId: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { sessionToken },
      include: { game: { select: { name: true, slug: true } } },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new BadRequestException('Access denied');

    return session;
  }

  /**
   * Get Pragmatic Play launch URL for a specific game.
   * Uses the PP Integration Service v3 to get a real iframe URL.
   */
  async getPragmaticPlayLaunchUrl(
    userId: string,
    gameId: string,
    mode: 'real' | 'demo',
    currency: string = 'USDT',
    language: string = 'en',
  ): Promise<{ url: string; gameId: string; provider: string }> {
    const game = await this.prisma.game.findFirst({
      where: { externalId: gameId, providerId: 'pragmatic-play' },
    });

    if (!game) {
      throw new NotFoundException('Pragmatic Play game not found');
    }

    const launchUrl = await this.pragmaticPlayProvider.getLaunchUrl(game.externalId, {
      userId,
      mode,
      currency,
      language,
    });

    return {
      url: launchUrl,
      gameId: game.externalId,
      provider: 'pragmatic-play',
    };
  }

  private calculateSpinResult(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    config: any,
  ) {
    // Provably fair result calculation
    const hash = crypto
      .createHmac('sha256', serverSeed)
      .update(`${clientSeed}:${nonce}`)
      .digest('hex');

    // Use hash to determine reel positions
    const reelsCount = config?.reels || 5;
    const rowsCount = config?.rows || 3;
    const symbols = config?.symbols || ['9', '10', 'J', 'Q', 'K', 'A', 'WILD', 'SCATTER', 'BONUS'];

    const reels: string[][] = [];
    for (let r = 0; r < reelsCount; r++) {
      const reel: string[] = [];
      for (let row = 0; row < rowsCount; row++) {
        const hashSlice = hash.substring((r * rowsCount + row) * 2, (r * rowsCount + row) * 2 + 8);
        const index = parseInt(hashSlice, 16) % symbols.length;
        reel.push(symbols[index]);
      }
      reels.push(reel);
    }

    // Simplified win calculation
    const totalWin = 0;
    const winLines: any[] = [];
    const multiplier = 0;
    const isBonus = false;
    const freeSpinsWon = 0;

    return { reels, winLines, totalWin, multiplier, isBonus, freeSpinsWon };
  }
}
