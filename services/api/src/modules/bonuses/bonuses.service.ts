import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { BonusType, BonusStatus, PaginationMeta } from '@brom-casino/shared';

@Injectable()
export class BonusesService {
  private readonly logger = new Logger(BonusesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async getAvailableBonuses(userId: string) {
    const now = new Date();

    const bonuses = await this.prisma.bonus.findMany({
      where: {
        status: BonusStatus.ACTIVE,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        OR: [{ maxClaims: null }, { currentClaims: { lt: { path: ['maxClaims'] } } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out bonuses the user has already claimed up to their limit
    const userBonusCounts = await this.prisma.userBonus.groupBy({
      by: ['bonusId'],
      where: { userId },
      _count: { id: true },
    });

    const countsMap = new Map(userBonusCounts.map((ub) => [ub.bonusId, ub._count.id]));

    return bonuses.filter((bonus) => {
      const userCount = countsMap.get(bonus.id) || 0;
      return userCount < bonus.perUserLimit;
    });
  }

  async getUserBonuses(userId: string) {
    return this.prisma.userBonus.findMany({
      where: { userId },
      include: { bonus: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async claimBonus(userId: string, bonusId: string, adminId?: string) {
    const bonus = await this.prisma.bonus.findUnique({ where: { id: bonusId } });
    if (!bonus) throw new NotFoundException('Bonus not found');
    if (bonus.status !== BonusStatus.ACTIVE) {
      throw new BadRequestException('Bonus is not active');
    }

    const now = new Date();
    if (bonus.startsAt && bonus.startsAt > now) {
      throw new BadRequestException('Bonus has not started yet');
    }
    if (bonus.expiresAt && bonus.expiresAt < now) {
      throw new BadRequestException('Bonus has expired');
    }

    // Check per-user limit
    const userClaimCount = await this.prisma.userBonus.count({
      where: { userId, bonusId: bonus.id },
    });
    if (userClaimCount >= bonus.perUserLimit) {
      throw new ConflictException('You have already claimed this bonus');
    }

    // Check if user has an active bonus
    const activeBonus = await this.prisma.userBonus.findFirst({
      where: { userId, status: { in: [BonusStatus.ACTIVE, BonusStatus.WAGERING] } },
    });
    if (activeBonus && bonus.type !== BonusType.REFERRAL) {
      throw new ConflictException('You already have an active bonus. Complete or cancel it first.');
    }

    // Check minimum deposit requirement
    if (bonus.minDeposit) {
      const lastDeposit = await this.prisma.deposit.findFirst({
        where: { userId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      });
      if (!lastDeposit || Number(lastDeposit.amount) < Number(bonus.minDeposit)) {
        throw new BadRequestException(`Minimum deposit of ${bonus.minDeposit} required`);
      }
    }

    // Create user bonus
    const userBonus = await this.prisma.$transaction(async (tx) => {
      const ub = await tx.userBonus.create({
        data: {
          userId,
          bonusId: bonus.id,
          status: BonusStatus.ACTIVE,
          amount: bonus.amount || 0,
          wageringRequired: bonus.wageringRequirement * Number(bonus.amount || 0),
          freeSpinsTotal: bonus.freeSpins,
          expiresAt: bonus.expiresAt,
        },
      });

      await tx.bonus.update({
        where: { id: bonus.id },
        data: { currentClaims: { increment: 1 } },
      });

      return ub;
    });

    // Credit bonus balance
    if (bonus.amount && Number(bonus.amount) > 0) {
      await this.walletService.creditBonus(userId, bonus.amount, `Bonus: ${bonus.name}`);
    }

    this.logger.log(`User ${userId} claimed bonus ${bonus.name} (${bonus.id})`);
    return userBonus;
  }

  async claimByCode(userId: string, code: string) {
    const bonus = await this.prisma.bonus.findUnique({ where: { code } });
    if (!bonus) throw new NotFoundException('Invalid promo code');
    return this.claimBonus(userId, bonus.id);
  }

  async cancelBonus(userId: string, userBonusId: string) {
    const userBonus = await this.prisma.userBonus.findFirst({
      where: { id: userBonusId, userId },
    });
    if (!userBonus) throw new NotFoundException('Bonus not found');

    if (![BonusStatus.ACTIVE, BonusStatus.WAGERING].includes(userBonus.status)) {
      throw new BadRequestException('Cannot cancel this bonus');
    }

    // Remove remaining bonus balance
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (wallet && Number(wallet.bonusBalance) > 0) {
      await this.prisma.wallet.update({
        where: { userId },
        data: { bonusBalance: 0 },
      });
    }

    return this.prisma.userBonus.update({
      where: { id: userBonusId },
      data: {
        status: BonusStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  async updateWageringProgress(userId: string, betAmount: number) {
    const activeBonus = await this.prisma.userBonus.findFirst({
      where: { userId, status: BonusStatus.ACTIVE },
    });

    if (activeBonus) {
      await this.prisma.userBonus.update({
        where: { id: activeBonus.id },
        data: {
          wageringProgress: { increment: betAmount },
          status: BonusStatus.WAGERING,
        },
      });
    }

    const wageringBonus = await this.prisma.userBonus.findFirst({
      where: { userId, status: BonusStatus.WAGERING },
    });

    if (wageringBonus && Number(wageringBonus.wageringProgress) >= Number(wageringBonus.wageringRequired)) {
      await this.prisma.userBonus.update({
        where: { id: wageringBonus.id },
        data: {
          status: BonusStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Move bonus balance to real balance
      const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      if (wallet && Number(wallet.bonusBalance) > 0) {
        await this.walletService.transfer(userId, {
          from: 'bonus',
          to: 'real',
          amount: String(wallet.bonusBalance),
        });
      }

      this.logger.log(`User ${userId} completed wagering for bonus ${wageringBonus.id}`);
    }
  }

  // Admin methods
  async listAllBonuses(opts: { page: number; limit: number }) {
    const [bonuses, total] = await Promise.all([
      this.prisma.bonus.findMany({
        include: { _count: { select: { userBonuses: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.bonus.count(),
    ]);

    const meta: PaginationMeta = {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    };

    return { bonuses, meta };
  }

  async createBonus(dto: any, adminId: string) {
    const bonus = await this.prisma.bonus.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type as BonusType,
        status: BonusStatus.ACTIVE,
        amount: dto.amount,
        maxAmount: dto.maxAmount,
        freeSpins: dto.freeSpins,
        wageringRequirement: dto.wageringRequirement || 35,
        minDeposit: dto.minDeposit,
        maxBetWithBonus: dto.maxBetWithBonus,
        currency: dto.currency || 'USDT',
        eligibleGames: dto.eligibleGames || [],
        eligibleCategories: dto.eligibleCategories || [],
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        maxClaims: dto.maxClaims,
        perUserLimit: dto.perUserLimit || 1,
        code: dto.code,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'BONUS_CREATE',
        entity: 'Bonus',
        entityId: bonus.id,
        newValue: dto,
      },
    });

    return bonus;
  }
}
