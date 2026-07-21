import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { TransactionStatus, TransactionType, PaginationMeta } from '@brom-casino/shared';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async getDashboard() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersMonth,
      totalDepositsToday,
      totalDepositsMonth,
      totalWithdrawalsToday,
      totalWithdrawalsMonth,
      totalBetsToday,
      totalBetsMonth,
      pendingWithdrawals,
      pendingKyc,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { status: TransactionStatus.COMPLETED, createdAt: { gte: today } },
      }),
      this.prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { status: TransactionStatus.COMPLETED, createdAt: { gte: thisMonth } },
      }),
      this.prisma.withdrawal.aggregate({
        _sum: { amount: true },
        where: { status: TransactionStatus.COMPLETED, createdAt: { gte: today } },
      }),
      this.prisma.withdrawal.aggregate({
        _sum: { amount: true },
        where: { status: TransactionStatus.COMPLETED, createdAt: { gte: thisMonth } },
      }),
      this.prisma.bet.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: today } },
      }),
      this.prisma.bet.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: thisMonth } },
      }),
      this.prisma.withdrawal.count({ where: { status: TransactionStatus.PENDING } }),
      this.prisma.kycVerification.count({ where: { status: 'IN_PROGRESS' } }),
    ]);

    const grossGamingRevenue =
      Number(totalBetsMonth._sum.amount || 0) -
      (await this.prisma.bet.aggregate({
        _sum: { winAmount: true },
        where: { createdAt: { gte: thisMonth } },
      }).then((r) => Number(r._sum.winAmount || 0)));

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        newThisMonth: newUsersMonth,
      },
      deposits: {
        today: totalDepositsToday._sum.amount || 0,
        thisMonth: totalDepositsMonth._sum.amount || 0,
      },
      withdrawals: {
        today: totalWithdrawalsToday._sum.amount || 0,
        thisMonth: totalWithdrawalsMonth._sum.amount || 0,
        pending: pendingWithdrawals,
      },
      bets: {
        today: totalBetsToday._sum.amount || 0,
        thisMonth: totalBetsMonth._sum.amount || 0,
      },
      grossGamingRevenue,
      pendingKyc,
    };
  }

  async listUsers(opts: { page: number; limit: number; status?: string; search?: string }) {
    const where: any = {};
    if (opts.status) where.status = opts.status;
    if (opts.search) {
      where.OR = [
        { email: { contains: opts.search, mode: 'insensitive' } },
        { username: { contains: opts.search, mode: 'insensitive' } },
        { phone: { contains: opts.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          wallet: { select: { balance: true, currency: true } },
          kyc: { select: { status: true, level: true } },
          _count: { select: { bets: true, referrals: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    };

    return { users, meta };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        kyc: true,
        _count: { select: { bets: true, transactions: true, referrals: true, gameSessions: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, twoFactorSecret, ...safeUser } = user as any;
    return safeUser;
  }

  async adjustBalance(
    userId: string,
    dto: { amount: string; reason: string; type: 'credit' | 'debit' },
    adminId: string,
  ) {
    const amount = Number(dto.amount);
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    if (dto.type === 'credit') {
      await this.walletService.credit(userId, amount, 'ADJUSTMENT', `Admin adjustment: ${dto.reason}`);
    } else {
      await this.walletService.debit(userId, amount, 'ADJUSTMENT', `Admin adjustment: ${dto.reason}`);
    }

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'BALANCE_ADJUSTMENT',
        entity: 'User',
        entityId: userId,
        newValue: { type: dto.type, amount, reason: dto.reason },
      },
    });

    this.logger.log(`Admin ${adminId} ${dto.type}ed ${amount} to user ${userId}: ${dto.reason}`);
    return this.walletService.getBalance(userId);
  }

  async listGames(opts: { page: number; limit: number }) {
    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        include: { _count: { select: { bets: true, gameSessions: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.game.count(),
    ]);

    const meta: PaginationMeta = {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    };

    return { games, meta };
  }

  async syncGames() {
    // This would sync games from all configured providers
    this.logger.log('Game sync initiated');
    return { message: 'Game sync completed', synced: 0 };
  }

  async updateGame(id: string, dto: any) {
    const game = await this.prisma.game.update({
      where: { id },
      data: {
        name: dto.name,
        isFeatured: dto.isFeatured,
        isActive: dto.isActive,
        isNew: dto.isNew,
        sortOrder: dto.sortOrder,
        minBet: dto.minBet,
        maxBet: dto.maxBet,
        tags: dto.tags,
      },
    });
    return game;
  }

  async listPendingDeposits() {
    return this.prisma.deposit.findMany({
      where: { status: TransactionStatus.PENDING },
      include: { user: { select: { username: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listPendingWithdrawals() {
    return this.prisma.withdrawal.findMany({
      where: { status: TransactionStatus.PENDING },
      include: { user: { select: { username: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async processWithdrawal(
    id: string,
    dto: { action: 'approve' | 'reject'; notes?: string },
    adminId: string,
  ) {
    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Withdrawal is not pending');
    }

    if (dto.action === 'approve') {
      const updated = await this.prisma.withdrawal.update({
        where: { id },
        data: {
          status: TransactionStatus.PROCESSING,
          processedAt: new Date(),
        },
      });

      await this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'WITHDRAWAL_APPROVE',
          entity: 'Withdrawal',
          entityId: id,
          newValue: { notes: dto.notes },
        },
      });

      return updated;
    } else {
      // Reject — refund user
      await this.prisma.$transaction(async (tx) => {
        await tx.withdrawal.update({
          where: { id },
          data: { status: TransactionStatus.CANCELLED },
        });
      });

      await this.walletService.credit(
        withdrawal.userId,
        Number(withdrawal.amount),
        'ADJUSTMENT',
        `Withdrawal rejected: ${dto.notes || 'No reason'}`,
      );

      await this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'WITHDRAWAL_REJECT',
          entity: 'Withdrawal',
          entityId: id,
          newValue: { notes: dto.notes },
        },
      });

      return this.prisma.withdrawal.findUnique({ where: { id } });
    }
  }

  async getAuditLogs(opts: { page: number; limit: number; action?: string; userId?: string }) {
    const where: any = {};
    if (opts.action) where.action = opts.action;
    if (opts.userId) where.userId = opts.userId;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { username: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    };

    return { logs, meta };
  }

  async getRevenueReport(opts: { from?: string; to?: string }) {
    const from = opts.from ? new Date(opts.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = opts.to ? new Date(opts.to) : new Date();

    const [deposits, withdrawals, bets, wins] = await Promise.all([
      this.prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { status: TransactionStatus.COMPLETED, createdAt: { gte: from, lte: to } },
      }),
      this.prisma.withdrawal.aggregate({
        _sum: { amount: true },
        where: { status: TransactionStatus.COMPLETED, createdAt: { gte: from, lte: to } },
      }),
      this.prisma.bet.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: from, lte: to } },
      }),
      this.prisma.bet.aggregate({
        _sum: { winAmount: true },
        where: { createdAt: { gte: from, lte: to } },
      }),
    ]);

    const totalBets = Number(bets._sum.amount || 0);
    const totalWins = Number(wins._sum.winAmount || 0);
    const totalDeposits = Number(deposits._sum.amount || 0);
    const totalWithdrawals = Number(withdrawals._sum.amount || 0);

    return {
      period: { from, to },
      deposits: totalDeposits,
      withdrawals: totalWithdrawals,
      netDeposits: totalDeposits - totalWithdrawals,
      totalBets,
      totalWins,
      grossGamingRevenue: totalBets - totalWins,
      rtp: totalBets > 0 ? (totalWins / totalBets) * 100 : 0,
    };
  }

  async getGameReport() {
    const games = await this.prisma.game.findMany({
      include: {
        _count: { select: { bets: true, gameSessions: true } },
        bets: {
          _sum: { amount: true, winAmount: true },
        },
      },
      orderBy: { bets: { _count: 'desc' } },
      take: 50,
    });

    return games.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      category: g.category,
      totalBets: g._count.bets,
      totalSessions: g._count.gameSessions,
      totalWagered: g.bets._sum.amount || 0,
      totalPaidOut: g.bets._sum.winAmount || 0,
      rtp: g.bets._sum.amount
        ? (Number(g.bets._sum.winAmount || 0) / Number(g.bets._sum.amount)) * 100
        : 0,
    }));
  }

  async listBonuses() {
    const bonuses = await this.prisma.bonus.findMany({
      include: {
        _count: { select: { userBonuses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bonuses.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      type: b.type,
      status: b.status,
      amount: b.amount,
      maxAmount: b.maxAmount,
      freeSpins: b.freeSpins,
      wageringRequirement: b.wageringRequirement,
      activeUsers: b._count.userBonuses,
      createdAt: b.createdAt,
    }));
  }

  async listKycVerifications() {
    return this.prisma.kycVerification.findMany({
      include: {
        user: {
          select: { id: true, email: true, username: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
