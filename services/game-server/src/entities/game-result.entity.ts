import { v4 as uuidv4 } from 'uuid';

export enum GameType {
  SLOT = 'SLOT',
  CRASH = 'CRASH',
  DICE = 'DICE',
  PLINKO = 'PLINKO',
}

export interface GameResultData {
  id: string;
  sessionId: string;
  userId: string;
  gameType: GameType;
  betAmount: number;
  winAmount: number;
  multiplier: number;
  provablyFair: {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    hash: string;
  };
  details: Record<string, any>;
  createdAt: Date;
}

export class GameResult implements GameResultData {
  id: string;
  sessionId: string;
  userId: string;
  gameType: GameType;
  betAmount: number;
  winAmount: number;
  multiplier: number;
  provablyFair: {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    hash: string;
  };
  details: Record<string, any>;
  createdAt: Date;

  constructor(data: Partial<GameResult>) {
    this.id = data.id || uuidv4();
    this.sessionId = data.sessionId || '';
    this.userId = data.userId || '';
    this.gameType = data.gameType || GameType.SLOT;
    this.betAmount = data.betAmount || 0;
    this.winAmount = data.winAmount || 0;
    this.multiplier = data.multiplier || 0;
    this.provablyFair = data.provablyFair || {
      serverSeed: '',
      clientSeed: '',
      nonce: 0,
      hash: '',
    };
    this.details = data.details || {};
    this.createdAt = data.createdAt || new Date();
  }

  getProfit(): number {
    return this.winAmount - this.betAmount;
  }

  toJSON(): GameResultData {
    return {
      id: this.id,
      sessionId: this.sessionId,
      userId: this.userId,
      gameType: this.gameType,
      betAmount: this.betAmount,
      winAmount: this.winAmount,
      multiplier: this.multiplier,
      provablyFair: this.provablyFair,
      details: this.details,
      createdAt: this.createdAt,
    };
  }
}
