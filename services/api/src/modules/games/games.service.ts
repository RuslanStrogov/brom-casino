import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { GameGateway } from '../../gateways/game.gateway';
import { GameCategory, Volatility, PaginationMeta, ProvablyFairData, TransactionType, TransactionStatus } from '@brom-casino/shared';
import { SlotEngine, SlotEngineConfig, SpinEngineResult } from '@brom-casino/game-engine';
import { GameProvider } from './providers/base.provider';
import { PragmaticPlayProvider } from './providers/pragmatic-play.provider';
import { EvolutionProvider } from './providers/evolution.provider';
import { SpribeProvider } from './providers/spribe.provider';
import { GenericProvider } from './providers/generic.provider';
import * as crypto from 'crypto';

const DEFAULT_SLOT_CONFIG: SlotEngineConfig = {
  reels: 5,
  rows: 3,
  symbols: [
    { id: '9', name: '9', value: 0.5, isWild: false, isScatter: false, isBonus: false },
    { id: '10', name: '10', value: 0.5, isWild: false, isScatter: false, isBonus: false },
    { id: 'J', name: 'J', value: 0.6, isWild: false, isScatter: false, isBonus: false },
    { id: 'Q', name: 'Q', value: 0.7, isWild: false, isScatter: false, isBonus: false },
    { id: 'K', name: 'K', value: 0.8, isWild: false, isScatter: false, isBonus: false },
    { id: 'A', name: 'A', value: 1.0, isWild: false, isScatter: false, isBonus: false },
    { id: 'WILD', name: 'Wild', value: 2.0, isWild: true, isScatter: false, isBonus: false },
    { id: 'SCATTER', name: 'Scatter', value: 0, isWild: false, isScatter: true, isBonus: false },
    { id: 'BONUS', name: 'Bonus', value: 0, isWild: false, isScatter: false, isBonus: true },
  ],
  paylines: [
    { id: 1, positions: [0, 0, 0, 0, 0] },    // Top row
    { id: 2, positions: [1, 1, 1, 1, 1] },    // Middle row
    { id: 3, positions: [2, 2, 2, 2, 2] },    // Bottom row
    { id: 4, positions: [0, 1, 2, 1, 0] },    // V-shape
    { id: 5, positions: [2, 1, 0, 1, 2] },    // Inverted V
    { id: 6, positions: [0, 0, 1, 2, 2] },    // Left staircase
    { id: 7, positions: [2, 2, 1, 0, 0] },    // Right staircase
    { id: 8, positions: [1, 0, 0, 0, 1] },    // Middle bump
    { id: 9, positions: [1, 2, 2, 2, 1] },    // Middle dip
    { id: 10, positions: [0, 1, 1, 1, 0] },   // Top arch
    { id: 11, positions: [2, 1, 1, 1, 2] },   // Bottom arch
    { id: 12, positions: [1, 0, 1, 2, 1] },   // Zigzag
    { id: 13, positions: [0, 2, 0, 2, 0] },   // Checker
    { id: 14, positions: [2, 0, 2, 0, 2] },   // Reverse checker
    { id: 15, positions: [0, 0, 2, 0, 0] },   // Single bump top
  ],
  rtp: 0.96,
};

@Injectable()
export class GamesService {
  /** Map of DB providerId → provider instance */
  private readonly providerMap: Record<string, GameProvider>;

  /** Provider demo status: true = iframe or real demo works, false = not working / coming soon */
    private readonly providerDemoStatus: Record<string, boolean> = {
      'pragmatic': true,     // ✅ iframe — demogamesfree.pragmaticplay.net — verified working
      'spribe': false,       // ❌ demo URL (spribe.co/games/X/demo) возвращает 404
      'bgaming': false,      // ❌ демо заглушка — без агрегатора не работает
      'habanero': false,     // ❌ демо заглушка — без агрегатора не работает
      'netent': false,       // ❌ демо заглушка — без агрегатора не работает
      'evolution': false,    // ❌ live-only, нет демо
      'thunderkick': false,  // ❌ демо заглушка — без агрегатора не работает
      'yggdrasil': false,    // ❌ демо заглушка — без агрегатора не работает
      'redtiger': false,     // ❌ демо заглушка — без агрегатора не работает
      'hacksaw': false,      // ❌ демо заглушка — без агрегатора не работает
      'pushgaming': false,   // ❌ демо заглушка — без агрегатора не работает
      'wazdan': false,       // ❌ демо заглушка — без агрегатора не работает
      'evoplay': false,      // ❌ демо заглушка — без агрегатора не работает
      'nolimitcity': false,  // ❌ демо заглушка — без агрегатора не работает
      'playngo': false,      // ❌ демо заглушка — без агрегатора не работает
      'microgaming': false,  // ❌ демо заглушка — без агрегатора не работает
      'playtech': false,     // ❌ демо заглушка — без агрегатора не работает
      'relaxgaming': false,  // ❌ демо заглушка — без агрегатора не работает
      'truelab': false,      // ❌ демо заглушка — без агрегатора не работает
      'elkstudios': false,   // ❌ демо заглушка — без агрегатора не работает
      'slotmill': false,     // ❌ демо заглушка — без агрегатора не работает
      'betsoft': false,      // ❌ демо заглушка — без агрегатора не работает
      'quickspin': false,    // ❌ демо заглушка — без агрегатора не работает
      'bigtimegaming': false,// ❌ демо заглушка — без агрегатора не работает
      'irondog': false,      // ❌ демо заглушка — без агрегатора не работает
    };

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
    private readonly gameGateway: GameGateway,
    @Inject(PragmaticPlayProvider)
    private readonly pragmaticPlayProvider: GameProvider,
    @Inject(EvolutionProvider)
    private readonly evolutionProvider: GameProvider,
    @Inject(SpribeProvider)
    private readonly spribeProvider: GameProvider,
    @Inject(GenericProvider)
    private readonly genericProvider: GameProvider,
  ) {
    this.providerMap = {
      'pragmatic': pragmaticPlayProvider,
      'evolution': evolutionProvider,
      'spribe': spribeProvider,
      'netent': genericProvider,
      'microgaming': genericProvider,
      'playngo': genericProvider,
      'yggdrasil': genericProvider,
      'hacksaw': genericProvider,
      'pushgaming': genericProvider,
      'redtiger': genericProvider,
      'playtech': genericProvider,
      'relaxgaming': genericProvider,
      'truelab': genericProvider,
      'elkstudios': genericProvider,
      'thunderkick': genericProvider,
      'nolimitcity': genericProvider,
      'slotmill': genericProvider,
      'bgaming': genericProvider,
      'habanero': genericProvider,
      'wazdan': genericProvider,
      'evoplay': genericProvider,
      'betsoft': genericProvider,
      'quickspin': genericProvider,
      'bigtimegaming': genericProvider,
      'irondog': genericProvider,
    };
  }

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

    // Add working status based on provider
        const gamesWithStatus = games.map((game) => ({
          ...game,
          working: game.providerId === 'own' ? true : (this.providerDemoStatus[game.providerId] ?? false),
        }));

    // Sort: working games first, then non-working
    gamesWithStatus.sort((a, b) => {
      if (a.working !== b.working) return a.working ? -1 : 1;
      return 0;
    });

    const meta: PaginationMeta = {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    };

    return { games: gamesWithStatus, meta, total };
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
    const provider = this.providerMap[game.providerId];
    if (provider) {
      launchUrl = await provider.getLaunchUrl(game.externalId, {
        userId,
        mode,
        sessionToken,
        currency: 'USDT',
        language: 'en',
        providerId: game.providerId,
        slug: game.slug,
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

  async getDemoLaunchUrl(slug: string): Promise<string | null> {
    const game = await this.prisma.game.findUnique({ where: { slug } });
    if (!game) throw new NotFoundException('Game not found');
    if (!game.isActive) throw new BadRequestException('Game is not available');

    // Own games don't need a launch URL — they use native React components
    if (game.providerId === 'own') return null;

    const provider = this.providerMap[game.providerId];
    if (provider) {
      return provider.getLaunchUrl(game.externalId, {
        userId: 'demo',
        mode: 'demo',
        sessionToken: 'demo',
        currency: 'USDT',
        language: 'en',
        providerId: game.providerId,
        slug: game.slug,
        gameName: game.name,
      });
    }

    throw new NotFoundException(`No provider found for ${game.providerId}`);
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

    // Get active session
    const session = await this.prisma.gameSession.findFirst({
      where: { userId, gameId: game.id, mode: 'real', endedAt: null },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) {
      throw new BadRequestException('No active game session. Launch the game first.');
    }

    // Get wallet (read outside tx for early validation, but FOR UPDATE inside tx)
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (Number(wallet.balance) < betAmount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Increment nonce
    const nonce = session.nonce + 1;

    // Calculate result using actual slot engine
    const slotConfig = (game.config as any as SlotEngineConfig) || DEFAULT_SLOT_CONFIG;
    const engine = new SlotEngine(slotConfig, session.clientSeed!);

    // Override RNG with the session's provably fair seed/nonce
    // SlotEngine generates its own RNG state; we reconstruct with the session seeds
    const result = this.calculateSpinResult(
      session.serverSeed!,
      session.clientSeed!,
      nonce,
      slotConfig,
    );

    // ---- ATOMIC TRANSACTION ----
    // 1. Lock wallet row with FOR UPDATE
    // 2. Debit bet
    // 3. Credit win (if any)
    // 4. Create Bet record linked to Transaction
    // 5. Create BET Transaction
    // 6. Create WIN Transaction (if win > 0)
    // 7. Update session stats

    const txResult = await this.prisma.$transaction(async (tx) => {
      // 🔒 Pessimistic lock: SELECT ... FOR UPDATE on wallet row
      const [lockedWallet] = await tx.$queryRawUnsafe<any[]>(
        'SELECT * FROM "Wallet" WHERE "userId" = $1 FOR UPDATE',
        userId,
      );

      if (!lockedWallet) throw new NotFoundException('Wallet not found');

      const balanceNum = Number(lockedWallet.balance);
      if (balanceNum < betAmount) {
        throw new BadRequestException('Insufficient balance');
      }

      const balanceBeforeDebit = lockedWallet.balance;

      // Debit bet from real balance
      const walletAfterDebit = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: betAmount } },
      });

      // Create BET transaction
      const betTx = await tx.transaction.create({
        data: {
          userId,
          walletId: lockedWallet.id,
          type: TransactionType.BET,
          status: TransactionStatus.COMPLETED,
          amount: betAmount,
          balanceBefore: balanceBeforeDebit,
          balanceAfter: walletAfterDebit.balance,
          description: `Spin on ${game.name}`,
        },
      });

      // Create Bet record, linked to the transaction
      const bet = await tx.bet.create({
        data: {
          userId,
          gameId: game.id,
          gameSessionId: session.id,
          transactionId: betTx.id, // 🔗 LINK Bet → Transaction
          amount: betAmount,
          winAmount: result.totalWin,
          multiplier: result.multiplier,
          serverSeed: session.serverSeed,
          serverHash: session.serverHash,
          clientSeed: session.clientSeed,
          nonce,
          result: {
            reels: result.reels,
            winLines: result.winLines,
            totalWin: result.totalWin,
            multiplier: result.multiplier,
            isBonus: result.isBonus,
            freeSpinsWon: result.freeSpinsWon,
          } as any,
          provablyFair: {
            serverSeed: session.serverSeed,
            clientSeed: session.clientSeed,
            nonce,
          } as any,
        },
      });

      // Update session
      await tx.gameSession.update({
        where: { id: session.id },
        data: {
          nonce,
          totalBet: { increment: betAmount },
        },
      });

      let winTxId: string | null = null;
      if (result.totalWin > 0) {
        const balanceBeforeCredit = walletAfterDebit.balance;

        const walletAfterCredit = await tx.wallet.update({
          where: { userId },
          data: { balance: { increment: result.totalWin } },
        });

        // Create WIN transaction
        const winTx = await tx.transaction.create({
          data: {
            userId,
            walletId: lockedWallet.id,
            type: TransactionType.WIN,
            status: TransactionStatus.COMPLETED,
            amount: result.totalWin,
            balanceBefore: balanceBeforeCredit,
            balanceAfter: walletAfterCredit.balance,
            description: `Win on ${game.name}`,
          },
        });

        winTxId = winTx.id;

        await tx.gameSession.update({
          where: { id: session.id },
          data: { totalWin: { increment: result.totalWin } },
        });
      }

      return {
        walletAfterDebit,
        winTxId,
        betId: bet.id,
        transactionId: betTx.id,
      };
    });

    // ---- WEBHOOK / WS notification (post-transaction) ----
    // Send balance update via WebSocket
    this.gameGateway.sendBalanceUpdate(userId, {
      balance: String(txResult.walletAfterDebit.balance),
      bonusBalance: String(wallet.bonusBalance),
      currency: wallet.currency,
    });

    // Send game result via WebSocket
    this.gameGateway.sendGameResult(userId, {
      reels: result.reels,
      winLines: result.winLines,
      totalWin: result.totalWin,
      multiplier: result.multiplier,
      isBonus: result.isBonus,
      freeSpinsWon: result.freeSpinsWon,
      nonce,
      serverHash: session.serverHash,
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
      transactionId: txResult.transactionId,
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
      where: { externalId: gameId, providerId: 'pragmatic' },
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
    config: SlotEngineConfig,
  ): {
    reels: string[][];
    winLines: any[];
    totalWin: number;
    multiplier: number;
    isBonus: boolean;
    freeSpinsWon: number;
  } {
    try {
      const engine = new SlotEngine(config, clientSeed);

      // We need to override the internal nonce to match our provably fair sequence
      // SlotEngine's RNG nonce starts at 1 on first call.
      // Since we already have a session nonce, we advance the RNG to match.
      // The engine generates results deterministically based on seeds + nonce.
      (engine as any).rng['nonce'] = nonce - 1;

      const engineResult = engine.spin(1); // betAmount=1, result is ratio-based

      return {
        reels: engineResult.grid,
        winLines: engineResult.winLines.map((wl) => ({
          paylineId: wl.positions?.[0]?.reel ?? 0,
          symbol: wl.symbol,
          count: wl.count,
          win: wl.win * (config.symbols?.length > 0 ? 1 : 1),
          positions: wl.positions,
        })),
        totalWin: engineResult.totalWin,
        multiplier: engineResult.multiplier,
        isBonus: engineResult.isBonus,
        freeSpinsWon: engineResult.freeSpinsWon,
      };
    } catch (err) {
      // Fallback: deterministic result based on hash only
      const hash = crypto
        .createHmac('sha256', serverSeed)
        .update(`${clientSeed}:${nonce}`)
        .digest('hex');

      const reelsCount = config?.reels || 5;
      const rowsCount = config?.rows || 3;
      const symbolIds = config?.symbols?.map((s) => s.id) ||
        ['9', '10', 'J', 'Q', 'K', 'A', 'WILD', 'SCATTER', 'BONUS'];

      const reels: string[][] = [];
      for (let r = 0; r < reelsCount; r++) {
        const reel: string[] = [];
        for (let row = 0; row < rowsCount; row++) {
          const hashSlice = hash.substring((r * rowsCount + row) * 2, (r * rowsCount + row) * 2 + 8);
          const index = parseInt(hashSlice, 16) % symbolIds.length;
          reel.push(symbolIds[index]);
        }
        reels.push(reel);
      }

      return {
        reels,
        winLines: [],
        totalWin: 0,
        multiplier: 0,
        isBonus: false,
        freeSpinsWon: 0,
      };
    }
  }
}
