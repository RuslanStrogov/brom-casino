upstream brom-casino-web {
    server 127.0.0.1:3003;
}

upstream brom-casino-admin {
    server 127.0.0.1:3001;
}

upstream brom-casino-api {
    server 127.0.0.1:4000;
}

server {
    listen 80;
    server_name casino.strogov.com cas.br-design.ru;

    # Certbot ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name casino.strogov.com cas.br-design.ru;

    ssl_certificate /etc/letsencrypt/live/casino.strogov.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/casino.strogov.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/casino.strogov.com/chain.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";

    # Logs
    access_log /var/log/nginx/casino.strogov.com.access.log;
    error_log /var/log/nginx/casino.strogov.com.error.log;

    # Root location — main web app
    location / {
        proxy_pass http://brom-casino-web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header Accept-Encoding "";
        proxy_buffering off;
    }

    # Admin panel — HTML (no cache)
    location /admin {
        proxy_pass http://brom-casino-admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;

        # Don't cache HTML — always get fresh chunk references
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            proxy_pass http://brom-casino-admin;
        }
    }

    # Admin static assets (Next.js hashed chunks — safe to cache)
    location /admin/_next/static {
        proxy_pass http://brom-casino-admin;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        expires 365d;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # API
    location /api {
        proxy_pass http://brom-casino-api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # WebSocket support for games
    location /socket.io/ {
        proxy_pass http://brom-casino-api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
