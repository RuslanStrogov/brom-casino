#!/bin/bash
# ============================================
# Brom Casino — One-click VPS Deploy Script
# Tested on: Ubuntu 22.04 LTS, 4GB RAM, 2 vCPU
# Usage: sudo DOMAIN=yourdomain.com EMAIL=you@email.com bash deploy.sh
# ============================================

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

if [ "$EUID" -ne 0 ]; then err "Run as root: sudo bash deploy.sh"; fi

DOMAIN=${DOMAIN:-""}; EMAIL=${EMAIL:-""}
APP_DIR="/opt/brom-casino"
GIT_REPO="https://github.com/RuslanStrogov/brom-casino.git"

info "Brom Casino Deployer"
info "===================="

# 1. System
log "Updating system..."
apt-get update -qq && apt-get upgrade -y -qq

# 2. Dependencies
log "Installing dependencies..."
apt-get install -y -qq curl wget git build-essential nginx certbot python3-certbot-nginx ufw fail2ban htop

# 3. Docker
if ! command -v docker &>/dev/null; then
  log "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  log "Docker already installed"
fi

if ! command -v docker-compose &>/dev/null; then
  log "Installing Docker Compose..."
  VER=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)
  curl -L "https://github.com/docker/compose/releases/download/${VER}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
else
  log "Docker Compose already installed"
fi

# 4. Node.js 20
if ! command -v node &>/dev/null; then
  log "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
command -v pnpm &>/dev/null || npm install -g pnpm

# 5. Clone
log "Cloning repository..."
[ -d "$APP_DIR" ] && { cd $APP_DIR && git pull; } || git clone $GIT_REPO $APP_DIR
cd $APP_DIR

# 6. Secrets
log "Generating secrets..."
gen() { openssl rand -hex $1; }
JWT_SECRET=$(gen 32); JWT_REFRESH_SECRET=$(gen 32)
POSTGRES_PASSWORD=$(gen 16); REDIS_PASSWORD=$(gen 16)
CLICKHOUSE_PASSWORD=$(gen 16)
POSTGRES_USER="brom"; POSTGRES_DB="brom_casino"

# 7. .env
log "Creating .env..."
cat > .env << ENVEOF
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES...n
REDIS_PASSWORD=$REDIS...n
JWT_SECRET=$JWT_S...n
JWT_REFRESH_SECRET=$JWT_REFRESH...n
NODE_ENV=production
API_PORT=4000
API_URL=http://localhost:4000
WS_URL=ws://localhost:4000
WEB_URL=http://localhost:3000
CLICKHOUSE_DB=brom_analytics
CLICKHOUSE_USER=brom
CLICKHOUSE_PASSWORD=$CLICKHOUSE...n
TELEGRAM_BOT_TOKEN=
CRYPTOMUS_API_KEY=
NOWPAYMENTS_API_KEY=
SUMUB_API_TOKEN=
SENTRY_DSN=
ENVEOF

# 8. Build & Start
log "Building and starting services..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
docker compose -f infrastructure/docker/docker-compose.yml up -d --build

# 9. Wait
log "Waiting for services..."
sleep 15

# 10. Migrations
log "Running migrations..."
docker compose -f infrastructure/docker/docker-compose.yml exec -T api npx prisma migrate deploy 2>/dev/null || \
  docker compose -f infrastructure/docker/docker-compose.yml exec -T api npx prisma db push 2>/dev/null || \
  warn "Migrations failed — run manually"

# 11. Seed
log "Seeding database..."
docker compose -f infrastructure/docker/docker-compose.yml exec -T api npx prisma db seed 2>/dev/null || \
  warn "Seed failed — run manually"

# 12. Nginx
if [ -n "$DOMAIN" ]; then
  log "Configuring Nginx for $DOMAIN..."
  cat > /etc/nginx/sites-available/brom-casino << NGEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    location /api/ { proxy_pass http://localhost:4000/; proxy_http_version 1.1; proxy_set_header Upgrade \$http_upgrade; proxy_set_header Connection "upgrade"; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; }
    location / { proxy_pass http://localhost:3000; proxy_http_version 1.1; proxy_set_header Upgrade \$http_upgrade; proxy_set_header Connection "upgrade"; proxy_set_header Host \$host; }
}
server {
    listen 80;
    server_name admin.$DOMAIN;
    location / { proxy_pass http://localhost:3001; proxy_http_version 1.1; proxy_set_header Upgrade \$http_upgrade; proxy_set_header Connection "upgrade"; proxy_set_header Host \$host; }
}
NGEOF
  ln -sf /etc/nginx/sites-available/brom-casino /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx

  if [ -n "$EMAIL" ]; then
    log "Obtaining SSL certificate..."
    certbot --nginx -d $DOMAIN -d www.$DOMAIN -d admin.$DOMAIN --non-interactive --agree-tos --email $EMAIL || warn "SSL failed"
  fi
else
  warn "No DOMAIN set — configure Nginx manually"
fi

# 13. Firewall
log "Configuring firewall..."
ufw default deny incoming; ufw default allow outgoing
ufw allow 22/tcp; ufw allow 80/tcp; ufw allow 443/tcp
ufw --force enable

# 14. Auto-update cron
log "Setting up auto-updates..."
cat > /etc/cron.weekly/brom-update << 'CRON'
#!/bin/bash
cd /opt/brom-casino
git pull origin main
docker compose -f infrastructure/docker/docker-compose.yml up -d --build
docker system prune -f
CRON
chmod +x /etc/cron.weekly/brom-update

# Done
echo ""
echo "============================================"
echo -e "${GREEN}  🎰 Brom Casino deployed!${NC}"
echo "============================================"
echo "  Web:     http://localhost:3000"
echo "  Admin:   http://localhost:3001"
echo "  API:     http://localhost:4000"
[ -n "$DOMAIN" ] && echo "  Domain:  https://$DOMAIN"
echo "  Admin:   admin@brom.casino / Admin123!"
echo ""
echo "  Commands:"
echo "    cd $APP_DIR"
echo "    docker compose -f infrastructure/docker/docker-compose.yml logs -f"
echo "    docker compose -f infrastructure/docker/docker-compose.yml ps"
echo ""
warn "Next steps:"
warn "  1. Set TELEGRAM_BOT_TOKEN, CRYPTOMUS_API_KEY in .env"
warn "  2. Restart: docker compose -f infrastructure/docker/docker-compose.yml restart api"
warn "  3. Change admin password after first login"
