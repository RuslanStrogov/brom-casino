# Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose
- 4GB RAM minimum (8GB recommended)
- 20GB disk space
- Domain name (optional for production)

## Quick Start (Development)

```bash
# 1. Clone repository
git clone https://github.com/RuslanStrogov/brom-casino.git
cd brom-casino

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your values

# 3. Start all services
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 4. Run database migrations
docker compose exec api pnpm prisma migrate dev

# 5. Seed initial data
docker compose exec api pnpm prisma db seed
```

## Services

| Service | Port | URL |
|---------|------|-----|
| Web (Next.js) | 3000 | http://localhost:3000 |
| Admin Panel | 3001 | http://localhost:3001 |
| API (NestJS) | 4000 | http://localhost:4000 |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| ClickHouse | 8123 | - |
| Nginx | 80/443 | http://localhost |

## Production Deployment

### Server Requirements

- VPS with 4 vCPU, 8GB RAM, 40GB SSD
- Ubuntu 22.04 LTS
- Docker + Docker Compose
- Domain with DNS pointing to server

### Steps

```bash
# 1. On server
git clone https://github.com/RuslanStrogov/brom-casino.git
cd brom-casino

# 2. Configure environment
cp .env.example .env
nano .env
# Set: JWT_SECRET, DATABASE_URL, REDIS_URL, PSP keys

# 3. Update nginx config with your domain
nano infrastructure/nginx/conf.d/default.conf
# Replace server_name with your domain

# 4. Start
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 5. Migrate database
docker compose exec api pnpm prisma migrate deploy

# 6. Setup SSL (optional, via Certbot)
sudo certbot --nginx -d yourdomain.com
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token secret | ✅ |
| `CRYPTOMUS_API_KEY` | Cryptomus API key | For crypto |
| `NOWPAYMENTS_API_KEY` | NOWPayments API key | For crypto |
| `TELEGRAM_BOT_TOKEN` | Bot token | For Telegram |
| `SENTRY_DSN` | Sentry DSN | Optional |
| `CLICKHOUSE_PASSWORD` | ClickHouse password | Optional |

## Monitoring

```bash
# View logs
docker compose logs -f api
docker compose logs -f web

# Check service health
docker compose ps

# Database backup
docker compose exec postgres pg_dump brom_casino > backup.sql
```

## Scaling

- API: Horizontal scaling via Docker replicas
- Database: Read replicas for heavy queries
- Redis: Sentinel for HA
- CDN: CloudFlare for static assets
