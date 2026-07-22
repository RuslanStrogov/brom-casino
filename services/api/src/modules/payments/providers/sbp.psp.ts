import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentResult,
  CreatePayoutParams,
  PayoutResult,
  PaymentNotification,
} from './base.psp';
import { SBP_BANKS } from '@brom-casino/shared';

// ---------------------------------------------------------------------------
// SBP Mock Bank Account Generator
// ---------------------------------------------------------------------------
function generateAccountNumber(): string {
  const num = crypto.randomInt(10 ** 19, 10 ** 20 - 1);
  return String(num);
}

function generateBic(): string {
  const region = String(crypto.randomInt(1, 99)).padStart(2, '0');
  const num = String(crypto.randomInt(1000000, 9999999));
  return `04${region}${num}`;
}

function generateSbpQrCode(orderId: string, amount: string): string {
  // Mock SBP QR — just a unique identifier
  return `sbp://qr?order=${orderId}&amount=${amount}&bank=22${crypto.randomInt(100000, 999999)}`;
}

function generateUuid(): string {
  return crypto.randomUUID();
}

function futureDate(secondsFromNow: number): Date {
  return new Date(Date.now() + secondsFromNow * 1000);
}

// ---------------------------------------------------------------------------
// SBP Provider (Simulated)
// ---------------------------------------------------------------------------
@Injectable()
export class SbpPsp implements PaymentProvider {
  readonly providerId = 'sbp';
  private readonly logger = new Logger(SbpPsp.name);
  private readonly mode: 'demo' | 'real';

  constructor(private readonly configService: ConfigService) {
    const modeOverride = this.configService.get<string>('SBP_MODE');
    this.mode = modeOverride === 'real' ? 'real' : 'demo';
    this.logger.log(`SbpPsp initialised in ${this.mode.toUpperCase()} mode`);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    this.logger.log(
      `createPayment – orderId=${params.orderId} amount=${params.amount} ${params.currency} [${this.mode}]`,
    );

    if (this.mode === 'demo') {
      return this.mockCreatePayment(params);
    }
    // Real SBP integration would go here
    return this.mockCreatePayment(params);
  }

  async createPayout(params: CreatePayoutParams): Promise<PayoutResult> {
    this.logger.log(
      `createPayout – orderId=${params.orderId} amount=${params.amount} ${params.currency} dest=${params.destination} [${this.mode}]`,
    );
    return this.mockCreatePayout(params);
  }

  validateWebhook(payload: unknown, signature: string): boolean {
    // SBP webhooks are signed with a simple token
    const webhookToken = this.configService.get<string>('SBP_WEBHOOK_TOKEN') || 'sbp-demo-secret';
    const expected = crypto.createHmac('sha256', webhookToken)
      .update(JSON.stringify(payload))
      .digest('hex');
    const valid = expected === signature;
    if (!valid) {
      this.logger.warn(`validateWebhook – signature mismatch`);
    }
    return valid;
  }

  parsePaymentNotification(payload: unknown): PaymentNotification {
    const p = payload as Record<string, any>;
    return {
      orderId: p.order_id || '',
      status: this.mapStatus(p.status || 'paid'),
      amount: p.amount,
      currency: p.currency,
      txHash: p.txid || p.transaction_id,
      providerRef: p.provider_ref || p.id,
    };
  }

  async getPaymentStatus(providerRef: string): Promise<PaymentNotification> {
    this.logger.log(`getPaymentStatus – providerRef=${providerRef}`);
    return {
      orderId: providerRef,
      status: 'completed',
      providerRef,
    };
  }

  async refund(providerRef: string): Promise<boolean> {
    this.logger.log(`refund – providerRef=${providerRef}`);
    return true;
  }

  // -----------------------------------------------------------------------
  // Mock helpers
  // -----------------------------------------------------------------------

  private mockCreatePayment(params: CreatePaymentParams): PaymentResult {
    const uuid = generateUuid();
    const orderId = params.orderId;

    // Parse extra params from description if present
    let bankName = 'Т-Банк';
    let bankId = 'tbank';
    let fiatCurrency = 'RUB';
    if (params.description) {
      try {
        const extra = JSON.parse(params.description);
        bankName = extra.bankName || bankName;
        bankId = extra.bankId || bankId;
        fiatCurrency = extra.currency || fiatCurrency;
      } catch {
        // ignore
      }
    }

    const bank = (SBP_BANKS as any[]).find(b => b.id === bankId);
    const bankDisplayName = bank?.name || bankName;

    const accountNumber = generateAccountNumber();
    const bic = generateBic();
    const qrCode = generateSbpQrCode(orderId, params.amount);

    this.logger.log(
      `mockCreatePayment – SBP invoice uuid=${uuid} bank=${bankDisplayName} amount=${params.amount} ${fiatCurrency}`,
    );

    return {
      paymentUrl: qrCode,
      providerRef: uuid,
      expiresAt: futureDate(900), // 15 min expiry for SBP
      providerData: {
        uuid,
        order_id: orderId,
        amount: params.amount,
        currency: fiatCurrency,
        bankName: bankDisplayName,
        bankId,
        accountNumber,
        bic,
        qrCode,
        status: 'pending',
        instructions: [
          `1. Откройте приложение банка «${bankDisplayName}»`,
          `2. Выберите «Оплата по СБП» или сканируйте QR-код`,
          `3. Введите сумму ${params.amount} ${fiatCurrency}`,
          `4. Подтвердите платеж`,
          `5. Средства зачислятся автоматически после подтверждения`,
        ],
        payeeName: 'ИП Строгов Р.А.',
        payeeInn: '770012345678',
        accountNumber,
        bic,
        expiresAt: Math.floor(Date.now() / 1000) + 900,
      },
    };
  }

  private mockCreatePayout(params: CreatePayoutParams): PayoutResult {
    const uuid = generateUuid();
    this.logger.log(
      `mockCreatePayout – uuid=${uuid} orderId=${params.orderId} amount=${params.amount}`,
    );
    return {
      providerRef: uuid,
      status: 'processing',
      providerData: {
        uuid,
        order_id: params.orderId,
        amount: params.amount,
        currency: params.currency,
        status: 'processing',
        destination: params.destination,
        estimatedArrival: '1-3 business days',
      },
    };
  }

  private mapStatus(status: string): 'pending' | 'paid' | 'completed' | 'failed' | 'expired' | 'cancelled' {
    switch (status) {
      case 'paid': return 'paid';
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      case 'expired': return 'expired';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  }
}