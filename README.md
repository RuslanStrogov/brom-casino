# 🎰 Brom Casino

Полнофункциональный клон онлайн-казино — веб-приложение, Telegram Mini App и мобильное приложение.

## Архитектура

```
brom-casino/
├── apps/
│   ├── web/                  # Next.js 14 — основной фронтенд
│   ├── admin/                # Next.js 14 — админ-панель
│   └── telegram-mini-app/    # React — Telegram Mini App
├── packages/
│   ├── shared/               # Общие типы, утилиты, константы
│   ├── ui/                   # Общие UI-компоненты (shadcn/ui)
│   ├── game-engine/          # Игровая логика (RNG, спины, выплаты)
│   └── config/               # Общие конфигурации (ESLint, TS, Tailwind)
├── services/
│   ├── api/                  # NestJS — основной backend
│   ├── game-server/          # Node.js — игровая логика (WebSocket)
│   └── payment-worker/       # Node.js — обработка платежей (Bull queue)
├── infrastructure/
│   ├── docker/               # Docker Compose, Dockerfile'ы
│   └── nginx/                # Конфигурации nginx
├── docs/                     # Документация
├── package.json              # Root package.json (Turborepo)
├── turbo.json                # Turborepo config
└── pnpm-workspace.yaml       # pnpm workspace
```

## Технологии

| Слой | Технология |
|------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| **Telegram** | React + Telegram Web App SDK |
| **Backend** | NestJS, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16, Redis 7, ClickHouse |
| **Queue** | Bull (Redis) |
| **Real-time** | Socket.io |
| **DevOps** | Docker, GitHub Actions, Nginx |
| **Monitoring** | Sentry, Grafana |

## Быстрый старт

```bash
# Установка зависимостей
pnpm install

# Запуск в режиме разработки
pnpm dev

# Запуск через Docker
docker compose up -d
```

## Структура документации

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — детальная архитектура
- [GAME_ENGINE.md](./docs/GAME_ENGINE.md) — игровая логика и RNG
- [API.md](./docs/API.md) — спецификация API
- [PAYMENTS.md](./docs/PAYMENTS.md) — платёжная система
- [DEPLOY.md](./docs/DEPLOY.md) — деплой и инфраструктура
