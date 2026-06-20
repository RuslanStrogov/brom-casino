export interface CreatePaymentParams {
  amount: string;
  currency: string;
  orderId: string;
  userId: string;
  description?: string;
  returnUrl?: string;
  callbackUrl?: string;
}

export interface PaymentResult {
  paymentUrl: string;
  providerRef: string;
  expiresAt?: Date;
  providerData?: Record<string, any>;
}

export interface CreatePayoutParams {
  amount: string;
  currency: string;
  orderId: string;
  destination: string;
  userId: string;
}

export interface PayoutResult {
  providerRef: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  providerData?: Record<string, any>;
}

export interface PaymentNotification {
  orderId: string;
  status: 'pending' | 'paid' | 'completed' | 'failed' | 'expired' | 'cancelled';
  amount?: string;
  currency?: string;
  txHash?: string;
  providerRef?: string;
}

export interface PaymentProvider {
  readonly providerId: string;

  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;

  createPayout(params: CreatePayoutParams): Promise<PayoutResult>;

  validateWebhook(payload: any, signature: string): boolean;

  parsePaymentNotification(payload: any): PaymentNotification;

  getPaymentStatus?(providerRef: string): Promise<PaymentNotification>;

  refund?(providerRef: string): Promise<boolean>;
}
