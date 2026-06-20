import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentResult,
  CreatePayoutParams,
  PayoutResult,
  PaymentNotification,
} from './base.psp';
import * as crypto from 'crypto';

// ---------------------------------------------------------------------------
// Operation modes
// ---------------------------------------------------------------------------
type CryptomusMode = 'real' | 'demo' | 'hybrid';

// ---------------------------------------------------------------------------
// Cryptomus webhook payload (partial – only fields we care about)
// ---------------------------------------------------------------------------
interface CryptomusWebhookPayload {
  uuid?: string;
  order_id?: string;
  merchant_order_id?: string;
  amount?: string;
  payment_amount?: string;
  payment_currency?: string;
  currency?: string;
  status?: string;
  txid?: string;
  transaction_id?: string;
  payment_id?: string;
  sign?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Cryptomus API response envelope
// ---------------------------------------------------------------------------
interface CryptomusApiResponse<T = Record<string, unknown>> {
  state: number;
  result?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// ---------------------------------------------------------------------------
// Payment info endpoint result
// ---------------------------------------------------------------------------
interface CryptomusPaymentInfo {
  uuid: string;
  order_id: string;
  amount: string;
  currency: string;
  status: string;
  txid?: string;
  payment_currency?: string;
  payment_amount?: string;
  url?: string;
  expire_at?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Payout endpoint result
// ---------------------------------------------------------------------------
interface CryptomusPayoutResult {
  uuid: string;
  order_id: string;
  amount: string;
  currency: string;
  status: string;
  txid?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers – generate realistic-looking mock data
// ---------------------------------------------------------------------------
function generateUuid(): string {
  return crypto.randomUUID();
}

function generateTxHash(): string {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

function futureDate(secondsFromNow: number): Date {
  return new Date(Date.now() + secondsFromNow * 1000);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
@Injectable()
export class CryptomusPsp implements PaymentProvider {
  readonly providerId = 'cryptomus';
  private readonly logger = new Logger(CryptomusPsp.name);

  private readonly apiKey: string;
  private readonly merchantId: string;
  private readonly baseUrl: string;
  private readonly mode: CryptomusMode;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('CRYPTOMUS_API_KEY') || '';
    this.merchantId =
      this.configService.get<string>('CRYPTOMUS_MERCHANT_ID') || '';
    this.baseUrl =
      this.configService.get<string>('CRYPTOMUS_BASE_URL') ||
      'https://api.cryptomus.com/v1';

    // Determine operation mode
    const modeOverride = this.configService.get<string>('CRYPTOMUS_MODE');
    if (modeOverride === 'demo') {
      this.mode = 'demo';
    } else if (modeOverride === 'hybrid') {
      this.mode = 'hybrid';
    } else if (this.apiKey && this.merchantId) {
      this.mode = 'real';
    } else {
      this.mode = 'demo';
    }

    this.logger.log(
      `CryptomusPsp initialised in ${this.mode.toUpperCase()} mode`,
    );
    if (this.mode === 'demo') {
      this.logger.warn(
        'CRYPTOMUS_API_KEY / CRYPTOMUS_MERCHANT_ID not set – running in DEMO mode with mock data',
      );
    }
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

    try {
      return await this.realCreatePayment(params);
    } catch (error) {
      if (this.mode === 'hybrid') {
        this.logger.warn(
          `Real API call failed, falling back to DEMO mode: ${(error as Error).message}`,
        );
        return this.mockCreatePayment(params);
      }
      throw error;
    }
  }

  async createPayout(params: CreatePayoutParams): Promise<PayoutResult> {
    this.logger.log(
      `createPayout – orderId=${params.orderId} amount=${params.amount} ${params.currency} dest=${params.destination} [${this.mode}]`,
    );

    if (this.mode === 'demo') {
      return this.mockCreatePayout(params);
    }

    try {
      return await this.realCreatePayout(params);
    } catch (error) {
      if (this.mode === 'hybrid') {
        this.logger.warn(
          `Real API call failed, falling back to DEMO mode: ${(error as Error).message}`,
        );
        return this.mockCreatePayout(params);
      }
      throw error;
    }
  }

  validateWebhook(payload: unknown, signature: string): boolean {
    if (!payload || typeof payload !== 'object') {
      this.logger.error('validateWebhook – payload is not an object');
      return false;
    }

    // In demo mode we still validate the signature if an API key is present,
    // but we always return true when there is no key (nothing to sign with).
    if (!this.apiKey) {
      this.logger.warn(
        'validateWebhook – no API key configured, skipping signature validation (DEMO)',
      );
      return true;
    }

    try {
      const payloadCopy = { ...(payload as Record<string, unknown>) };
      delete payloadCopy.sign;

      // Cryptomus signs by: MD5( base64( JSON with sorted keys ) + apiKey )
      const sortedKeys = Object.keys(payloadCopy).sort();
      const sortedPayload: Record<string, unknown> = {};
      for (const key of sortedKeys) {
        sortedPayload[key] = payloadCopy[key];
      }

      const jsonString = JSON.stringify(sortedPayload);
      const base64Payload = Buffer.from(jsonString).toString('base64');
      const expectedSignature = crypto
        .createHash('md5')
        .update(base64Payload + this.apiKey)
        .digest('hex');

      const valid = expectedSignature === signature;
      if (!valid) {
        this.logger.warn(
          `validateWebhook – signature mismatch (expected=${expectedSignature}, got=${signature})`,
        );
      }
      return valid;
    } catch (error) {
      this.logger.error('validateWebhook – error during validation', error);
      return false;
    }
  }

  parsePaymentNotification(payload: unknown): PaymentNotification {
    const p = payload as CryptomusWebhookPayload;

    return {
      orderId: p.order_id || p.merchant_order_id || '',
      status: this.mapPaymentStatus(p.status || 'pending'),
      amount: p.amount || p.payment_amount,
      currency: p.currency || p.payment_currency,
      txHash: p.txid || p.transaction_id,
      providerRef: p.uuid || p.payment_id,
    };
  }

  /** Alias – same as parsePaymentNotification */
  parseWebhook(payload: unknown): PaymentNotification {
    return this.parsePaymentNotification(payload);
  }

  async getPaymentStatus(
    providerRef: string,
  ): Promise<PaymentNotification> {
    this.logger.log(
      `getPaymentStatus – providerRef=${providerRef} [${this.mode}]`,
    );

    if (this.mode === 'demo') {
      return this.mockGetPaymentStatus(providerRef);
    }

    try {
      return await this.realGetPaymentStatus(providerRef);
    } catch (error) {
      if (this.mode === 'hybrid') {
        this.logger.warn(
          `Real API call failed, falling back to DEMO mode: ${(error as Error).message}`,
        );
        return this.mockGetPaymentStatus(providerRef);
      }
      throw error;
    }
  }

  async refund(providerRef: string): Promise<boolean> {
    this.logger.log(`refund – providerRef=${providerRef} [${this.mode}]`);

    if (this.mode === 'demo') {
      this.logger.log('refund – DEMO mode, returning true');
      return true;
    }

    try {
      await this.apiRequest('/payment/refund', { uuid: providerRef });
      return true;
    } catch (error) {
      if (this.mode === 'hybrid') {
        this.logger.warn(
          `Real API refund failed, returning true in hybrid mode: ${(error as Error).message}`,
        );
        return true;
      }
      this.logger.error('refund – failed', error);
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Real API calls
  // -----------------------------------------------------------------------

  private async realCreatePayment(
    params: CreatePaymentParams,
  ): Promise<PaymentResult> {
    const body: Record<string, unknown> = {
      amount: params.amount,
      currency: params.currency,
      order_id: params.orderId,
      url_return: params.returnUrl || '',
      url_callback: params.callbackUrl || '',
      is_payment_multiple: false,
      lifetime: 3600,
    };

    // Optional: convert to a different currency
    if (params.currency) {
      body.to_currency = params.currency;
    }

    const data = await this.apiRequest<CryptomusPaymentInfo>(
      '/payment',
      body,
    );

    return {
      paymentUrl: data.url || '',
      providerRef: data.uuid || data.order_id,
      expiresAt: data.expire_at
        ? new Date(data.expire_at * 1000)
        : undefined,
      providerData: data as unknown as Record<string, unknown>,
    };
  }

  private async realCreatePayout(
    params: CreatePayoutParams,
  ): Promise<PayoutResult> {
    const body: Record<string, unknown> = {
      amount: params.amount,
      currency: params.currency,
      order_id: params.orderId,
      address: params.destination,
      is_subtract: true,
    };

    const data = await this.apiRequest<CryptomusPayoutResult>(
      '/payout',
      body,
    );

    return {
      providerRef: data.uuid || data.order_id,
      status: this.mapPayoutStatus(data.status),
      providerData: data as unknown as Record<string, unknown>,
    };
  }

  private async realGetPaymentStatus(
    providerRef: string,
  ): Promise<PaymentNotification> {
    const data = await this.apiRequest<CryptomusPaymentInfo>(
      '/payment/info',
      { uuid: providerRef },
    );

    return {
      orderId: data.order_id,
      status: this.mapPaymentStatus(data.status),
      amount: data.amount,
      currency: data.currency,
      txHash: data.txid,
      providerRef: data.uuid,
    };
  }

  /**
   * Core HTTP request helper.
   *
   * Cryptomus expects:
   *  - merchant header  = merchant UUID
   *  - sign header      = MD5( base64(JSON body) + apiKey )
   *  - body             = raw JSON (NOT base64-encoded)
   */
  private async apiRequest<T>(
    endpoint: string,
    payload: Record<string, unknown>,
  ): Promise<T> {
    const jsonString = JSON.stringify(payload);
    const base64Payload = Buffer.from(jsonString).toString('base64');
    const sign = crypto
      .createHash('md5')
      .update(base64Payload + this.apiKey)
      .digest('hex');

    const url = `${this.baseUrl}${endpoint}`;
    this.logger.debug(`apiRequest → POST ${url}`);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          merchant: this.merchantId,
          sign,
        },
        body: jsonString,
      });
    } catch (networkError) {
      throw new Error(
        `Cryptomus network error (${endpoint}): ${(networkError as Error).message}`,
      );
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Cryptomus HTTP ${response.status} (${endpoint}): ${errorBody}`,
      );
    }

    let json: CryptomusApiResponse<T>;
    try {
      json = (await response.json()) as CryptomusApiResponse<T>;
    } catch {
      throw new Error(
        `Cryptomus response is not valid JSON (${endpoint})`,
      );
    }

    if (json.state !== 0) {
      const msg = json.message || JSON.stringify(json.errors) || 'Unknown error';
      throw new Error(`Cryptomus API error (state=${json.state}): ${msg}`);
    }

    if (!json.result) {
      throw new Error(
        `Cryptomus response missing "result" field (${endpoint})`,
      );
    }

    return json.result;
  }

  // -----------------------------------------------------------------------
  // Mock / Demo helpers
  // -----------------------------------------------------------------------

  private mockCreatePayment(params: CreatePaymentParams): PaymentResult {
    const uuid = generateUuid();
    const orderId = params.orderId;
    const paymentUrl = `https://pay.cryptomus.com/pay/${uuid}`;

    this.logger.log(
      `mockCreatePayment – returning mock invoice uuid=${uuid} orderId=${orderId}`,
    );

    return {
      paymentUrl,
      providerRef: uuid,
      expiresAt: futureDate(3600),
      providerData: {
        uuid,
        order_id: orderId,
        amount: params.amount,
        currency: params.currency,
        url: paymentUrl,
        status: 'check',
        expire_at: Math.floor(Date.now() / 1000) + 3600,
        merchant_order_id: orderId,
        is_final: false,
        currency_data: {
          currency: params.currency,
          network: 'ERC20',
        },
      },
    };
  }

  private mockCreatePayout(params: CreatePayoutParams): PayoutResult {
    const uuid = generateUuid();
    const orderId = params.orderId;

    this.logger.log(
      `mockCreatePayout – returning mock payout uuid=${uuid} orderId=${orderId}`,
    );

    return {
      providerRef: uuid,
      status: 'processing',
      providerData: {
        uuid,
        order_id: orderId,
        amount: params.amount,
        currency: params.currency,
        status: 'processing',
        txid: generateTxHash(),
      },
    };
  }

  private mockGetPaymentStatus(
    providerRef: string,
  ): PaymentNotification {
    // Deterministic-ish: use the last char of the uuid to pick a status
    const statuses: PaymentNotification['status'][] = [
      'pending',
      'paid',
      'completed',
    ];
    const idx = providerRef.charCodeAt(providerRef.length - 1) % statuses.length;
    const status = statuses[idx];

    this.logger.log(
      `mockGetPaymentStatus – providerRef=${providerRef} → status=${status}`,
    );

    return {
      orderId: `demo-order-${providerRef.slice(-8)}`,
      status,
      amount: '100.00',
      currency: 'USDT',
      txHash: status === 'completed' ? generateTxHash() : undefined,
      providerRef,
    };
  }

  // -----------------------------------------------------------------------
  // Status mappers
  // -----------------------------------------------------------------------

  private mapPaymentStatus(status: string): PaymentNotification['status'] {
    const mapping: Record<string, PaymentNotification['status']> = {
      pending: 'pending',
      paid: 'paid',
      completed: 'completed',
      success: 'completed',
      check: 'pending',
      wrong_amount: 'failed',
      cancel: 'cancelled',
      cancelled: 'cancelled',
      expired: 'expired',
      failed: 'failed',
      refund: 'cancelled',
      refunded: 'cancelled',
      process: 'pending',
      processing: 'pending',
      confirm_check: 'pending',
      wrong_amount_pay: 'failed',
    };
    return mapping[status?.toLowerCase()] || 'pending';
  }

  private mapPayoutStatus(
    status: string,
  ): PayoutResult['status'] {
    const mapping: Record<string, PayoutResult['status']> = {
      pending: 'pending',
      processing: 'processing',
      completed: 'completed',
      success: 'completed',
      failed: 'failed',
      cancel: 'failed',
      cancelled: 'failed',
      paid: 'completed',
      process: 'processing',
    };
    return mapping[status?.toLowerCase()] || 'pending';
  }
}
