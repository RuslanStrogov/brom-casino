import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { UserStatus, Role, TransactionType, TransactionStatus, PaginationMeta } from '@brom-casino/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        kyc: true,
        _count: { select: { referrals: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const { passwordHash, twoFactorSecret, ...safeUser } = user as any;
    return safeUser;
  }

  async updateProfile(userId: string, dto: { username?: string; firstName?: string; lastName?: string; avatarUrl?: string }) {
    if (dto.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: dto.username, NOT: { id: userId } },
      });
      if (existing) throw new ConflictException('Username already taken');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
      },
    });

    const { passwordHash, twoFactorSecret, ...safeUser } = user as any;
    return safeUser;
  }

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return {
      balance: wallet.balance,
      bonusBalance: wallet.bonusBalance,
      currency: wallet.currency,
    };
  }

  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const [totalBets, totalWins, biggestWin] = await Promise.all([
      this.prisma.bet.count({ where: { userId } }),
      this.prisma.bet.count({ where: { userId, winAmount: { gt: 0 } } }),
      this.prisma.bet.findFirst({
        where: { userId },
        orderBy: { winAmount: 'desc' },
        select: { winAmount: true, gameId: true, createdAt: true },
      }),
    ]);

    return {
      totalBets,
      totalWins,
      winRate: totalBets > 0 ? (totalWins / totalBets) * 100 : 0,
      totalWagered: user.totalWagered,
      totalWon: user.totalWon,
      netProfit: Number(user.totalWon) - Number(user.totalWagered),
      biggestWin,
      vipLevel: user.vipLevel,
    };
  }

  async getReferrals(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          select: { id: true, username: true, createdAt: true, totalWagered: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      referralCode: user.referralCode,
      referralCount: user.referrals.length,
      referrals: user.referrals,
    };
  }

  async getTransactions(userId: string, opts: { page: number; limit: number; type?: string }) {
    const where: any = { userId };
    if (opts.type) where.type = opts.type;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    };

    return { transactions, meta };
  }

  async getBetHistory(userId: string, opts: { page: number; limit: number }) {
    const [bets, total] = await Promise.all([
      this.prisma.bet.findMany({
        where: { userId },
        include: { game: { select: { name: true, thumbnailUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.bet.count({ where: { userId } }),
    ]);

    const meta: PaginationMeta = {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    };

    return { bets, meta };
  }

  // Admin methods
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
        include: { wallet: { select: { balance: true, currency: true } } },
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

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        kyc: true,
        _count: { select: { referrals: true, bets: true, transactions: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, twoFactorSecret, ...safeUser } = user as any;
    return safeUser;
  }

  async updateUserStatus(id: string, dto: { status: string; reason?: string }, adminId: string) {
    const validStatuses = Object.values(UserStatus);
    if (!validStatuses.includes(dto.status as UserStatus)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status as UserStatus },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_STATUS_CHANGE',
        entity: 'User',
        entityId: id,
        newValue: { status: dto.status, reason: dto.reason },
      },
    });

    const { passwordHash, twoFactorSecret, ...safeUser } = user as any;
    return safeUser;
  }

  async updateVipLevel(id: string, vipLevel: number) {
    if (vipLevel < 0 || vipLevel > 10) {
      throw new BadRequestException('VIP level must be between 0 and 10');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { vipLevel },
    });

    const { passwordHash, twoFactorSecret, ...safeUser } = user as any;
    return safeUser;
  }
}
