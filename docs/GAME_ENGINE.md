# Игровая логика и RNG

## 1. Криптографический RNG

### Принцип работы

Используем CSPRNG (Cryptographically Secure Pseudo-Random Number Generator) на базе Node.js `crypto` модуля.

```typescript
// Генерация случайного seed
const serverSeed = crypto.randomBytes(32).toString('hex');
const serverHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
```

### Provably Fair

Каждый результат игры можно верифицировать:

1. **До игры:** сервер публикует `server_hash = SHA256(server_seed)`
2. **Во время игры:** клиент задаёт `client_seed`, сервер использует `nonce`
3. **Результат:** `HMAC-SHA256(server_seed, client_seed + nonce)`
4. **После игры:** сервер раскрывает `server_seed`, любой может проверить

## 2. Механика слотов

### Структура слота

```typescript
interface SlotConfig {
  reels: number;           // Количество барабанов (3-6)
  rows: number;            // Количество рядов (3-8)
  symbols: Symbol[];       // Набор символов
  paylines: Payline[];     // Выигрышные линии
  rtp: number;             // Return to Player (94-97%)
  volatility: 'low' | 'medium' | 'high';
}

interface Symbol {
  id: string;
  name: string;
  value: number;           // Множитель для комбинации
  isWild: boolean;
  isScatter: boolean;
  isBonus: boolean;
}

interface Payline {
  id: number;
  positions: number[];     // Позиции на каждом барабане [row_reel0, row_reel1, ...]
}
```

### Алгоритм спина

```
1. Для каждого барабана:
   - Генерируем случайную позицию через RNG
   - Определяем видимые символы (позиция, позиция+1, позиция+2)
2. Проверяем каждую payline:
   - Собираем символы по линии
   - Определяем выигрышную комбинацию (слева направо)
   - Применяем множители (wild, scatter)
3. Суммируем все выигрыши
4. Применяем бонусные механики (free spins, bonus game)
5. Возвращаем результат
```

## 3. Crash Game (Aviator-style)

### Механика

```
1. Раунд начинается с множителя 1.00x
2. Множитель растёт экспоненциально
3. В случайный момент раунд "crash" (сбой)
4. Игроки, успевшие забрать до crash, получают выигрыш
5. Crash point определяется через provably fair RNG
```

### Формула crash point

```
crash_point = 0.99 / (1 - random_0_1)
где random_0_1 — равномерное распределение [0, 1)
House edge = 1%
```

## 4. Dice

```
result = floor(RNG() * 10000) / 100  // 0.00 - 99.99
payout = (99 / chance) * bet  // chance = 1-99%
```

## 5. Plinko

```
1. Шарик падает сверху
2. На каждом уровне отклоняется влево/вправо через RNG
3. Конечная позиция определяет множитель
4. Количество уровней: 8-16
5. Количество слотов на нижнем уровне = rows + 1
```
