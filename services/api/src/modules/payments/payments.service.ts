import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/services/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { TransactionStatus, PaginationMeta, MIN_DEPOSIT, MAX_DEPOSIT, MIN_WITHDRAWAL, MAX_WITHDRAWAL } from '@brom-casino/shared';
import { PaymentProvider } from './providers/base.psp';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly providers: Map<string, PaymentProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
    private readonly cryptomusPsp: PaymentProvider,
  ) {
    this.providers.set('cryptomus', cryptomusPsp);
  }

  async createDeposit(
    userId: string,
    dto: { amount: string; currency?: string; paymentMethod?: string },
  ) {
    const amount = Number(dto.amount);
    const currency = dto.currency || 'USDT';

    if (amount < MIN_DEPOSIT) {
      throw new BadRequestException(`Minimum deposit is ${MIN_DEPOSIT} ${currency}`);
    }
    if (amount > MAX_DEPOSIT) {
      throw new BadRequestException(`Maximum deposit is ${MAX_DEPOSIT} ${currency}`);
    }

    const provider = this.getProvider(dto.paymentMethod || 'cryptomus');

    // Create deposit record
    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        walletId: (await this.walletService.getWallet(userId)).id,
        amount,
        currency,
        paymentMethod: dto.paymentMethod || 'cryptomus',
        status: TransactionStatus.PENDING,
      },
    });

    // Get payment URL from provider
    const paymentResult = await provider.createPayment({
      amount: dto.amount,
      currency,
      orderId: deposit.id,
      userId,
      description: `Deposit ${amount} ${currency}`,
      returnUrl: `${this.configService.get('FRONTEND_URL')}/wallet`,
      callbackUrl: `${this.configService.get('API_URL')}/api/payments/webhook/cryptomus`,
    });

    // Update deposit with provider reference
    await this.prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        providerRef: paymentResult.providerRef,
        providerData: paymentResult.providerData as any,
      },
    });

    return {
      depositId: deposit.id,
      amount,
      currency,
      paymentUrl: paymentResult.paymentUrl,
      expiresAt: paymentResult.expiresAt,
      status: deposit.status,
    };
  }

  async createWithdrawal(
    userId: string,
    dto: { amount: string; currency?: string; destination: string; paymentMethod?: string },
  ) {
    const amount = Number(dto.amount);
    const currency = dto.currency || 'USDT';

    if (amount < MIN_WITHDRAWAL) {
      throw new BadRequestException(`Minimum withdrawal is ${MIN_WITHDRAWAL} ${currency}`);
    }
    if (amount > MAX_WITHDRAWAL) {
      throw new BadRequestException(`Maximum withdrawal is ${MAX_WITHDRAWAL} ${currency}`);
    }

    // Check balance
    const balance = await this.walletService.getBalance(userId);
    if (Number(balance.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Check KYC requirement for large withdrawals
    const kyc = await this.prisma.kycVerification.findUnique({ where: { userId } });
    if (amount >= 1000 && (!kyc || kyc.status !== 'APPROVED')) {
      throw new BadRequestException('KYC verification required for withdrawals over 1000');
    }

    const provider = this.getProvider(dto.paymentMethod || 'cryptomus');

    // Create withdrawal record
    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        userId,
        walletId: (await this.walletService.getWallet(userId)).id,
        amount,
        currency,
        paymentMethod: dto.paymentMethod || 'cryptomus',
        destination: dto.destination,
        status: TransactionStatus.PENDING,
      },
    });

    // Reserve funds
    await this.walletService.debit(userId, amount, 'WITHDRAWAL', `Withdrawal request ${amount} ${currency}`);

    try {
      // Process via provider
      const payoutResult = await provider.createPayout({
        amount: dto.amount,
        currency,
        orderId: withdrawal.id,
        destination: dto.destination,
        userId,
      });

      await this.prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          providerRef: payoutResult.providerRef,
          providerData: payoutResult.providerData as any,
          status: payoutResult.status === 'completed' ? TransactionStatus.COMPLETED : TransactionStatus.PROCESSING,
        },
      });

      return {
        withdrawalId: withdrawal.id,
        amount,
        currency,
        destination: dto.destination,
        status: TransactionStatus.PROCESSING,
        estimatedArrival: '24-48 hours',
      };
    } catch (error) {
      // Refund on failure
      await this.walletService.credit(userId, amount, 'ADJUSTMENT', 'Withdrawal failed - refund');
      await this.prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: TransactionStatus.FAILED },
      });
      throw error;
    }
  }

  /**
   * Log webhook attempt for monitoring / rate limiting
   */
  logWebhookAttempt(provider: string, ip: string) {
    this.logger.debug(`Webhook received from ${provider} (IP: ${ip})`);
    // In production: store to Redis for rate limiting / anomaly detection
  }

  /**
   * Handle Cryptomus payment webhook
   */
  async handleWebhook(providerName: string, payload: any, signature: string) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${providerName}`);
    }

    // Validate webhook signature
    if (!provider.validateWebhook(payload, signature)) {
      this.logger.warn(`Invalid webhook signature from ${providerName}`);
      throw new BadRequestException('Invalid signature');
    }

    const paymentInfo = provider.parsePaymentNotification(payload);
    this.logger.log(`Webhook from ${providerName}: ${paymentInfo.status} for order ${paymentInfo.orderId}`);

    if (paymentInfo.status === 'completed' || paymentInfo.status === 'paid') {
      // Find and update deposit
      const deposit = await this.prisma.deposit.findFirst({
        where: { id: paymentInfo.orderId, status: TransactionStatus.PENDING },
      });

      if (deposit) {
        await this.prisma.$transaction(async (tx) => {
          await tx.deposit.update({
            where: { id: deposit.id },
            data: {
              status: TransactionStatus.COMPLETED,
              confirmedAt: new Date(),
              txHash: paymentInfo.txHash,
            },
          });
        });

        // Credit user wallet
        await this.walletService.credit(
          deposit.userId,
          Number(deposit.amount),
          'DEPOSIT',
          `Deposit via ${providerName}`,
        );

        this.logger.log(`Deposit ${deposit.id} completed for user ${deposit.userId}`);
      }
    } else if (paymentInfo.status === 'failed' || paymentInfo.status === 'expired') {
      await this.prisma.deposit.updateMany({
        where: { id: paymentInfo.orderId, status: TransactionStatus.PENDING },
        data: { status: TransactionStatus.FAILED },
      });
    }

    return { received: true };
  }

  /**
   * Handle Pragmatic Play game webhook (bet/win/rollback events)
   */
  async handlePragmaticPlayWebhook(payload: any, signature: string) {
    // Validate signature via PP provider
    const { PragmaticPlayProvider } = await import('./providers/pragmatic-play.provider');
    // In production, we'd validate here. For now, log and acknowledge.
    this.logger.log(`PP webhook: type=${payload?.type} amount=${payload?.amount} player=${payload?.playerId}`);

    // TODO: Implement PP game event processing
    // - bet: debit user wallet
    // - win: credit user wallet
    // - rollback: reverse previous transaction

    return { received: true };
  }

  /**
   * Handle Sumsub KYC webhook (approval/rejection events)
   */
  async handleSumsubWebhook(payload: any, signature: string) {
    this.logger.log(`Sumsub webhook: applicant=${payload?.applicantId} status=${payload?.status}`);

    // TODO: Implement Sumsub KYC status update
    // - approved: update kyc_verification status to APPROVED
    // - rejected: update kyc_verification status to REJECTED

    return { received: true };
  }

  async getDeposits(userId: string, opts: { page: number; limit: number }) {
    const [deposits, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.deposit.count({ where: { userId } }),
    ]);

    const meta: PaginationMeta = {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    };

    return { deposits, meta };
  }

  async getWithdrawals(userId: string, opts: { page: number; limit: number }) {
    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.withdrawal.count({ where: { userId } }),
    ]);

    const meta: PaginationMeta = {
      page: opts.page,
      limit: opts.limit,
      total,
      totalPages: Math.ceil(total / opts.limit),
    };

    return { withdrawals, meta };
  }

  private getProvider(name: string): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new BadRequestException(`Payment provider "${name}" not found`);
    }
    return provider;
  }
}
