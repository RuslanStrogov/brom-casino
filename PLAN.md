# BROM BET — План работ (по приоритетам)

**Дата:** 2026-07-22  
**Репозиторий:** `/mnt/data/projects/brom-casino`  
**Домен:** https://brombet.ru/  
**Конкурент:** https://selector500.gg/

---

## 🔴 P0 — СРОЧНО (диск + критические баги)

### [ ] 0.1 Освободить место на диске
- `/dev/nvme0n1p2` 116G — 95% занято
- **Причины:** `/var/lib/containerd` (32G — Docker overlay), `/var/www` (9.4G — старые сайты), `/swapfile` (8G), `/snap` (8G), `/root/.npm` (700M), `/root/.cache` (570M)
- **Действия:**
  - `docker image prune -a` — удалить неиспользуемые образы
  - `docker system prune --volumes` — очистить контейнеры/сети/volumes
  - Очистить `/root/.npm` `/root/.cache`
  - Удалить старые сайты из `/var/www` (nwicode, saas, autodopserp, br-design)
  - Удалить `/var/snap/docker` (2.1G — дубликат)
  - Уменьшить swap при необходимости

### [ ] 0.2 PWA + манифест + иконки
- Добавить `manifest.json` (name, icons, theme_color, start_url)
- Добавить service worker для кэширования
- Иконки всех размеров (192x192, 512x512)
- `<meta name="theme-color">` в корневой layout

### [ ] 0.3 Favicon
- Сгенерировать favicon.ico + favicon.svg + apple-touch-icon
- Положить в `/public`

### [ ] 0.4 Чат поддержки
- Intercom или Tidio widget
- Кнопка в углу страницы

---

## 🟠 P1 — Игры и навигация

### [ ] 1.1 Категории игр
- Слайдеры/табы: Slots, Blackjack, Roulette, Table Games, Jackpot Slots, Live Dealers, Mega Ways
- Фильтр по провайдерам
- Поиск с автокомплитом

### [ ] 1.2 Избранное / Недавние
- Кнопка сердечко на карточке игры
- Хранение в localStorage / API
- Отдельный раздел "Избранное" и "Недавние"

### [ ] 1.3 Исправить temple-of-akhet page-in-page
- GenericProvider возвращает URL на HTML5-симулятор → встраивается в iframe
- Нужно: либо открывать в новом окне, либо убирать повторный iframe

### [ ] 1.4 Платежный модуль (фронт)
- Страница кошелька `/wallet`
- Страница депозита `/wallet/deposit`
- Страница вывода `/wallet/withdraw`
- Методы: BTC, ETH, USDT (TRC20/ERC20), ADV Cash, Visa/MC
- Подключить к Cryptomus API

### [ ] 1.5 Обновить Header
- Ссылка на кошелёк
- Аватар пользователя (если авторизован)
- Кнопка "Войти" (если нет)

---

## 🟡 P2 — Фичи конкурента

### [ ] 2.1 VIP-система
- 10+ уровней (Base → Diamond → Opal → Obsidian → Plutonium)
- Прогресс-бар VIP
- Бонусы за уровень

### [ ] 2.2 Турниры
- Гонки с призовым фондом
- Лидерборды
- Прогресс в реальном времени

### [ ] 2.3 Авторизация по телефону + Telegram
- PhoneInput с выбором страны
- Telegram auth (`auth/tg`)
- Подтверждение email

### [ ] 2.4 Push-уведомления
- Через PWA (Service Worker)
- Telegram-уведомления

### [ ] 2.5 Мобильный UI
- Bottom sheets (Vaul drawer)
- Touch-friendly навигация
- Адаптация всех страниц под мобильные

---

## 🟢 P3 — Нишевые фишки

### [ ] 3.1 Ачивки и награды
- Список достижений
- Сундуки с наградами
- Внутренняя валюта (coins)

### [ ] 3.2 Спорт + Киберспорт
- Раздел ставок на спорт
- Esports: CS:GO, Dota 2
- Sweepstakes

### [ ] 3.3 Партнёрская программа
- Реферальные ссылки
- Статистика переходов
- Выплаты партнёрам

### [ ] 3.4 Мультиязычность (i18n)
- EN, RU, ES, PT, DE, FR, TR, AR, JA, ZH, HI, ID, TH, VI, PL, NL, IT, UK, RO, CS, EL, HU, SV, DA, FI, NO, SK, BG, HR, LT, LV, ET, SL, SR, SQ, MK, MN, HY, AZ, FA, UR, MS, TL, KM, MY, SW, AM, BN, NE, SI, TA, TE, KN, ML, GU, PA, OR, AS, KS, SD, DO, BO, EU, GL, KA, IS, LB, GA, LO, MI, MI, PS, PT, SM, SO, ST, SU, TG, TI, TK, TT, UG, VI, XH, YO, ZU, HT, JW, NY, RN, SG, YO, ZU

### [ ] 3.5 SEO и мета-теги
- Open Graph для всех страниц
- Structured data (JSON-LD)
- Sitemap.xml
- robots.txt

### [ ] 3.6 Комплаенс
- KYC (верификация email/телефона)
- Self-exclusion (самоблокировка)
- Responsible gambling страница
- Privacy Policy / Terms of Service

---

## 📋 Git-стратегия
- Каждая страница/фича → отдельный коммит
- Префиксы коммитов: `feat:`, `fix:`, `style:`, `chore:`
- Пуш только в `main`

---

## 🎯 Текущий статус (2026-07-22)
- [x] SSL ✅ (Let's Encrypt, до 2026-10-19)
- [x] Сайт 200 OK: https://brombet.ru/
- [x] API 200 OK: https://brombet.ru/api/games (45 игр)
- [x] Логотип заменён на PNG
- [x] PWA + manifest.json + service worker + иконки
- [x] Favicon (16x16, 32x32, apple-touch-icon)
- [x] Категории игр (Slots/Table/Live/Crash) + поиск
- [x] Страница кошелька `/wallet` (депозит, вывод, история) — задеплоено
- [x] Header — ссылка на Wallet, BalanceWidget кликабельный — задеплоено
- [x] Исправлен temple-of-akhet page-in-page (detect iframe) — задеплоено
- [x] Yandex.Metrika установлена (ID: 110928475)
- [x] `/slots` → редирект на `/#games`
- [x] Docker контейнеры работают (postgres, api, admin, web, nginx, redis, clickhouse)
- [x] Анализ конкурента selector500.gg — завершён