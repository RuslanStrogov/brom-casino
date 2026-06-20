import { Injectable, Logger } from '@nestjs/common';
import { ProvablyFair } from '../rng/provably-fair';
import { RngService } from '../rng/rng.service';

export type PlinkoRisk = 'low' | 'medium' | 'high';

export interface PlinkoResult {
  slot: number;
  path: ('left' | 'right')[];
  multiplier: number;
  betAmount: number;
  winAmount: number;
  hash: string;
  clientSeed: string;
  nonce: number;
}

// Multiplier tables for different risk levels and row counts
const MULTIPLIER_TABLES: Record<number, Record<PlinkoRisk, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 5, 2, 0.5, 0.2, 0.5, 2, 5, 29],
  },
  12: {
    low: [10, 5, 2, 1, 0.5, 0.2, 0.2, 0.5, 1, 2, 5, 10, 25],
    medium: [25, 10, 5, 2, 1, 0.5, 0.5, 1, 2, 5, 10, 25, 50],
    high: [50, 25, 10, 5, 2, 1, 1, 2, 5, 10, 25, 50, 100],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [55, 10, 5, 3, 1.4, 1.2, 1.1, 1, 0.6, 1, 1.1, 1.2, 1.4, 3, 5, 10, 55],
    high: [110, 40, 15, 5, 3, 1.4, 1, 0.4, 0.2, 0.4, 1, 1.4, 3, 5, 15, 40, 110],
  },
};

@Injectable()
export class PlinkoEngine {
  private readonly logger = new Logger(PlinkoEngine.name);
  private readonly rngService: RngService;
  private readonly sessions: Map<string, ProvablyFair> = new Map();

  constructor() {
    this.rngService = new RngService();
  }

  /** Initialize a session */
  createSession(sessionId: string, clientSeed?: string): { serverHash: string; clientSeed: string } {
    const pf = new ProvablyFair(this.rngService, clientSeed);
    this.sessions.set(sessionId, pf);
    return {
      serverHash: pf.getServerHash(),
      clientSeed: pf.getClientSeed(),
    };
  }

  /** Set client seed */
  setClientSeed(sessionId: string, clientSeed: string): void {
    const pf = this.sessions.get(sessionId);
    if (pf) {
      pf.setClientSeed(clientSeed);
    }
  }

  /** Drop a ball */
  drop(
    sessionId: string,
    betAmount: number,
    rows: number = 8,
    risk: PlinkoRisk = 'medium',
  ): PlinkoResult {
    const pf = this.sessions.get(sessionId);
    if (!pf) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Clamp rows to available configurations
    const availableRows = Object.keys(MULTIPLIER_TABLES).map(Number);
    const clampedRows = availableRows.reduce((prev, curr) =>
      Math.abs(curr - rows) < Math.abs(prev - rows) ? curr : prev,
    );

    // Simulate the ball path
    let position = 0;
    const path: ('left' | 'right')[] = [];

    for (let i = 0; i < clampedRows; i++) {
      const direction: 'left' | 'right' = pf.next() < 0.5 ? 'left' : 'right';
      path.push(direction);
      position += direction === 'right' ? 1 : -1;
    }

    // Normalize position to slot index [0, clampedRows]
    const slot = Math.max(0, Math.min(clampedRows, Math.round((position + clampedRows) / 2)));

    // Get multiplier
    const multiplier = this.getMultiplier(slot, clampedRows, risk);
    const winAmount = Math.floor(betAmount * multiplier * 100) / 100;

    return {
      slot,
      path,
      multiplier,
      betAmount,
      winAmount,
      hash: pf.getServerHash(),
      clientSeed: pf.getClientSeed(),
      nonce: pf.getNonce(),
    };
  }

  /** Get multiplier for a slot */
  private getMultiplier(slot: number, rows: number, risk: PlinkoRisk): number {
    const table = MULTIPLIER_TABLES[rows]?.[risk] || MULTIPLIER_TABLES[8]['medium'];
    const idx = Math.max(0, Math.min(table.length - 1, slot));
    return table[idx] || 1;
  }

  /** Get available row counts */
  getAvailableRowCounts(): number[] {
    return Object.keys(MULTIPLIER_TABLES).map(Number);
  }

  /** Get multiplier table for display */
  getMultiplierTable(rows: number, risk: PlinkoRisk): number[] {
    return MULTIPLIER_TABLES[rows]?.[risk] || MULTIPLIER_TABLES[8]['medium'];
  }

  /** Get provably fair instance */
  getProvablyFair(sessionId: string): ProvablyFair | undefined {
    return this.sessions.get(sessionId);
  }

  /** Remove session */
  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
