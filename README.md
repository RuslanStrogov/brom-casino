# 🎰 BROM BET — Premium Crypto Casino

<div align="center">

![BROM BET Logo](public/logo-brom-bet.png)

> **Live:** [https://brombet.ru/](https://brombet.ru/)  
> Полнофункциональная платформа онлайн-казино с собственными играми, интеграцией Pragmatic Play, крипто-кошельком и PWA.

</div>

---

## 📋 О проекте

**BROM BET** — это production-ready платформа онлайн-казино, развёрнутая на VPS и доступная по адресу [brombet.ru](https://brombet.ru/). 

Проект включает:
- 🎮 **Собственные игры** — 6 in-house игр: Slots, Crash, Dice, Plinko, Roulette, Blackjack + Temple of Akhet
- 🎰 **Pragmatic Play** — 45+ игр от провайдера через API
- 💰 **Крипто-кошелёк** — депозит, вывод, история транзакций
- ❤️ **Избранное и недавние игры** — персонализация
- 📱 **PWA** — установка на домашний экран
- 🔐 **JWT-авторизация** — регистрация и вход
- 📊 **Yandex Metrika** — аналитика
- 🐳 **Docker Compose** — PostgreSQL, Redis, ClickHouse, API, Web, Nginx

---

## 🚀 Функционал (Live)

### ✅ Задеплоено и работает

| Функция | Статус | Описание |
|---------|--------|----------|
| **Собственные игры** | ✅ | Slots, Crash, Dice, Plinko, Roulette, Blackjack |
| **Pragmatic Play** | ✅ | 45+ игр через API-провайдера |
| **Temple of Akhet** | ✅ | Custom игра (без page-in-page) |
| **Категории игр** | ✅ | CRASH, LIVE, SLOTS, TABLE + поиск |
| **Кошелёк** | ✅ | Баланс, депозит, вывод, история транзакций |
| **Избранное** | ✅ | ❤️ на карточках игр, страница /favorites |
| **Недавние игры** | ✅ | Авто-трекинг, страница /favorites |
| **PWA** | ✅ | Установка на домашний экран |
| **Favicon** | ✅ | Иконки для всех платформ |
| **JWT-авторизация** | ✅ | Регистрация / вход / logout |
| **Header с балансом** | ✅ | Кликабельный баланс, ссылка Wallet |
| **Yandex Metrika** | ✅ | ID 110928475 |
| **Chat Widget** | ✅ | Чат поддержки |
| **Provably Fair** | ✅ | Криптографическая честность |
| **Neon Miami тема** | ✅ | Тёмная тема с неоновыми акцентами |
| **i18n** | ✅ | Русский язык работает |
| **SSL** | ✅ | Let's Encrypt, все домены |
| **Docker** | ✅ | 5 контейнеров (postgres, redis, clickhouse, api, web) |

### 📱 PWA

Сайт можно установить на домашний экран:
- **Android:** Chrome → ⋮ → Add to Home Screen
- **iOS:** Safari → Share → Add to Home Screen
- **Desktop:** Chrome → ⋮ → Cast, save, and share → Install page as app

---

## 🏗 Архитектура

### Стек технологий

| Слой | Технология |
|------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand |
| **Backend** | NestJS, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16, Redis 7 |
| **Analytics** | ClickHouse |
| **Auth** | JWT (access + refresh tokens) |
| **Real-time** | Socket.io |
| **DevOps** | Docker Compose, Nginx, Let's Encrypt SSL |

### Инфраструктура

```
Client (browser/PWA)
    │
    ▼
Nginx Reverse Proxy (SSL termination)
    │
    ├── https://brombet.ru/      → casino-web (Next.js, port 3003)
    ├── https://brombet.ru/api   → casino-api (NestJS, port 4000)
    └── https://brombet.ru/admin → casino-admin (Next.js, port 3001)
            │
            ├── PostgreSQL (casino-postgres, port 5433)
            ├── Redis (casino-redis, port 6380)
            └── ClickHouse (casino-clickhouse, port 8124)
```

### Структура проекта

```
brom-casino/
├── apps/
│   ├── web/                   # Next.js 14 — основной фронтенд
│   └── admin/                 # Next.js 14 — панель администратора
├── services/
│   └── api/                   # NestJS — основной backend (REST + WebSocket)
├── infrastructure/
│   ├── docker/                # Docker Compose, Dockerfile'ы
│   │   ├── docker-compose.yml
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   └── Dockerfile.admin
│   └── nginx/                 # Конфигурации nginx
├── public/                    # Статика (favicon, manifest, SW, logo)
├── stores/                    # Zustand stores (auth, favorites, recent)
├── components/                # React компоненты
└── lib/                       # Утилиты, API клиент
```

---

## 🎮 Игры

### Собственные игры (In-house)

| Игра | Компонент | Описание | RTP |
|------|-----------|----------|-----|
| 🎰 **Slots** | SlotGame | Классический слот с 3 барабанами | 96% |
| 🚀 **Crash** | CrashGame | Множитель растёт до краха | 97% |
| 🎲 **Dice** | DiceGame | Угадай бросок кубика | 98% |
| 🎯 **Plinko** | PlinkoGame | Шарик падает по колышкам | 96% |
| 🎡 **Roulette** | RouletteGame | Европейская рулетка | 97.3% |
| 🃏 **Blackjack** | BlackjackGame | Обыграй дилера | 99% |

### Игры провайдеров

| Провайдер | Кол-во игр | Типы |
|-----------|-----------|------|
| **Pragmatic Play** | 45+ | Слоты, Live, Crash, Table Games |

### Custom игры

- **Temple of Akhet** — уникальная игра с собственной механикой

### Фильтры и поиск

- Категории: CRASH, LIVE, SLOTS, TABLE
- Поиск по названию игры
- ❤️ Избранное (персональный список)
- 🕐 Недавние (авто-трекинг)

---

## 💰 Крипто-кошелёк

**Страница:** `/wallet`

### Возможности

| Функция | Описание |
|---------|----------|
| **Баланс** | Real Balance + Bonus Balance |
| **Депозит** | Создание платежа, ссылка на оплату |
| **Вывод** | Вывод на внешний кошелёк (TRC-20, ERC-20, BEP-20) |
| **История** | Пагинированная история транзакций со статусами |

### Валюты

| Валюта | Сеть | 
|--------|------|
| USDT | TRC-20 / ERC-20 / BEP-20 |

---

## 🚀 Быстрый старт

### Предварительные требования

- **Node.js** 20+
- **pnpm** 9+
- **Docker** 24+ и **Docker Compose**
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
# Отредактируйте .env — заполните секреты

# 4. Запуск через Docker Compose
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 5. Применить миграции БД
pnpm db:migrate

# 6. Заполнить начальными данными
pnpm db:seed
```

### Доступ к сервисам

| Сервис | Порт | URL |
|--------|------|-----|
| 🎰 Web (фронтенд) | 3003 | https://brombet.ru/ |
| 👑 Админ-панель | 3001 | https://brombet.ru/admin |
| 🔌 API (backend) | 4000 | https://brombet.ru/api |
| 🗄 PostgreSQL | 5433 | localhost:5433 |
| ⚡ Redis | 6380 | localhost:6380 |
| 📊 ClickHouse | 8124 | localhost:8124 |

---

## 🔧 Команды разработки

```bash
# Установка зависимостей
pnpm install

# Разработка
pnpm dev

# Сборка
pnpm build

# Docker
docker compose -f infrastructure/docker/docker-compose.yml up -d   # Старт
docker compose -f infrastructure/docker/docker-compose.yml down    # Стоп
docker compose -f infrastructure/docker/docker-compose.yml build web  # Сборка фронта
docker compose -f infrastructure/docker/docker-compose.yml logs -f  # Логи

# База данных
pnpm db:migrate       # Применить миграции
pnpm db:seed          # Заполнить данными
pnpm db:studio        # Prisma Studio
```

---

## 📊 Мониторинг

### Yandex Metrika

На сайте установлен Yandex Metrika (ID: `110928475`):
- Вебвизор
- Карта кликов
- E-commerce аналитика
- Отслеживание ссылок
- SSR-поддержка

---

## 🐳 Деплой

### Инфраструктура

- **VPS**: Ubuntu 22.04, 4 vCPU, 16GB RAM, 120GB NVMe + 1TB HDD
- **Docker**: все сервисы в контейнерах
- **Nginx**: reverse proxy с SSL termination
- **SSL**: Let's Encrypt (Certbot), автоматическое обновление

### Docker Compose

```yaml
# Основные сервисы
- postgres:16-alpine       # База данных
- redis:7-alpine           # Кэш и очередь
- clickhouse:24-alpine     # Аналитика
- api:                     # Backend (NestJS)
- web:                     # Frontend (Next.js)
- admin:                   # Админ-панель
```

---

## 🗺 Roadmap

### ✅ Реализовано
- [x] Архитектура монорепозитория
- [x] Backend API (NestJS)
- [x] Фронтенд (Next.js 14, 6 собственных игр)
- [x] Pragmatic Play API (45+ игр)
- [x] Крипто-кошелёк (депозит/вывод/история)
- [x] PWA (установка на домашний экран)
- [x] JWT-авторизация
- [x] Избранное и недавние игры
- [x] Yandex Metrika
- [x] Docker Compose деплой
- [x] SSL (Let's Encrypt)
- [x] Neon Miami тема
- [x] i18n (русский язык)
- [x] Чат поддержки
- [x] Фильтры и поиск игр

### 🔜 В планах
- [ ] VIP-система (10+ уровней с прогресс-баром)
- [ ] Турниры с лидербордами
- [ ] Реферальная система
- [ ] Поддержка нескольких языков (i18n)
- [ ] Push-уведомления
- [ ] Дополнительные провайдеры (Evolution, Spribe, NetEnt)

---

## 🔗 Ссылки

- **Сайт:** [https://brombet.ru/](https://brombet.ru/)
- **Репозиторий:** [https://github.com/RuslanStrogov/brom-casino](https://github.com/RuslanStrogov/brom-casino)
- **Документация:** [docs/](./docs/)
- **Связанные домены:** cas.br-design.ru, casino.strogov.com

---

## ⚠️ Дисклеймер

Этот проект создан в образовательных и демонстрационных целях. Перед использованием в продакшне необходимо:
- Получить игровую лицензию
- Пройти сертификацию RNG
- Настроить KYC/AML
- Обеспечить соблюдение законов юрисдикции

---

<div align="center">

**⭐ Если проект оказался полезным — поставьте звезду!**

</div>