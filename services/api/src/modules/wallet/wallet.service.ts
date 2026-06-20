import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { TransactionType, TransactionStatus, PaginationMeta } from '@brom-casino/shared';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, currency: 'USDT' },
      });
    }

    return wallet;
  }

  async getBalance(userId: string) {
    const wallet = await this.getWallet(userId);
    return {
      balance: wallet.balance,
      bonusBalance: wallet.bonusBalance,
      currency: wallet.currency,
    };
  }

  async credit(userId: string, amount: number | string, type: string, description?: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const amountNum = typeof amount === 'string' ? Number(amount) : amount;
    if (amountNum <= 0) throw new BadRequestException('Amount must be positive');

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: amountNum } },
      });

      await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: type as TransactionType,
          status: TransactionStatus.COMPLETED,
          amount: amountNum,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          description,
        },
      });

      return updatedWallet;
    });

    this.logger.log(`Credited ${amountNum} to user ${userId} (${type})`);
    return result;
  }

  async debit(userId: string, amount: number | string, type: string, description?: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const amountNum = typeof amount === 'string' ? Number(amount) : amount;
    if (amountNum <= 0) throw new BadRequestException('Amount must be positive');
    if (Number(wallet.balance) < amountNum) {
      throw new BadRequestException('Insufficient balance');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amountNum } },
      });

      await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: type as TransactionType,
          status: TransactionStatus.COMPLETED,
          amount: amountNum,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          description,
        },
      });

      return updatedWallet;
    });

    this.logger.log(`Debited ${amountNum} from user ${userId} (${type})`);
    return result;
  }

  async creditBonus(userId: string, amount: number | string, description?: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const amountNum = typeof amount === 'string' ? Number(amount) : amount;

    return this.prisma.wallet.update({
      where: { userId },
      data: { bonusBalance: { increment: amountNum } },
    });
  }

  async debitBonus(userId: string, amount: number | string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const amountNum = typeof amount === 'string' ? Number(amount) : amount;
    if (Number(wallet.bonusBalance) < amountNum) {
      throw new BadRequestException('Insufficient bonus balance');
    }

    return this.prisma.wallet.update({
      where: { userId },
      data: { bonusBalance: { decrement: amountNum } },
    });
  }

  async transfer(userId: string, dto: { from: 'real' | 'bonus'; to: 'real' | 'bonus'; amount: string }) {
    const amount = Number(dto.amount);
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (dto.from === dto.to) throw new BadRequestException('Source and destination must differ');

    if (dto.from === 'bonus' && dto.to === 'real') {
      return this.prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet not found');
        if (Number(wallet.bonusBalance) < amount) {
          throw new BadRequestException('Insufficient bonus balance');
        }

        return tx.wallet.update({
          where: { userId },
          data: {
            bonusBalance: { decrement: amount },
            balance: { increment: amount },
          },
        });
      });
    }

    throw new BadRequestException('Invalid transfer direction');
  }

  async getTransactions(userId: string, opts: { page: number; limit: number; type?: string }) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const where: any = { walletId: wallet.id };
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
}
