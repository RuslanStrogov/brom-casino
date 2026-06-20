import { createHash, createHmac, randomBytes } from 'crypto';

/**
 * Provably Fair RNG — криптографически верифицируемый генератор случайных чисел.
 *
 * Как работает:
 * 1. Сервер генерирует server_seed (32 случайных байта)
 * 2. Сервер публикует server_hash = SHA256(server_seed)
 * 3. Клиент предоставляет client_seed
 * 4. Для каждого спина: result = HMAC-SHA256(server_seed, client_seed + nonce)
 * 5. После сессии сервер раскрывает server_seed для верификации
 */
export class ProvablyFairRNG {
  private serverSeed: string;
  private serverHash: string;
  private clientSeed: string;
  private nonce: number;

  constructor(clientSeed?: string) {
    this.serverSeed = randomBytes(32).toString('hex');
    this.serverHash = createHash('sha256').update(this.serverSeed).digest('hex');
    this.clientSeed = clientSeed || randomBytes(16).toString('hex');
    this.nonce = 0;
  }

  /** Получить публичный хеш серверного seed (показывается клиенту ДО игры) */
  getServerHash(): string {
    return this.serverHash;
  }

  /** Получить client seed */
  getClientSeed(): string {
    return this.clientSeed;
  }

  /** Установить client seed (от клиента) */
  setClientSeed(seed: string): void {
    this.clientSeed = seed;
    this.nonce = 0; // Сброс при смене seed
  }

  /** Генерировать результат спина [0, 1) */
  next(): number {
    this.nonce++;
    const message = `${this.clientSeed}:${this.nonce}`;
    const hmac = createHmac('sha256', this.serverSeed).update(message).digest('hex');
    // Берём первые 8 hex-символов (32 бита) и нормализуем к [0, 1)
    const value = parseInt(hmac.substring(0, 8), 16);
    return value / 0x100000000;
  }

  /** Генерировать целое число в диапазоне [min, max] */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Раскрыть server seed (после сессии, для верификации) */
  reveal(): { serverSeed: string; clientSeed: string; nonce: number } {
    return {
      serverSeed: this.serverSeed,
      clientSeed: this.clientSeed,
      nonce: this.nonce,
    };
  }

  /** Верифицировать результат */
  static verify(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    expectedHash: string
  ): boolean {
    // Проверяем что server_hash совпадает
    const serverHash = createHash('sha256').update(serverSeed).digest('hex');
    if (serverHash !== expectedHash) return false;

    // Восстанавливаем результат
    const message = `${clientSeed}:${nonce}`;
    const hmac = createHmac('sha256', serverSeed).update(message).digest('hex');
    const value = parseInt(hmac.substring(0, 8), 16);
    return value / 0x100000000;
  }
}

/**
 * Механика слотов
 */
export class SlotEngine {
  private rng: ProvablyFairRNG;
  private config: SlotEngineConfig;

  constructor(config: SlotEngineConfig, clientSeed?: string) {
    this.rng = new ProvablyFairRNG(clientSeed);
    this.config = config;
  }

  /** Выполнить спин */
  spin(betAmount: number): SpinEngineResult {
    const { reels, rows, symbols, paylines } = this.config;

    // 1. Генерируем позиции барабанов
    const reelPositions: number[] = [];
    for (let i = 0; i < reels; i++) {
      reelPositions.push(this.rng.nextInt(0, symbols.length * 3 - 1));
    }

    // 2. Формируем видимую сетку
    const grid: string[][] = [];
    for (let r = 0; r < reels; r++) {
      const column: string[] = [];
      for (let row = 0; row < rows; row++) {
        const pos = (reelPositions[r] + row) % symbols.length;
        column.push(symbols[pos].id);
      }
      grid.push(column);
    }

    // 3. Проверяем выигрышные линии
    const winLines: WinLineResult[] = [];
    let totalWin = 0;

    for (const payline of paylines) {
      const lineSymbols = payline.positions.map((row, reel) => grid[reel][row]);
      const result = this.evaluateLine(lineSymbols, betAmount);
      if (result) {
        winLines.push(result);
        totalWin += result.win;
      }
    }

    // 4. Проверяем scatter/bonus
    let scatterCount = 0;
    let isBonus = false;
    let freeSpinsWon = 0;

    for (const col of grid) {
      for (const sym of col) {
        const symbol = symbols.find(s => s.id === sym);
        if (symbol?.isScatter) scatterCount++;
      }
    }

    if (scatterCount >= 3) {
      isBonus = true;
      freeSpinsWon = scatterCount === 3 ? 10 : scatterCount === 4 ? 15 : 20;
    }

    return {
      grid,
      reelPositions,
      winLines,
      totalWin,
      multiplier: totalWin / betAmount,
      isBonus,
      freeSpinsWon,
      betAmount,
      hash: this.rng.getServerHash(),
      clientSeed: this.rng.getClientSeed(),
      nonce: this.rng['nonce'],
    };
  }

  /** Оценить выигрышную линию */
  private evaluateLine(lineSymbols: string[], betAmount: number): WinLineResult | null {
    const { symbols } = this.config;

    // Находим первый нетерминальный символ
    let baseSymbol: typeof symbols[0] | null = null;
    for (const symId of lineSymbols) {
      const sym = symbols.find(s => s.id === symId);
      if (sym && !sym.isScatter && !sym.isBonus) {
        baseSymbol = sym;
        break;
      }
    }

    if (!baseSymbol) return null;

    // Считаем совпадения слева направо
    let count = 0;
    for (const symId of lineSymbols) {
      const sym = symbols.find(s => s.id === symId);
      if (sym?.id === baseSymbol.id || sym?.isWild) {
        count++;
      } else {
        break;
      }
    }

    if (count < 3) return null;

    const win = baseSymbol.value * betAmount * (count - 2);
    return {
      symbol: baseSymbol.id,
      count,
      win,
      positions: lineSymbols.slice(0, count).map((_, i) => ({ reel: i, row: i })),
    };
  }

  getRng(): ProvablyFairRNG {
    return this.rng;
  }
}

export interface SlotEngineConfig {
  reels: number;
  rows: number;
  symbols: SlotSymbolConfig[];
  paylines: PaylineConfig[];
  rtp: number;
}

export interface SlotSymbolConfig {
  id: string;
  name: string;
  value: number;
  isWild: boolean;
  isScatter: boolean;
  isBonus: boolean;
}

export interface PaylineConfig {
  id: number;
  positions: number[];
}

export interface SpinEngineResult {
  grid: string[][];
  reelPositions: number[];
  winLines: WinLineResult[];
  totalWin: number;
  multiplier: number;
  isBonus: boolean;
  freeSpinsWon: number;
  betAmount: number;
  hash: string;
  clientSeed: string;
  nonce: number;
}

export interface WinLineResult {
  symbol: string;
  count: number;
  win: number;
  positions: { reel: number; row: number }[];
}

/**
 * Crash Game Engine (Aviator-style)
 */
export class CrashEngine {
  private rng: ProvablyFairRNG;

  constructor(clientSeed?: string) {
    this.rng = new ProvablyFairRNG(clientSeed);
  }

  /** Генерировать crash point */
  generateCrashPoint(): CrashResult {
    const e = this.rng.next();
    // House edge = 1%
    const crashPoint = Math.max(1, 0.99 / (1 - e));
    const rounded = Math.floor(crashPoint * 100) / 100;

    return {
      crashPoint: rounded,
      hash: this.rng.getServerHash(),
      clientSeed: this.rng.getClientSeed(),
      nonce: this.rng['nonce'],
    };
  }

  /** Проверить, выиграл ли игрок */
  checkWin(crashPoint: number, cashoutAt: number): boolean {
    return cashoutAt <= crashPoint;
  }

  /** Рассчитать выигрыш */
  calculateWin(betAmount: number, cashoutAt: number): number {
    return Math.floor(betAmount * cashoutAt * 100) / 100;
  }

  getRng(): ProvablyFairRNG {
    return this.rng;
  }
}

export interface CrashResult {
  crashPoint: number;
  hash: string;
  clientSeed: string;
  nonce: number;
}

/**
 * Dice Game Engine
 */
export class DiceEngine {
  private rng: ProvablyFairRNG;

  constructor(clientSeed?: string) {
    this.rng = new ProvablyFairRNG(clientSeed);
  }

  /** Бросить кость (0.00 - 99.99) */
  roll(): DiceResult {
    const result = Math.floor(this.rng.next() * 10000) / 100;
    return {
      result,
      hash: this.rng.getServerHash(),
      clientSeed: this.rng.getClientSeed(),
      nonce: this.rng['nonce'],
    };
  }

  /** Проверить выигрыш */
  checkWin(roll: number, prediction: number, isOver: boolean): boolean {
    return isOver ? roll > prediction : roll < prediction;
  }

  /** Рассчитать выплату */
  calculateWin(betAmount: number, chance: number): number {
    return Math.floor((99 / chance) * betAmount * 100) / 100;
  }

  getRng(): ProvablyFairRNG {
    return this.rng;
  }
}

export interface DiceResult {
  result: number;
  hash: string;
  clientSeed: string;
  nonce: number;
}

/**
 * Plinko Game Engine
 */
export class PlinkoEngine {
  private rng: ProvablyFairRNG;

  constructor(clientSeed?: string) {
    this.rng = new ProvablyFairRNG(clientSeed);
  }

  /** Бросить шарик */
  drop(rows: number, risk: 'low' | 'medium' | 'high'): PlinkoResult {
    let position = 0;
    const path: ('left' | 'right')[] = [];

    for (let i = 0; i < rows; i++) {
      const direction: 'left' | 'right' = this.rng.next() < 0.5 ? 'left' : 'right';
      path.push(direction);
      position += direction === 'right' ? 1 : -1;
    }

    // Нормализуем позицию к слоту [0, rows]
    const slot = Math.max(0, Math.min(rows, (position + rows) / 2));
    const multiplier = this.getMultiplier(slot, rows, risk);

    return {
      slot,
      path,
      multiplier,
      hash: this.rng.getServerHash(),
      clientSeed: this.rng.getClientSeed(),
      nonce: this.rng['nonce'],
    };
  }

  /** Получить множитель для слота */
  private getMultiplier(slot: number, rows: number, risk: string): number {
    // Упрощённая таблица множителей
    const multipliers: Record<string, number[]> = {
      low: [10, 5, 2, 1, 0.5, 0.2, 0.2, 0.5, 1, 2, 5, 10],
      medium: [25, 10, 5, 2, 1, 0.5, 0.5, 1, 2, 5, 10, 25],
      high: [50, 25, 10, 5, 2, 1, 1, 2, 5, 10, 25, 50],
    };
    const table = multipliers[risk] || multipliers['medium'];
    const idx = Math.floor((slot / rows) * (table.length - 1));
    return table[idx] || 1;
  }

  getRng(): ProvablyFairRNG {
    return this.rng;
  }
}

export interface PlinkoResult {
  slot: number;
  path: ('left' | 'right')[];
  multiplier: number;
  hash: string;
  clientSeed: string;
  nonce: number;
}
