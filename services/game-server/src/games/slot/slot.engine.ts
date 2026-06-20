import { Injectable, Logger } from '@nestjs/common';
import { ProvablyFair } from '../rng/provably-fair';
import { RngService } from '../rng/rng.service';

export interface SlotSymbol {
  id: string;
  name: string;
  value: number;
  isWild: boolean;
  isScatter: boolean;
  isBonus: boolean;
}

export interface Payline {
  id: number;
  positions: number[];
}

export interface SlotConfig {
  reels: number;
  rows: number;
  symbols: SlotSymbol[];
  paylines: Payline[];
  rtp: number;
}

export interface WinLineResult {
  paylineId: number;
  symbol: string;
  count: number;
  win: number;
  positions: { reel: number; row: number }[];
}

export interface SlotSpinResult {
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

// Default slot configuration
const DEFAULT_SYMBOLS: SlotSymbol[] = [
  { id: 'WILD', name: 'Wild', value: 0, isWild: true, isScatter: false, isBonus: false },
  { id: 'SCATTER', name: 'Scatter', value: 0, isWild: false, isScatter: true, isBonus: false },
  { id: 'BONUS', name: 'Bonus', value: 0, isWild: false, isScatter: false, isBonus: true },
  { id: 'DIAMOND', name: 'Diamond', value: 50, isWild: false, isScatter: false, isBonus: false },
  { id: 'SEVEN', name: 'Seven', value: 30, isWild: false, isScatter: false, isBonus: false },
  { id: 'BAR', name: 'Bar', value: 20, isWild: false, isScatter: false, isBonus: false },
  { id: 'BELL', name: 'Bell', value: 15, isWild: false, isScatter: false, isBonus: false },
  { id: 'CHERRY', name: 'Cherry', value: 10, isWild: false, isScatter: false, isBonus: false },
  { id: 'LEMON', name: 'Lemon', value: 8, isWild: false, isScatter: false, isBonus: false },
  { id: 'ORANGE', name: 'Orange', value: 5, isWild: false, isScatter: false, isBonus: false },
];

const DEFAULT_PAYLINES: Payline[] = [
  { id: 1, positions: [1, 1, 1, 1, 1] }, // Middle row
  { id: 2, positions: [0, 0, 0, 0, 0] }, // Top row
  { id: 3, positions: [2, 2, 2, 2, 2] }, // Bottom row
  { id: 4, positions: [0, 1, 2, 1, 0] }, // V shape
  { id: 5, positions: [2, 1, 0, 1, 2] }, // Inverted V
  { id: 6, positions: [0, 0, 1, 2, 2] }, // Diagonal down
  { id: 7, positions: [2, 2, 1, 0, 0] }, // Diagonal up
  { id: 8, positions: [1, 0, 0, 0, 1] }, // U shape top
  { id: 9, positions: [1, 2, 2, 2, 1] }, // U shape bottom
];

const DEFAULT_CONFIG: SlotConfig = {
  reels: 5,
  rows: 3,
  symbols: DEFAULT_SYMBOLS,
  paylines: DEFAULT_PAYLINES,
  rtp: 0.96,
};

@Injectable()
export class SlotEngine {
  private readonly logger = new Logger(SlotEngine.name);
  private readonly rngService: RngService;
  private readonly sessions: Map<string, ProvablyFair> = new Map();

  constructor() {
    this.rngService = new RngService();
  }

  /** Initialize a session with a client seed */
  createSession(sessionId: string, clientSeed?: string): { serverHash: string; clientSeed: string } {
    const pf = new ProvablyFair(this.rngService, clientSeed);
    this.sessions.set(sessionId, pf);
    return {
      serverHash: pf.getServerHash(),
      clientSeed: pf.getClientSeed(),
    };
  }

  /** Set client seed for an existing session */
  setClientSeed(sessionId: string, clientSeed: string): void {
    const pf = this.sessions.get(sessionId);
    if (pf) {
      pf.setClientSeed(clientSeed);
    }
  }

  /** Perform a spin */
  spin(
    sessionId: string,
    betAmount: number,
    config: SlotConfig = DEFAULT_CONFIG,
  ): SlotSpinResult {
    const pf = this.sessions.get(sessionId);
    if (!pf) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { reels, rows, symbols, paylines } = config;

    // Generate reel positions
    const reelPositions: number[] = [];
    for (let i = 0; i < reels; i++) {
      reelPositions.push(pf.nextInt(0, symbols.length * 3 - 1));
    }

    // Build visible grid
    const grid: string[][] = [];
    for (let r = 0; r < reels; r++) {
      const column: string[] = [];
      for (let row = 0; row < rows; row++) {
        const pos = (reelPositions[r] + row) % symbols.length;
        column.push(symbols[pos].id);
      }
      grid.push(column);
    }

    // Evaluate paylines
    const winLines: WinLineResult[] = [];
    let totalWin = 0;

    for (const payline of paylines) {
      const lineSymbols = payline.positions.map((row, reel) => grid[reel][row]);
      const result = this.evaluateLine(lineSymbols, payline.id, betAmount, symbols);
      if (result) {
        winLines.push(result);
        totalWin += result.win;
      }
    }

    // Check scatter / bonus
    let scatterCount = 0;
    for (const col of grid) {
      for (const sym of col) {
        const symbol = symbols.find(s => s.id === sym);
        if (symbol?.isScatter) scatterCount++;
      }
    }

    const isBonus = scatterCount >= 3;
    let freeSpinsWon = 0;
    if (isBonus) {
      freeSpinsWon = scatterCount === 3 ? 10 : scatterCount === 4 ? 15 : 20;
    }

    const multiplier = betAmount > 0 ? totalWin / betAmount : 0;

    return {
      grid,
      reelPositions,
      winLines,
      totalWin,
      multiplier,
      isBonus,
      freeSpinsWon,
      betAmount,
      hash: pf.getServerHash(),
      clientSeed: pf.getClientSeed(),
      nonce: pf.getNonce(),
    };
  }

  /** Evaluate a single payline */
  private evaluateLine(
    lineSymbols: string[],
    paylineId: number,
    betAmount: number,
    symbols: SlotSymbol[],
  ): WinLineResult | null {
    // Find first non-special symbol
    let baseSymbol: SlotSymbol | null = null;
    for (const symId of lineSymbols) {
      const sym = symbols.find(s => s.id === symId);
      if (sym && !sym.isScatter && !sym.isBonus) {
        baseSymbol = sym;
        break;
      }
    }

    if (!baseSymbol) return null;

    // Count consecutive matches from left
    let count = 0;
    for (const symId of lineSymbols) {
      const sym = symbols.find(s => s.id === symId);
      if (sym && (sym.id === baseSymbol.id || sym.isWild)) {
        count++;
      } else {
        break;
      }
    }

    if (count < 3) return null;

    const win = baseSymbol.value * betAmount * (count - 2);
    const positions: { reel: number; row: number }[] = [];
    for (let i = 0; i < count; i++) {
      positions.push({ reel: i, row: i });
    }

    return {
      paylineId,
      symbol: baseSymbol.id,
      count,
      win,
      positions,
    };
  }

  /** Get the provably fair instance for a session */
  getProvablyFair(sessionId: string): ProvablyFair | undefined {
    return this.sessions.get(sessionId);
  }

  /** Remove a session */
  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
