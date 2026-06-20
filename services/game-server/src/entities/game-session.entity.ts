import { v4 as uuidv4 } from 'uuid';

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
}

export interface GameSessionData {
  id: string;
  userId: string;
  username: string;
  gameType: string;
  clientSeed: string;
  serverHash: string;
  nonce: number;
  status: SessionStatus;
  totalBet: number;
  totalWin: number;
  spinCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class GameSession implements GameSessionData {
  id: string;
  userId: string;
  username: string;
  gameType: string;
  clientSeed: string;
  serverHash: string;
  nonce: number;
  status: SessionStatus;
  totalBet: number;
  totalWin: number;
  spinCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<GameSession>) {
    this.id = data.id || uuidv4();
    this.userId = data.userId || '';
    this.username = data.username || '';
    this.gameType = data.gameType || '';
    this.clientSeed = data.clientSeed || '';
    this.serverHash = data.serverHash || '';
    this.nonce = data.nonce || 0;
    this.status = data.status || SessionStatus.ACTIVE;
    this.totalBet = data.totalBet || 0;
    this.totalWin = data.totalWin || 0;
    this.spinCount = data.spinCount || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  addBet(amount: number): void {
    this.totalBet += amount;
    this.updatedAt = new Date();
  }

  addWin(amount: number): void {
    this.totalWin += amount;
    this.updatedAt = new Date();
  }

  incrementNonce(): void {
    this.nonce++;
    this.updatedAt = new Date();
  }

  incrementSpinCount(): void {
    this.spinCount++;
    this.updatedAt = new Date();
  }

  complete(): void {
    this.status = SessionStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  getProfit(): number {
    return this.totalWin - this.totalBet;
  }

  toJSON(): GameSessionData {
    return {
      id: this.id,
      userId: this.userId,
      username: this.username,
      gameType: this.gameType,
      clientSeed: this.clientSeed,
      serverHash: this.serverHash,
      nonce: this.nonce,
      status: this.status,
      totalBet: this.totalBet,
      totalWin: this.totalWin,
      spinCount: this.spinCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
