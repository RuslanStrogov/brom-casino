-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLAYER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'SELF_EXCLUDED');
CREATE TYPE "GameCategory" AS ENUM ('SLOTS', 'TABLE', 'LIVE', 'CRASH', 'KENO', 'LOTTERY', 'DICE', 'PLINKO');
CREATE TYPE "Volatility" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'BONUS', 'REFERRAL', 'ADJUSTMENT');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "BonusType" AS ENUM ('WELCOME', 'DEPOSIT_MATCH', 'FREE_SPINS', 'CASHBACK', 'NO_DEPOSIT', 'REFERRAL', 'DAILY', 'VIP');
CREATE TYPE "BonusStatus" AS ENUM ('ACTIVE', 'WAGERING', 'COMPLETED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED');

-- CreateTable: users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "username" TEXT,
    "passwordHash" TEXT,
    "telegramId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "is2faEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "referralCode" TEXT,
    "referredBy" TEXT,
    "vipLevel" INTEGER NOT NULL DEFAULT 0,
    "totalWagered" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalWon" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "selfExcludeUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sessions
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: wallets
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "bonusBalance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: games
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "GameCategory" NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "bannerUrl" TEXT,
    "rtp" DECIMAL(18,8),
    "volatility" "Volatility",
    "minBet" DECIMAL(18,8) NOT NULL DEFAULT 0.1,
    "maxBet" DECIMAL(18,8) NOT NULL DEFAULT 10000,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "isJackpot" BOOLEAN NOT NULL DEFAULT false,
    "freeSpins" BOOLEAN NOT NULL DEFAULT false,
    "demoAvailable" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable: game_sessions
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'real',
    "totalBet" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalWin" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "spinsCount" INTEGER NOT NULL DEFAULT 0,
    "serverSeed" TEXT,
    "serverHash" TEXT,
    "clientSeed" TEXT,
    "nonce" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bets
CREATE TABLE "bets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" DECIMAL(18,8) NOT NULL,
    "winAmount" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "multiplier" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "serverSeed" TEXT,
    "serverHash" TEXT,
    "clientSeed" TEXT,
    "nonce" INTEGER,
    "result" JSONB,
    "provablyFair" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: transactions
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(18,8) NOT NULL,
    "fee" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "balanceBefore" DECIMAL(18,8),
    "balanceAfter" DECIMAL(18,8),
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: deposits
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "fee" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "paymentMethod" TEXT NOT NULL,
    "providerRef" TEXT,
    "providerData" JSONB,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable: withdrawals
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "fee" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "paymentMethod" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "providerRef" TEXT,
    "providerData" JSONB,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bonuses
CREATE TABLE "bonuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "BonusType" NOT NULL,
    "status" "BonusStatus" NOT NULL DEFAULT 'ACTIVE',
    "amount" DECIMAL(18,8),
    "maxAmount" DECIMAL(18,8),
    "freeSpins" INTEGER,
    "wageringRequirement" INTEGER NOT NULL DEFAULT 35,
    "minDeposit" DECIMAL(18,8),
    "maxBetWithBonus" DECIMAL(18,8),
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "eligibleGames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eligibleCategories" "GameCategory"[] DEFAULT ARRAY[]::"GameCategory"[],
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "maxClaims" INTEGER,
    "currentClaims" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_bonuses
CREATE TABLE "user_bonuses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bonusId" TEXT NOT NULL,
    "status" "BonusStatus" NOT NULL DEFAULT 'ACTIVE',
    "amount" DECIMAL(18,8) NOT NULL,
    "wageringRequired" DECIMAL(18,8) NOT NULL,
    "wageringProgress" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "freeSpinsTotal" INTEGER,
    "freeSpinsUsed" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: kyc_verifications
CREATE TABLE "kyc_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "level" INTEGER NOT NULL DEFAULT 0,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "documentFrontUrl" TEXT,
    "documentBackUrl" TEXT,
    "selfieUrl" TEXT,
    "proofOfAddressUrl" TEXT,
    "country" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable: chat_messages
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "room" TEXT NOT NULL DEFAULT 'global',
    "message" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- ==================== INDEXES ====================

-- users indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_telegramId_key" ON "users"("telegramId");
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_telegramId_idx" ON "users"("telegramId");
CREATE INDEX "users_referralCode_idx" ON "users"("referralCode");
CREATE INDEX "users_status_idx" ON "users"("status");

-- sessions indexes
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX "sessions_refreshToken_idx" ON "sessions"("refreshToken");

-- wallets indexes
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");
CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");

-- games indexes
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");
CREATE UNIQUE INDEX "games_providerId_externalId_key" ON "games"("providerId", "externalId");
CREATE INDEX "games_category_idx" ON "games"("category");
CREATE INDEX "games_isActive_idx" ON "games"("isActive");
CREATE INDEX "games_isFeatured_idx" ON "games"("isFeatured");

-- game_sessions indexes
CREATE UNIQUE INDEX "game_sessions_sessionToken_key" ON "game_sessions"("sessionToken");
CREATE INDEX "game_sessions_userId_idx" ON "game_sessions"("userId");
CREATE INDEX "game_sessions_gameId_idx" ON "game_sessions"("gameId");

-- bets indexes
CREATE UNIQUE INDEX "bets_transactionId_key" ON "bets"("transactionId");
CREATE INDEX "bets_userId_idx" ON "bets"("userId");
CREATE INDEX "bets_gameId_idx" ON "bets"("gameId");
CREATE INDEX "bets_createdAt_idx" ON "bets"("createdAt");

-- transactions indexes
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");
CREATE INDEX "transactions_walletId_idx" ON "transactions"("walletId");
CREATE INDEX "transactions_type_idx" ON "transactions"("type");
CREATE INDEX "transactions_status_idx" ON "transactions"("status");
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- deposits indexes
CREATE UNIQUE INDEX "deposits_providerRef_key" ON "deposits"("providerRef");
CREATE INDEX "deposits_userId_idx" ON "deposits"("userId");
CREATE INDEX "deposits_status_idx" ON "deposits"("status");
CREATE INDEX "deposits_providerRef_idx" ON "deposits"("providerRef");

-- withdrawals indexes
CREATE UNIQUE INDEX "withdrawals_providerRef_key" ON "withdrawals"("providerRef");
CREATE INDEX "withdrawals_userId_idx" ON "withdrawals"("userId");
CREATE INDEX "withdrawals_status_idx" ON "withdrawals"("status");

-- bonuses indexes
CREATE UNIQUE INDEX "bonuses_code_key" ON "bonuses"("code");
CREATE INDEX "bonuses_type_idx" ON "bonuses"("type");
CREATE INDEX "bonuses_status_idx" ON "bonuses"("status");
CREATE INDEX "bonuses_code_idx" ON "bonuses"("code");

-- user_bonuses indexes
CREATE INDEX "user_bonuses_userId_idx" ON "user_bonuses"("userId");
CREATE INDEX "user_bonuses_bonusId_idx" ON "user_bonuses"("bonusId");
CREATE INDEX "user_bonuses_status_idx" ON "user_bonuses"("status");

-- kyc_verifications indexes
CREATE UNIQUE INDEX "kyc_verifications_userId_key" ON "kyc_verifications"("userId");
CREATE INDEX "kyc_verifications_userId_idx" ON "kyc_verifications"("userId");
CREATE INDEX "kyc_verifications_status_idx" ON "kyc_verifications"("status");

-- chat_messages indexes
CREATE INDEX "chat_messages_room_idx" ON "chat_messages"("room");
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- audit_logs indexes
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- ==================== FOREIGN KEYS ====================

-- users -> users (referrals)
ALTER TABLE "users" ADD CONSTRAINT "users_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- sessions -> users
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- wallets -> users
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- game_sessions -> users
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- game_sessions -> games
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- bets -> users
ALTER TABLE "bets" ADD CONSTRAINT "bets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- bets -> games
ALTER TABLE "bets" ADD CONSTRAINT "bets_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- bets -> game_sessions
ALTER TABLE "bets" ADD CONSTRAINT "bets_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- transactions -> users
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- transactions -> wallets
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- deposits -> users
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- deposits -> wallets
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- withdrawals -> users
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- withdrawals -> wallets
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- user_bonuses -> users
ALTER TABLE "user_bonuses" ADD CONSTRAINT "user_bonuses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- user_bonuses -> bonuses
ALTER TABLE "user_bonuses" ADD CONSTRAINT "user_bonuses_bonusId_fkey" FOREIGN KEY ("bonusId") REFERENCES "bonuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- kyc_verifications -> users
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- chat_messages -> users
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- audit_logs -> users
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
