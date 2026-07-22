// ===== Enums =====

export enum Role {
  PLAYER = 'PLAYER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUPPORT = 'SUPPORT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
  SELF_EXCLUDED = 'SELF_EXCLUDED',
}

export enum GameCategory {
  SLOTS = 'SLOTS',
  TABLE = 'TABLE',
  LIVE = 'LIVE',
  CRASH = 'CRASH',
  KENO = 'KENO',
  LOTTERY = 'LOTTERY',
  DICE = 'DICE',
  PLINKO = 'PLINKO',
}

export enum Volatility {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  BET = 'BET',
  WIN = 'WIN',
  BONUS = 'BONUS',
  REFERRAL = 'REFERRAL',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum BonusType {
  WELCOME = 'WELCOME',
  DEPOSIT_MATCH = 'DEPOSIT_MATCH',
  FREE_SPINS = 'FREE_SPINS',
  CASHBACK = 'CASHBACK',
  NO_DEPOSIT = 'NO_DEPOSIT',
  REFERRAL = 'REFERRAL',
  DAILY = 'DAILY',
  VIP = 'VIP',
}

export enum BonusStatus {
  ACTIVE = 'ACTIVE',
  WAGERING = 'WAGERING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum KycStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// ===== Game Types =====

export interface SlotConfig {
  reels: number;
  rows: number;
  symbols: SlotSymbol[];
  paylines: Payline[];
  rtp: number;
  volatility: Volatility;
}

export interface SlotSymbol {
  id: string;
  name: string;
  value: number;
  isWild: boolean;
  isScatter: boolean;
  isBonus: boolean;
}

export interface Payline {
  id: number;
  positions: number[];
}

export interface SpinResult {
  reels: string[][];
  winLines: WinLine[];
  totalWin: number;
  multiplier: number;
  isBonus: boolean;
  freeSpinsWon: number;
}

export interface WinLine {
  paylineId: number;
  symbol: string;
  count: number;
  win: number;
  positions: { reel: number; row: number }[];
}

// ===== Provably Fair =====

export interface ProvablyFairData {
  serverSeed: string;
  serverHash: string;
  clientSeed: string;
  nonce: number;
}

export interface VerifiableResult {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  hash: string;
  result: number;
}

// ===== API Types =====

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ===== WebSocket Events =====

export enum WSEvent {
  // Client -> Server
  GAME_SPIN = 'game:spin',
  GAME_JOIN = 'game:join',
  GAME_LEAVE = 'game:leave',
  CHAT_MESSAGE = 'chat:message',

  // Server -> Client
  GAME_RESULT = 'game:result',
  GAME_ERROR = 'game:error',
  BALANCE_UPDATE = 'balance:update',
  CHAT_NEW_MESSAGE = 'chat:new_message',
  CRASH_TICK = 'crash:tick',
  CRASH_RESULT = 'crash:result',
  NOTIFICATION = 'notification',
}

// ===== Constants =====

export const DEFAULT_CURRENCY = 'USDT';
export const SUPPORTED_CURRENCIES = ['USDT', 'BTC', 'TON', 'ETH'] as const;
export const DEFAULT_RTP = 0.96;
export const MIN_DEPOSIT = 1; // USDT
export const MAX_DEPOSIT = 100000; // USDT
export const MIN_WITHDRAWAL = 10; // USDT
export const MAX_WITHDRAWAL = 50000; // USDT
export const DEFAULT_WAGERING_REQUIREMENT = 35;

// ===== Fiat Payment Constants =====

export const FIAT_CURRENCIES = ['RUB', 'USD', 'EUR', 'KZT', 'UAH', 'INR', 'TJS', 'KGS', 'UZS', 'AZN', 'AMD', 'BRL', 'TRY', 'MXN', 'CNY', 'CAD', 'AUD', 'DKK', 'NOK', 'SEK', 'JPY', 'KRW'] as const;
export const FIAT_CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽', USD: '$', EUR: '€', KZT: '₸', UAH: '₴', INR: '₹', TJS: '₸', KGS: 'с', UZS: 'с', AZN: '₼', AMD: '֏', BRL: 'R$', TRY: '₺', MXN: '$', CNY: '¥', CAD: '$', AUD: '$', DKK: 'kr', NOK: 'kr', SEK: 'kr', JPY: '¥', KRW: '₩',
};

export const FiatPaymentMethodType = {
  CARD: 'card',
  SB_PAYMENT: 'sbp', // SBP — Система Быстрых Платежей
  ECORPAY: 'ecorpay',
  YOUMONEY: 'yoomoney',
  FK_WALLET: 'fkwallet',
  APPLE_PAY: 'applepay',
  GOOGLE_PAY: 'googlepay',
  OPEN_BANKING: 'openbanking',
} as const;

export type FiatPaymentMethod = typeof FiatPaymentMethodType[keyof typeof FiatPaymentMethodType];

export const FIAT_PAYMENT_METHODS = [
  { id: 'card', name: 'Карта', icon: '💳', min: 100, max: 150000, fee: 0 },
  { id: 'sbp', name: 'СБП', icon: '🏦', min: 100, max: 300000, fee: 0 },
  { id: 'ecorpay', name: 'Ecorpay', icon: '💼', min: 100, max: 150000, fee: 0 },
  { id: 'yoomoney', name: 'ЮMoney', icon: '💰', min: 500, max: 75000, fee: 0 },
  { id: 'fkwallet', name: 'FK Wallet', icon: '👛', min: 1000, max: 50000, fee: 0 },
  { id: 'applepay', name: 'Apple Pay', icon: '📱', min: 100, max: 150000, fee: 0 },
  { id: 'googlepay', name: 'Google Pay', icon: '📱', min: 100, max: 150000, fee: 0 },
  { id: 'openbanking', name: 'Open Banking', icon: '🏛️', min: 5000, max: 300000, fee: 0 },
] as const;

export const SBP_BANKS = [
  { id: 'tbank', name: 'Т-Банк', icon: '🅱️' },
  { id: 'sberbank', name: 'Сбербанк', icon: '💚' },
  { id: 'vtb', name: 'ВТБ', icon: '💙' },
  { id: 'psb', name: 'ПСБ', icon: '🔵' },
  { id: 'alfa', name: 'Альфа-Банк', icon: '❤️' },
  { id: 'gazprom', name: 'Газпромбанк', icon: '💙' },
  { id: 'ozon', name: 'Ozon Банк', icon: '📦' },
  { id: 'otp', name: 'ОТП Банк', icon: '🔴' },
  { id: 'yandex', name: 'Yandex Bank', icon: '🟡' },
  { id: 'sovcombank', name: 'Sovcombank', icon: '🔴' },
  { id: 'other_sbp', name: 'Другой банк СБП', icon: '🏦' },
  { id: 'other_p2p', name: 'Другой банк P2P', icon: '🏧' },
] as const;

export const FIAT_DEPOSIT_PRESETS = [500, 1000, 2500, 5000, 10000] as const;
export const MIN_FIAT_DEPOSIT = 100;
export const MAX_FIAT_DEPOSIT = 300000;
export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';
export const SESSION_EXPIRY_DAYS = 7;
export const RATE_LIMIT_WINDOW_MS = 60000;
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const AUTH_RATE_LIMIT_MAX = 10;

// ===== Utility Types =====

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Decimal = string; // Always use string for precision
