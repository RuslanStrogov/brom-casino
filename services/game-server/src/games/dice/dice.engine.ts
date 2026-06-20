import { Injectable, Logger } from '@nestjs/common';
import { ProvablyFair } from '../rng/provably-fair';
import { RngService } from '../rng/rng.service';

export interface DiceResult {
  result: number; // 0.00 - 99.99
  target: number;
  isOver: boolean;
  won: boolean;
  betAmount: number;
  winAmount: number;
  multiplier: number;
  chance: number;
  hash: string;
  clientSeed: string;
  nonce: number;
}

@Injectable()
export class DiceEngine {
  private readonly logger = new Logger(DiceEngine.name);
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

  /** Roll the dice */
  roll(
    sessionId: string,
    betAmount: number,
    target: number,
    isOver: boolean,
  ): DiceResult {
    const pf = this.sessions.get(sessionId);
    if (!pf) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Generate roll: 0.00 - 99.99
    const rollValue = Math.floor(pf.next() * 10000) / 100;

    // Calculate chance
    const chance = isOver ? 99.99 - target : target;

    // Check win
    const won = isOver ? rollValue > target : rollValue < target;

    // Calculate multiplier (house edge 1%)
    const multiplier = won ? Math.floor((99 / chance) * 100) / 100 : 0;

    // Calculate win amount
    const winAmount = won ? Math.floor(betAmount * multiplier * 100) / 100 : 0;

    return {
      result: rollValue,
      target,
      isOver,
      won,
      betAmount,
      winAmount,
      multiplier,
      chance,
      hash: pf.getServerHash(),
      clientSeed: pf.getClientSeed(),
      nonce: pf.getNonce(),
    };
  }

  /** Quick roll with automatic target from chance */
  rollWithChance(
    sessionId: string,
    betAmount: number,
    chance: number,
    isOver: boolean,
  ): DiceResult {
    const target = isOver ? 99.99 - chance : chance;
    return this.roll(sessionId, betAmount, Math.floor(target * 100) / 100, isOver);
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
