# 🎰 Brom Casino

<div align="center">

![Brom Casino Banner](assets/screenshots/banner.png)

> Полнофункциональный клон онлайн-казино — веб-приложение, Telegram Mini App и админ-панель.
> Монорепозиторий на базе **Turborepo + pnpm**, стек: **NestJS + Next.js + React + TypeScript + PostgreSQL + Redis**.

[![CI](https://github.com/RuslanStrogov/brom-casino/actions/workflows/ci.yml/badge.svg)](https://github.com/RuslanStrogov/brom-casino/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## 📱 Screenshots

### Главный экран — мобильное приложение

<div align="center">

![Mobile Home](assets/screenshots/mobile-home.png)

*Главная страница: бонусный баннер, карусель featured-игр, сетка популярных игр, нижняя навигация*

</div>

### Игровой экран — Слот-машина

<div align="center">

![Slot Game](assets/screenshots/slot-game.png)

*Слот-машина с 5 барабанами, выбор ставки, кнопка SPIN, таблица выплат*

</div>

### Экран бонусов

<div align="center">

![Bonuses](assets/screenshots/bonuses.png)

*Приветственный бонус, ежедневный бонус, кэшбэк, VIP-программа, реферальная система*

</div>

### Панель администратора

<div align="center">

![Admin Panel](assets/screenshots/admin-panel.png)

*Дашборд: GGR, NGR, активные игроки, депозиты, транзакции, активные игры, графики*

</div>

---

## 🏗 Архитектура

<div align="center">

![Architecture](assets/screenshots/architecture.png)

*Клиенты → API Gateway → Микросервисы → Слой данных. DevOps: Docker, Nginx, CI/CD*

</div>

### Структура монорепозитория

```
brom-casino/
├── apps/
│   ├── web/                   # Next.js 14 — основной фронтенд для игроков
│   ├── admin/                 # Next.js 14 — панель администратора
│   └── telegram-mini-app/     # React + Vite — Telegram Mini App
├── packages/
│   ├── shared/                # Общие типы, утилиты, константы, енумы
│   ├── ui/                    # Общие UI-компоненты (shadcn/ui)
│   ├── game-engine/           # Игровая логика: RNG, слоты, crash, dice, plinko
│   └── config/                # Общие конфигурации (ESLint, TypeScript, Tailwind)
├── services/
│   ├── api/                   # NestJS — основной backend (REST + WebSocket)
│   ├── game-server/           # Node.js — игровая логика в реальном времени
│   └── payment-worker/        # Node.js — обработка платежей (Bull queue)
├── infrastructure/
│   ├── docker/                # Docker Compose, Dockerfile'ы
│   └── nginx/                 # Конфигурации nginx (reverse proxy)
├── docs/                      # Документация
├── assets/screenshots/        # Скриншоты интерфейса
├── .github/workflows/         # CI/CD (GitHub Actions)
├── package.json               # Root package.json (Turborepo)
├── turbo.json                 # Turborepo pipeline config
└── pnpm-workspace.yaml        # pnpm workspace definition
```

### Технологический стек

| Слой | Технология |
|------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| **Telegram** | React 18, Vite, Telegram Web App SDK, TON Connect |
| **Backend** | NestJS 10, TypeScript, Prisma ORM, Passport.js |
| **Database** | PostgreSQL 16, Redis 7, ClickHouse |
| **Queue** | Bull (Redis) |
| **Real-time** | Socket.io |
| **DevOps** | Docker, Docker Compose, Nginx, GitHub Actions |
| **Monitoring** | Sentry, Grafana (заглушки) |

---

## 📋 О проекте

**Brom Casino** — это полноценная платформа для запуска онлайн-казино, созданная с нуля.
Проект включает все ключевые компоненты: фронтенд для игроков, Telegram-приложение,
серверную часть, платёжную систему, бонусную механику, KYC/AML и панель администратора.

Проект разработан как **MVP-прототип** — все модули имеют полную структуру,
контроллеры, сервисы, DTO и схемы базы данных. Это фундамент,
на котором можно строить полноценный продукт.

### Ключевые возможности

- 🎮 **Игры** — слоты, crash, dice, plinko с криптографически верифицируемым RNG (Provably Fair)
- 🔐 **Авторизация** — JWT + Telegram OAuth + 2FA (TOTP)
- 💰 **Платежи** — криптовалюты (USDT, BTC, TON, ETH) через Cryptomus/NOWPayments
- 🎁 **Бонусная система** — welcome bonus, free spins, кэшбэк, вейджер
- 🛡️ **KYC/AML** — верификация личности, проверка документов
- 📱 **Telegram Mini App** — полноценное казино внутри Telegram с TON-платежами
- 👑 **Админ-панель** — управление пользователями, играми, платежами, бонусами
- 📊 **Аналитика** — ClickHouse для хранения событий и построения отчётов
- 🐳 **DevOps** — Docker Compose, Nginx, GitHub Actions CI/CD
- 🎰 **Pragmatic Play API** — реальные игры от провайдера (20+ слотов, live, настольные)
- 💳 **Cryptomus PSP** — крипто-платежи (USDT, BTC, TON, ETH), webhooks, выплаты
- 🛡️ **Sumsub KYC** — верификация личности, документы, AML compliance

### Интеграции провайдеров

Все интеграции поддерживают **три режима работы**:

| Режим | Описание | Как включить |
|-------|----------|-------------|
| **REAL** | Реальные API-вызовы к провайдеру | Заполните ключи в .env + `*_MODE=real` |
| **DEMO** | Моковые данные для разработки | Не заполняйте ключи или `*_MODE=demo` |
| **HYBRID** | Попытка реального API, fallback на мок | `*_MODE=hybrid` (по умолчанию) |

#### Pragmatic Play

```bash
# .env
PRAGMATIC_PLAY_API_URL="https://api.pragmaticplay.net"
PRAGMATIC_PLAY_API_KEY="your-api-key"
PRAGMATIC_PLAY_CASINO_NAME="your-casino"
PRAGMATIC_PLAY_SECRET_KEY="your-secret"
PRAGMATIC_PLAY_MODE="hybrid"
```

Получить ключи: https://pragmaticplay.net/en/integrations/api/

#### Cryptomus

```bash
# .env
CRYPTOMUS_API_KEY="your-api-key"
CRYPTOMUS_MERCHANT_ID="your-merchant-uuid"
CRYPTOMUS_MODE="hybrid"
```

Получить ключи: https://cryptomus.com/

#### Sumsub KYC

```bash
# .env
SUMSUB_API_TOKEN="your-api-token"
SUMSUB_APP_TOKEN="your-app-token"
SUMSUB_WEBHOOK_SECRET="your-webhook-secret"
```

Получить ключи: https://sumsub.com/

---

## 🚀 Быстрый старт

### Предварительные требования

- **Node.js** 20+
- **pnpm** 9+
- **Docker** 24+ и **Docker Compose** (для контейнерного запуска)
- **Git**

### Установка и запуск

```bash
# 1. Клонировать репозиторий
git clone https://github.com/RuslanStrogov/brom-casino.git
cd brom-casino

# 2. Установить зависимости
pnpm install

# 3. Настроить переменные окружения
cp .env.example .env
# Отредактируйте .env — заполните секреты и ключи API

# 4. Запуск в режиме разработки (все сервисы)
pnpm dev

# Или через Docker Compose:
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 5. Применить миграции базы данных
pnpm db:migrate

# 6. Заполнить начальными данными (игры, бонусы)
pnpm db:seed
```

### Деплой на VPS (одна команда)

```bash
# На чистом Ubuntu 22.04 VPS (4GB RAM, 2 vCPU):
curl -fsSL https://raw.githubusercontent.com/RuslanStrogov/brom-casino/main/infrastructure/deploy.sh | sudo bash

# С доменом и SSL:
sudo DOMAIN=yourdomain.com EMAIL=you@email.com bash infrastructure/deploy.sh
```

Скрипт автоматически установит Docker, Node.js, Nginx, настроит SSL, firewall, создаст админа.

### Доступ к сервисам

| Сервис | Порт | URL |
|--------|------|-----|
| 🎰 Web (фронтенд) | 3000 | http://localhost:3000 |
| 👑 Админ-панель | 3001 | http://localhost:3001 |
| 📱 Telegram Mini App | 3002 | http://localhost:3002 |
| 🔌 API (backend) | 4000 | http://localhost:4000 |
| 📖 Swagger документация | 4000 | http://localhost:4000/api/docs |
| 🗄 PostgreSQL | 5432 | — |
| ⚡ Redis | 6379 | — |
| 📊 ClickHouse | 8123 | — |

---

## 🎮 Игровая механика

### Provably Fair (Криптографическая честность)

Каждый результат игры можно верифицировать:

1. **До игры** — сервер публикует `server_hash = SHA256(server_seed)`
2. **Во время игры** — клиент задаёт `client_seed`, сервер использует `nonce`
3. **Результат** — `HMAC-SHA256(server_seed, client_seed + nonce)`
4. **После игры** — сервер раскрывает `server_seed` для проверки

### Поддерживаемые игры

| Игра | Описание | Особенности |
|------|----------|-------------|
| 🎰 Слоты | 3-6 барабанов, paylines, wild/scatter | Настраиваемый RTP, волатильность |
| 📈 Crash | Множитель растёт до случайного crash | House edge 1%, auto-cashout |
| 🎲 Dice | Предсказание результата броска | Over/Under, chance 1-99% |
| 🔵 Plinko | Шарик падает через ряды колышков | 3 уровня риска, множители до 50x |

---

## 💰 Платёжная система

### Поддерживаемые валюты

| Валюта | Сеть | Мин. депозит | Мин. вывод |
|--------|------|-------------|-----------|
| USDT | TRC-20 / ERC-20 | 10 USDT | 20 USDT |
| BTC | Bitcoin | 0.0001 BTC | 0.0005 BTC |
| TON | TON | 1 TON | 5 TON |
| ETH | ERC-20 | 0.001 ETH | 0.005 ETH |

### Платёжные провайдеры

- **Cryptomus** — крипто-платежи, webhooks, выплаты
- **NOWPayments** — 100+ криптовалют, автоконвертация
- **Corefy** — банковские карты, электронные кошельки

---

## 📚 Документация

| Документ | Описание |
|----------|----------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Детальная архитектура всех компонентов, схема БД, микросервисы |
| [GAME_ENGINE.md](./docs/GAME_ENGINE.md) | Игровая логика, алгоритмы RNG, механика каждой игры |
| [PAYMENTS.md](./docs/PAYMENTS.md) | Платёжная система, PSP, потоки депозита/вывода |
| [DEPLOY.md](./docs/DEPLOY.md) | Деплой, конфигурация, мониторинг, масштабирование |

---

## 🛠 Команды разработки

```bash
# Установка зависимостей
pnpm install

# Запуск всех сервисов в режиме разработки
pnpm dev

# Сборка всех пакетов
pnpm build

# Линтинг
pnpm lint

# Тестирование
pnpm test

# Типизация (TypeScript)
pnpm turbo run typecheck

# База данных
pnpm db:migrate       # Применить миграции
pnpm db:seed         # Заполнить начальными данными
pnpm db:studio       # Открыть Prisma Studio

# Docker
docker compose -f infrastructure/docker/docker-compose.yml up -d
docker compose -f infrastructure/docker/docker-compose.yml down

# Очистка
pnpm clean           # Удалить dist/, .next/, node_modules/
```

---

## 🔧 Переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```env
# База данных
DATABASE_URL="postgresql://brom:***@localhost:5432/brom_casino?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-s...hars"
JWT_REFRESH_SECRET="your-r...-key"

# Приложение
NODE_ENV="development"
API_PORT=4000
API_URL="http://localhost:4000"
WEB_URL="http://localhost:3000"

# Telegram
TELEGRAM_BOT_TOKEN="***"

# Платежи
CRYPTOMUS_API_KEY="your-c...-key"
NOWPAYMENTS_API_KEY="your-n...-key"

# KYC
SUMUB_API_TOKEN="***"

# Мониторинг
SENTRY_DSN="your-sentry-dsn"
```

---

## 📊 Статус CI/CD

Автоматические проверки при каждом push и PR:

- ✅ **Lint** — ESLint для всех пакетов
- ✅ **Typecheck** — TypeScript компиляция
- ✅ **Build** — Сборка всех приложений
- 🐳 **Docker** — Сборка Docker-образов (только на main)

---

## 🗺 Roadmap

- [x] Архитектура монорепозитория
- [x] Backend API (NestJS, 9 модулей)
- [x] Фронтенд (Next.js 14, 4 игры)
- [x] Telegram Mini App
- [x] Админ-панель
- [x] Game Engine (Provably Fair RNG)
- [x] Docker + CI/CD
- [ ] Интеграция реальных провайдеров игр (Pragmatic Play API)
- [ ] Интеграция реальных PSP (Cryptomus webhooks)
- [ ] KYC провайдер (Sumsub/Veriff)
- [ ] Мобильное приложение (React Native)
- [ ] Лицензирование (Кюрасао)
- [ ] Нагрузочное тестирование
- [ ] Деплой на продакшн-сервер

---

## 📄 Лицензия

Этот проект лицензирован под **MIT License** — см. файл [LICENSE](./LICENSE).

---

## ⚠️ Дисклеймер

Этот проект создан **исключительно в образовательных и демонстрационных целях**.
Он показывает архитектуру и технические решения для создания платформы онлайн-казино.

Перед использованием в продакшне необходимо:
- Получить игровую лицензию (Кюрасао, Мальта, и т.д.)
- Пройти сертификацию RNG (iTech Labs, GLI, eCOGRA)
- Настроить KYC/AML в соответствии с законодательством
- Получить одобрение от платёжных провайдеров
- Обеспечить соблюдение законов юрисдикции

---

## 🔗 Ссылки

- **Репозиторий:** https://github.com/RuslanStrogov/brom-casino
- **Issues:** https://github.com/RuslanStrogov/brom-casino/issues
- **Документация:** [docs/](./docs/)

---

<div align="center">

**⭐ Если проект оказался полезным — поставьте звезду!**

</div>
