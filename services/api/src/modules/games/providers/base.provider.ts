export interface GameLaunchParams {
  userId: string;
  mode: 'real' | 'demo';
  sessionToken?: string;
  currency?: string;
  language?: string;
  returnUrl?: string;
  providerId?: string;
}

export interface GameLaunchResult {
  launchUrl: string;
  token?: string;
  expiresAt?: Date;
}

export interface GameInfo {
  id: string;
  name: string;
  externalId: string;
  category: string;
  rtp?: number;
  minBet?: number;
  maxBet?: number;
  thumbnailUrl?: string;
  isActive: boolean;
}

export interface ProviderTransaction {
  externalId: string;
  type: 'bet' | 'win' | 'refund' | 'rollback';
  amount: number;
  currency: string;
  gameId: string;
  playerId: string;
  roundId: string;
  timestamp: Date;
}

export interface GameProvider {
  readonly providerId: string;

  getGames(): Promise<GameInfo[]>;

  getLaunchUrl(externalGameId: string, params: GameLaunchParams): Promise<string>;

  validateWebhook(payload: any, signature: string): boolean;

  parseTransaction(payload: any): ProviderTransaction;

  getBalance?(playerId: string): Promise<number>;

  processBet?(playerId: string, amount: number, roundId: string): Promise<boolean>;

  processWin?(playerId: string, amount: number, roundId: string): Promise<boolean>;

  rollback?(roundId: string): Promise<boolean>;
}
