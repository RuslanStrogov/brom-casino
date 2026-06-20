# Brom Casino — Payment System Documentation

## Supported Payment Methods

### Cryptocurrency (Primary for RU market)

| Currency | Network | Min Deposit | Min Withdrawal | Fee |
|----------|---------|-------------|----------------|-----|
| USDT | TRC-20 / ERC-20 | 10 USDT | 20 USDT | 1% |
| BTC | Bitcoin | 0.0001 BTC | 0.0005 BTC | 0.5% |
| TON | TON | 1 TON | 5 TON | 0.5% |
| ETH | ERC-20 | 0.001 ETH | 0.005 ETH | 0.5% |

### Payment Service Providers

#### Cryptomus
- **Type:** Crypto payment gateway
- **API:** REST
- **Features:** Auto-conversion, webhooks, payouts
- **Commission:** 0.5-1%
- **Integration:** `services/api/src/modules/payments/providers/cryptomus.psp.ts`

#### NOWPayments
- **Type:** Crypto payment gateway
- **API:** REST
- **Features:** 100+ coins, auto-conversion, fiat on-ramp
- **Commission:** 0.5%

#### Corefy
- **Type:** Card payment aggregator
- **API:** REST
- **Features:** Bank cards, e-wallets, alternative methods
- **Commission:** 2.5-4%

## Deposit Flow

```
1. User selects currency and amount
2. API creates invoice via PSP
3. User receives payment address/QR
4. User sends crypto
5. PSP sends webhook to /api/payments/webhook/:provider
6. Payment Worker validates and credits balance
7. User receives notification
```

## Withdrawal Flow

```
1. User requests withdrawal (amount, currency, address)
2. System checks: KYC status, wagering requirements, limits
3. Admin review (manual or auto for trusted users)
4. PSP processes payout
5. Balance deducted, transaction recorded
6. User receives confirmation
```

## Webhook Security

- HMAC-SHA256 signature verification
- IP whitelist per PSP
- Idempotency key checking
- Amount tolerance: ±1%

## Reconciliation

- Hourly: Check pending deposits against PSP
- Daily: Full balance reconciliation
- Weekly: Generate financial reports
