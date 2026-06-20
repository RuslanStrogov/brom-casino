# Детальная архитектура CatSpin Casino

## 1. Общая архитектура системы

```
                            ┌──────────────┐
                            │   CloudFlare  │
                            │   (CDN+WAF)  │
                            └──────┬───────┘
                                   │
                            ┌──────┴───────┐
                            │    Nginx     │
                            │  (Reverse    │
                            │   Proxy)     │
                            └──────┬───────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
     ┌────────┴────────┐  ┌───────┴───────┐  ┌────────┴────────┐
     │   Web App       │  │  Admin Panel  │  │  Telegram TWA   │
     │  (Next.js 14)   │  │  (Next.js 14) │  │  (React + SDK)  │
     │  Port: 3000     │  │  Port: 3001   │  │  Port: 3002     │
     └────────┬────────┘  └───────┬───────┘  └────────┬────────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                            ┌──────┴───────┐
                            │  API Gateway  │
                            │  (NestJS)    │
                            │  Port: 4000  │
                            └──────┬───────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
  ┌──────┴──────┐  ┌──────────────┴──┐  ┌──────────────────┐
  │ Game Server │  │  Payment Worker │  │  Notification    │
  │ (WebSocket) │  │  (Bull Queue)   │  │  Service         │
  │ Port: 4001  │  │  Port: 4002     │  │  Port: 4003      │
  └──────┬──────┘  └────────┬────────┘  └────────┬─────────┘
         │                  │                     │
         └──────────────────┼─────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
       ┌──────┴──────┐ ┌───┴────┐ ┌──────┴──────┐
       │ PostgreSQL  │ │ Redis  │ │ ClickHouse  │
       │   :5432     │ │ :6379  │ │   :8123     │
       └─────────────┘ └────────┘ └─────────────┘
```

## 2. Микросервисы

### 2.1. API Gateway (NestJS)

**Ответственность:**
- REST API для всех клиентов
- Аутентификация и авторизация (JWT + Refresh tokens)
- Rate limiting и throttling
- Валидация входных данных (class-validator)
- Swagger документация

**Модули:**
```
apps/api/src/
├── main.ts                          # Точка входа
├── app.module.ts                    # Корневой модуль
├── common/                          # Общие компоненты
│   ├── decorators/                  # Кастомные декораторы
│   ├── filters/                     # Exception filters
│   ├── guards/                      # Guards (Auth, Role, RateLimit)
│   ├── interceptors/                # Interceptors (Logging, Transform)
│   ├── pipes/                       # Validation pipes
│   └── middleware/                  # Middleware (CORS, Logger)
├── config/                          # Конфигурация
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── app.config.ts
│   └── jwt.config.ts
├── modules/
│   ├── auth/                        # Аутентификация
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/              # JWT, Telegram, OAuth
│   │   ├── dto/
│   │   └── guards/
│   ├── users/                       # Пользователи
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   └── dto/
│   ├── games/                       # Игры
│   │   ├── games.module.ts
│   │   ├── games.controller.ts
│   │   ├── games.service.ts
│   │   ├── providers/               # Интеграции с провайдерами
│   │   │   ├── base.provider.ts
│   │   │   ├── pragmatic-play.provider.ts
│   │   │   ├── play-n-go.provider.ts
│   │   │   └── endorphina.provider.ts
│   │   └── dto/
│   ├── wallet/                      # Кошелёк и транзакции
│   │   ├── wallet.module.ts
│   │   ├── wallet.controller.ts
│   │   ├── wallet.service.ts
│   │   └── entities/
│   ├── payments/                    # Платежи
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── providers/               # PSP интеграции
│   │   │   ├── base.psp.ts
│   │   │   ├── cryptomus.psp.ts
│   │   │   ├── nowpayments.psp.ts
│   │   │   └── corefy.psp.ts
│   │   └── webhooks/
│   ├── bonuses/                     # Бонусная система
│   │   ├── bonuses.module.ts
│   │   ├── bonuses.controller.ts
│   │   ├── bonuses.service.ts
│   │   └── entities/
│   ├── kyc/                         # KYC/AML
│   │   ├── kyc.module.ts
│   │   ├── kyc.controller.ts
│   │   └── kyc.service.ts
│   └── admin/                       # Административные эндпоинты
│       ├── admin.module.ts
│       ├── admin.controller.ts
│       └── admin.service.ts
└── prisma/
    ├── schema.prisma                # Схема БД
    ├── migrations/                  # Миграции
    └── seed.ts                      # Сиды
```

### 2.2. Game Server (WebSocket)

**Ответственность:**
- Игровая логика в реальном времени
- RNG (Random Number Generator)
- Состояние игровых сессий
- Crash-игры, чат, лидерборды

**Структура:**
```
services/game-server/src/
├── main.ts
├── game-server.module.ts
├── gateways/
│   ├── game.gateway.ts            # WebSocket шлюз
│   └── chat.gateway.ts            # Чат
├── games/
│   ├── slot/
│   │   ├── slot.engine.ts         # Механика слотов
│   │   ├── slot.reels.ts          # Конфигурация барабанов
│   │   └── slot.paylines.ts       # Выигрышные линии
│   ├── crash/
│   │   ├── crash.engine.ts        # Механика crash-игры
│   │   └── crash.verification.ts  # Provably fair
│   ├── dice/
│   │   └── dice.engine.ts
│   └── plinko/
│       └── plinko.engine.ts
├── rng/
│   ├── rng.service.ts             # Криптографический RNG
│   ├── provably-fair.ts           # Provably fair алгоритм
│   └── verification.ts            # Верификация результатов
├── session/
│   ├── session.manager.ts         # Управление сессиями
│   └── game-state.ts              # Состояние игры
└── entities/
    ├── game-session.entity.ts
    └── game-result.entity.ts
```

### 2.3. Payment Worker

**Ответственность:**
- Обработка входящих/исходящих платежей
- Конвертация валют
- Реконсиляция с PSP
- Генерация отчётов

```
services/payment-worker/src/
├── main.ts
├── payment-worker.module.ts
├── processors/
│   ├── deposit.processor.ts       # Обработка депозитов
│   ├── withdrawal.processor.ts    # Обработка выводов
│   └── reconciliation.processor.ts # Реконсиляция
├── jobs/
│   ├── check-pending-deposits.ts  # Проверка ожидающих депозитов
│   ├── process-withdrawals.ts     # Обработка выводов
│   └── sync-exchange-rates.ts     # Синхронизация курсов
└── providers/
    ├── base.provider.ts
    ├── cryptomus.provider.ts
    ├── nowpayments.provider.ts
    └── corefy.provider.ts
```

## 3. Схема базы данных

```prisma
// Основные сущности

model User {
  id            String    @id @default(cuid())
  email         String?   @unique
  phone         String?   @unique
  username      String?   @unique
  passwordHash  String?
  telegramId    String?   @unique
  role          Role      @default(PLAYER)
  status        UserStatus @default(ACTIVE)
  balance       Decimal   @default(0) @db.Decimal(18, 8)
  currency      String    @default("USDT")
  vipLevel      Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      Session[]
  transactions  Transaction[]
  gameResults   GameResult[]
  bonuses       UserBonus[]
  kyc           KycVerification?
  wallets       Wallet[]
  referrals     Referral[]  @relation("referrer")
  referralsMade Referral[]  @relation("referred")
}

model Wallet {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  currency  String   // USDT, BTC, TON, ETH
  address   String?  // Адрес для крипто
  balance   Decimal  @default(0) @db.Decimal(18, 8)
  
  @@unique([userId, currency])
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  ip        String?
  userAgent String?
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Game {
  id            String       @id @default(cuid())
  slug          String       @unique
  name          String
  provider      String       // pragmatic-play, play-n-go, etc.
  category      GameCategory
  rtp           Decimal?     @db.Decimal(5, 2)
  volatility    Volatility?
  thumbnail     String?
  externalId    String?      // ID у провайдера
  isEnabled     Boolean      @default(true)
  isFeatured    Boolean      @default(false)
  
  results       GameResult[]
}

model GameResult {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  gameId        String
  game          Game     @relation(fields: [gameId], references: [id])
  betAmount     Decimal  @db.Decimal(18, 8)
  winAmount     Decimal  @default(0) @db.Decimal(18, 8)
  currency      String
  multiplier    Decimal? @db.Decimal(10, 4)
  result        Json?    // Детали результата (комбинация, линии и т.д.)
  serverSeed    String?  // Для provably fair
  clientSeed    String?
  nonce         Int?
  hash          String?
  createdAt     DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([gameId, createdAt])
}

model Transaction {
  id              String            @id @default(cuid())
  userId          String
  user            User              @relation(fields: [userId], references: [id])
  type            TransactionType
  amount          Decimal           @db.Decimal(18, 8)
  currency        String
  status          TransactionStatus @default(PENDING)
  externalId      String?           // ID у PSP
  provider        String?           // cryptomus, nowpayments, etc.
  walletAddress   String?
  fee             Decimal?          @db.Decimal(18, 8)
  metadata        Json?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([userId, createdAt])
  @@index([status, createdAt])
}

model Bonus {
  id              String       @id @default(cuid())
  name            String
  type            BonusType
  amount          Decimal?     @db.Decimal(18, 8)
  percentage      Decimal?     @db.Decimal(5, 2)
  freeSpins       Int?
  wageringReq     Int          // Вейджер (30x, 40x, etc.)
  maxBet          Decimal?     @db.Decimal(18, 8)
  minDeposit      Decimal?     @db.Decimal(18, 8)
  maxWin          Decimal?     @db.Decimal(18, 8)
  validDays       Int?
  isActive        Boolean      @default(true)
  startsAt        DateTime?
  endsAt          DateTime?
  
  userBonuses     UserBonus[]
}

model UserBonus {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  bonusId         String
  bonus           Bonus         @relation(fields: [bonusId], references: [id])
  status          BonusStatus   @default(ACTIVE)
  wageringProgress Decimal      @default(0) @db.Decimal(18, 8)
  wageringTarget   Decimal?     @db.Decimal(18, 8)
  spinsUsed       Int           @default(0)
  spinsTotal      Int?
  activatedAt     DateTime      @default(now())
  expiresAt       DateTime?
  completedAt     DateTime?
}

model KycVerification {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  status          KycStatus @default(PENDING)
  documentType    String?
  documentNumber  String?
  documentFront   String?
  documentBack    String?
  selfie          String?
  address         String?
  verifiedAt      DateTime?
  rejectedReason  String?
  provider        String?   // sumsub, veriff
  externalId      String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Referral {
  id              String   @id @default(cuid())
  referrerId      String
  referrer        User     @relation("referrer", fields: [referrerId], references: [id])
  referredId      String   @unique
  referred        User     @relation("referred", fields: [referredId], references: [id])
  commissionRate  Decimal  @db.Decimal(5, 2)
  totalEarned     Decimal  @default(0) @db.Decimal(18, 8)
  createdAt       DateTime @default(now())
}

// Enums
enum Role {
  PLAYER
  ADMIN
  SUPER_ADMIN
  SUPPORT
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
  SELF_EXCLUDED
}

enum GameCategory {
  SLOTS
  TABLE
  LIVE
  CRASH
  KENO
  LOTTERY
  DICE
  PLINKO
}

enum Volatility {
  LOW
  MEDIUM
  HIGH
  VERY_HIGH
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  BET
  WIN
  BONUS
  REFERRAL
  ADJUSTMENT
}

enum TransactionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum BonusType {
  WELCOME
  DEPOSIT_MATCH
  FREE_SPINS
  CASHBACK
  NO_DEPOSIT
  REFERRAL
  DAILY
  VIP
}

enum BonusStatus {
  ACTIVE
  WAGERING
  COMPLETED
  EXPIRED
  CANCELLED
}

enum KycStatus {
  PENDING
  IN_PROGRESS
  APPROVED
  REJECTED
}
```

## 4. Игровая логика (RNG)

### Provably Fair алгоритм

```
1. Сервер генерирует server_seed (случайные 32 байта)
2. Сервер публикует server_hash = SHA256(server_seed)
3. Клиент предоставляет client_seed (или генерируется)
4. Для каждого спина:
   nonce = nonce + 1
   result = HMAC-SHA256(server_seed, client_seed + ":" + nonce)
   result_hex = hex(result)
   result_number = int(result_hex[:8], 16) / 0xFFFFFFFF
5. После сессии сервер раскрывает server_seed для верификации
```

### Механика слотов

```
1. Игрок выбирает ставку и нажимает Spin
2. Сервер генерирует результат через RNG
3. Результат определяет позиции барабанов
4. Вычисляются выигрышные комбинации по paylines
5. Применяются множители (wild, scatter, bonus)
6. Выигрыш зачисляется на баланс
7. Возвращается результат с анимацией
```

## 5. Платёжная система

### Поток депозита

```
1. Пользователь выбирает метод пополнения
2. API создаёт инвойс у PSP (Cryptomus/NOWPayments)
3. Пользователь получает адрес/сумму для оплаты
4. PSP отправляет webhook при получении платежа
5. Payment Worker обрабатывает webhook
6. Баланс обновляется
7. Пользователь получает уведомление
```

### Поток вывода

```
1. Пользователь запрашивает вывод
2. Проверка: KYC, вейджер, лимитов
3. Создание транзакции (PENDING)
4. Ручная/автоматическая проверка (анти-фрод)
5. Отправка через PSP
6. Webhook подтверждения
7. Обновление баланса
```

## 6. Безопасность

- JWT + Refresh tokens (access: 15min, refresh: 7d)
- Rate limiting: 100 req/min для API, 10 req/min для auth
- CORS whitelist
- Helmet.js для HTTP заголовков
- Input validation (class-validator + DTO)
- SQL injection защита (Prisma parameterized queries)
- XSS защита (React автоматически + CSP)
- CSRF tokens для мутирующих запросов
- 2FA (TOTP через Google Authenticator)
- IP-based ограничения для админки
- Шифрование чувствительных данных в БД (AES-256)
- Audit log для всех административных действий

## 7. Масштабирование

- Stateless API серверы (горизонтальное масштабирование)
- Redis для сессий и кэша
- PostgreSQL с read replicas
- CDN для статики (CloudFlare)
- WebSocket через Redis adapter (горизонтальное масштабирование WS)
- Очереди через Bull (Redis) для фоновых задач
- Микросервисная архитектура (независимый деплой)
