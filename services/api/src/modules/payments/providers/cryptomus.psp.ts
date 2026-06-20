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

@Injectable()
export class CryptomusPsp implements PaymentProvider {
  readonly providerId = 'cryptomus';
  private readonly logger = new Logger(CryptomusPsp.name);

  private readonly apiKey: string;
  private readonly merchantId: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('CRYPTOMUS_API_KEY') || '';
    this.merchantId = this.configService.get<string>('CRYPTOMUS_MERCHANT_ID') || '';
    this.baseUrl = 'https://api.cryptomus.com/v1';
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const payload = {
      amount: params.amount,
      currency: params.currency,
      order_id: params.orderId,
      url_return: params.returnUrl,
      url_callback: params.callbackUrl,
      is_payment_multiple: false,
      lifetime: 3600, // 1 hour
      to_currency: params.currency,
    };

    try {
      const response = await this.request('/payment', payload);
      const data = response.result;

      return {
        paymentUrl: data.url,
        providerRef: data.uuid || data.order_id,
        expiresAt: data.expire_at ? new Date(data.expire_at * 1000) : undefined,
        providerData: data,
      };
    } catch (error) {
      this.logger.error('Cryptomus create payment failed', error);
      throw error;
    }
  }

  async createPayout(params: CreatePayoutParams): Promise<PayoutResult> {
    const payload = {
      amount: params.amount,
      currency: params.currency,
      order_id: params.orderId,
      address: params.destination,
      is_subtract: true, // subtract from balance
    };

    try {
      const response = await this.request('/payout', payload);
      const data = response.result;

      return {
        providerRef: data.uuid || data.order_id,
        status: this.mapPayoutStatus(data.status),
        providerData: data,
      };
    } catch (error) {
      this.logger.error('Cryptomus create payout failed', error);
      throw error;
    }
  }

  validateWebhook(payload: any, signature: string): boolean {
    try {
      const payloadCopy = { ...payload };
      delete payloadCopy.sign;

      const sortedKeys = Object.keys(payloadCopy).sort();
      const sortedPayload: Record<string, any> = {};
      for (const key of sortedKeys) {
        sortedPayload[key] = payloadCopy[key];
      }

      const jsonString = JSON.stringify(sortedPayload);
      const base64Payload = Buffer.from(jsonString).toString('base64');
      const expectedSignature = crypto
        .createHash('md5')
        .update(base64Payload + this.apiKey)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      this.logger.error('Webhook validation error', error);
      return false;
    }
  }

  parsePaymentNotification(payload: any): PaymentNotification {
    return {
      orderId: payload.order_id || payload.merchant_order_id,
      status: this.mapPaymentStatus(payload.status),
      amount: payload.amount,
      currency: payload.currency || payload.payment_currency,
      txHash: payload.txid || payload.transaction_id,
      providerRef: payload.uuid || payload.payment_id,
    };
  }

  async getPaymentStatus(providerRef: string): Promise<PaymentNotification> {
    try {
      const response = await this.request('/payment/info', { uuid: providerRef });
      const data = response.result;

      return {
        orderId: data.order_id,
        status: this.mapPaymentStatus(data.status),
        amount: data.amount,
        currency: data.currency,
        txHash: data.txid,
        providerRef: data.uuid,
      };
    } catch (error) {
      this.logger.error('Cryptomus get payment status failed', error);
      throw error;
    }
  }

  async refund(providerRef: string): Promise<boolean> {
    try {
      await this.request('/payment/refund', { uuid: providerRef });
      return true;
    } catch (error) {
      this.logger.error('Cryptomus refund failed', error);
      return false;
    }
  }

  private async request(endpoint: string, payload: Record<string, any>): Promise<any> {
    const jsonString = JSON.stringify(payload);
    const base64Payload = Buffer.from(jsonString).toString('base64');
    const sign = crypto
      .createHash('md5')
      .update(base64Payload + this.apiKey)
      .digest('hex');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        merchant: this.merchantId,
        sign,
      },
      body: jsonString,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Cryptomus API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    if (data.state !== 0 && data.state !== undefined) {
      throw new Error(`Cryptomus error: ${JSON.stringify(data)}`);
    }

    return data;
  }

  private mapPaymentStatus(status: string): PaymentNotification['status'] {
    const mapping: Record<string, PaymentNotification['status']> = {
      pending: 'pending',
      paid: 'paid',
      completed: 'completed',
      success: 'completed',
      check: 'pending',
      wrong_amount: 'failed',
      cancel: 'cancelled',
      expired: 'expired',
      failed: 'failed',
      refund: 'cancelled',
    };
    return mapping[status?.toLowerCase()] || 'pending';
  }

  private mapPayoutStatus(status: string): PayoutResult['status'] {
    const mapping: Record<string, PayoutResult['status']> = {
      pending: 'pending',
      processing: 'processing',
      completed: 'completed',
      success: 'completed',
      failed: 'failed',
      cancel: 'failed',
    };
    return mapping[status?.toLowerCase()] || 'pending';
  }
}
