import { Injectable, Logger } from '@nestjs/common';
import { ProvablyFair } from '../rng/provably-fair';
import { RngService } from '../rng/rng.service';

export interface CrashBet {
  userId: string;
  username: string;
  betAmount: number;
  autoCashout: number | null; // null = no auto-cashout
  cashedOut: boolean;
  cashoutMultiplier: number;
  winAmount: number;
}

export interface CrashRound {
  id: string;
  crashPoint: number;
  hash: string;
  clientSeed: string;
  nonce: number;
  bets: CrashBet[];
  status: 'waiting' | 'running' | 'crashed';
  startTime: number;
  elapsed: number;
}

export interface CrashTick {
  multiplier: number;
  elapsed: number;
}

@Injectable()
export class CrashEngine {
  private readonly logger = new Logger(CrashEngine.name);
  private readonly rngService: RngService;
  private currentRound: CrashRound | null = null;
  private roundCounter = 0;

  constructor() {
    this.rngService = new RngService();
  }

  /** Generate a new crash point using provably fair RNG */
  generateCrashPoint(clientSeed?: string): { crashPoint: number; hash: string; clientSeed: string; nonce: number } {
    const pf = new ProvablyFair(this.rngService, clientSeed);
    const e = pf.next();

    // House edge = 1%
    // crashPoint = 0.99 / (1 - e), minimum 1.00
    const crashPoint = Math.max(1.0, 0.99 / (1 - e));
    const rounded = Math.floor(crashPoint * 100) / 100;

    return {
      crashPoint: rounded,
      hash: pf.getServerHash(),
      clientSeed: pf.getClientSeed(),
      nonce: pf.getNonce(),
    };
  }

  /** Start a new crash round */
  startRound(clientSeed?: string): CrashRound {
    this.roundCounter++;
    const { crashPoint, hash, clientSeed: cs, nonce } = this.generateCrashPoint(clientSeed);

    this.currentRound = {
      id: `crash-${this.roundCounter}-${Date.now()}`,
      crashPoint,
      hash,
      clientSeed: cs,
      nonce,
      bets: [],
      status: 'waiting',
      startTime: 0,
      elapsed: 0,
    };

    this.logger.log(`Crash round ${this.currentRound.id} created — crash point: ${crashPoint}x`);
    return this.currentRound;
  }

  /** Place a bet in the current round */
  placeBet(userId: string, username: string, betAmount: number, autoCashout: number | null): CrashBet | null {
    if (!this.currentRound || this.currentRound.status !== 'waiting') {
      return null;
    }

    // Check if user already bet
    const existing = this.currentRound.bets.find(b => b.userId === userId);
    if (existing) return existing;

    const bet: CrashBet = {
      userId,
      username,
      betAmount,
      autoCashout,
      cashedOut: false,
      cashoutMultiplier: 0,
      winAmount: 0,
    };

    this.currentRound.bets.push(bet);
    return bet;
  }

  /** Start the round (transition from waiting to running) */
  startGame(): CrashTick | null {
    if (!this.currentRound || this.currentRound.status !== 'waiting') return null;

    this.currentRound.status = 'running';
    this.currentRound.startTime = Date.now();

    return { multiplier: 1.0, elapsed: 0 };
  }

  /** Get current tick (call periodically) */
  getTick(): CrashTick | null {
    if (!this.currentRound || this.currentRound.status !== 'running') return null;

    const elapsed = Date.now() - this.currentRound.startTime;
    // Multiplier grows exponentially: 1.05^(elapsed/1000) — roughly doubles every 14 seconds
    const multiplier = Math.pow(1.001, elapsed);

    this.currentRound.elapsed = elapsed;

    return {
      multiplier: Math.floor(multiplier * 100) / 100,
      elapsed,
    };
  }

  /** Check if crash point is reached */
  isCrashed(): boolean {
    if (!this.currentRound || this.currentRound.status !== 'running') return false;
    const tick = this.getTick();
    if (!tick) return false;
    return tick.multiplier >= this.currentRound.crashPoint;
  }

  /** Cash out a player */
  cashout(userId: string): { success: boolean; multiplier: number; winAmount: number } | null {
    if (!this.currentRound || this.currentRound.status !== 'running') return null;

    const bet = this.currentRound.bets.find(b => b.userId === userId);
    if (!bet || bet.cashedOut) return null;

    const tick = this.getTick();
    if (!tick) return null;

    const multiplier = Math.min(tick.multiplier, this.currentRound.crashPoint);
    const cashoutMult = Math.floor(multiplier * 100) / 100;

    bet.cashedOut = true;
    bet.cashoutMultiplier = cashoutMult;
    bet.winAmount = Math.floor(bet.betAmount * cashoutMult * 100) / 100;

    return {
      success: true,
      multiplier: cashoutMult,
      winAmount: bet.winAmount,
    };
  }

  /** End the round (crash) */
  endRound(): CrashRound | null {
    if (!this.currentRound || this.currentRound.status !== 'running') return null;

    this.currentRound.status = 'crashed';

    // Players who didn't cash out lose
    for (const bet of this.currentRound.bets) {
      if (!bet.cashedOut) {
        bet.cashoutMultiplier = 0;
        bet.winAmount = 0;
      }
    }

    const round = { ...this.currentRound };
    this.logger.log(`Crash round ${round.id} ended at ${round.crashPoint}x — ${round.bets.length} players`);
    return round;
  }

  /** Get current round state */
  getCurrentRound(): CrashRound | null {
    return this.currentRound;
  }

  /** Check if a player won */
  checkWin(crashPoint: number, cashoutAt: number): boolean {
    return cashoutAt <= crashPoint;
  }

  /** Calculate win amount */
  calculateWin(betAmount: number, cashoutAt: number): number {
    return Math.floor(betAmount * cashoutAt * 100) / 100;
  }
}
