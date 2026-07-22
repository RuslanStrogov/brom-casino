import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GameProvider, GameLaunchParams, GameInfo, ProviderTransaction } from './base.provider';

export type SpribeMode = 'real' | 'demo' | 'hybrid';

const MOCK_GAMES: GameInfo[] = [
  { id: 'sp-aviator', name: 'Aviator', externalId: 'aviator', category: 'CRASH', rtp: 97.00, minBet: 0.10, maxBet: 10000, thumbnailUrl: 'https://cdn.spribe.com/aviator.png', isActive: true },
  { id: 'sp-mines',   name: 'Mines',   externalId: 'mines',   category: 'CRASH', rtp: 97.00, minBet: 0.10, maxBet: 5000,  thumbnailUrl: 'https://cdn.spribe.com/mines.png',   isActive: true },
  { id: 'sp-dice',    name: 'Dice',     externalId: 'dice',    category: 'DICE',  rtp: 99.00, minBet: 0.01, maxBet: 10000, thumbnailUrl: 'https://cdn.spribe.com/dice.png',    isActive: true },
  { id: 'sp-plinko',  name: 'Plinko',   externalId: 'plinko',  category: 'PLINKO',rtp: 97.00, minBet: 0.10, maxBet: 5000,  thumbnailUrl: 'https://cdn.spribe.com/plinko.png',  isActive: true },
  { id: 'sp-limbo',   name: 'Limbo',    externalId: 'limbo',   category: 'CRASH', rtp: 97.00, minBet: 0.10, maxBet: 10000, thumbnailUrl: 'https://cdn.spribe.com/limbo.png',   isActive: true },
];

@Injectable()
export class SpribeProvider implements GameProvider {
  readonly providerId = 'spribe';
  private readonly logger = new Logger(SpribeProvider.name);

  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly mode: SpribeMode;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('SPRIBE_API_URL') || '';
    this.apiKey = this.configService.get<string>('SPRIBE_API_KEY') || '';

    const raw = this.configService.get<string>('SPRIBE_MODE') || '';
    if (raw === 'real' || raw === 'demo' || raw === 'hybrid') {
      this.mode = raw;
    } else {
      this.mode = this.apiKey && this.apiUrl ? 'hybrid' : 'demo';
    }

    this.logger.log(`SpribeProvider initialised — mode: ${this.mode}`);
  }

  async getGames(): Promise<GameInfo[]> {
    return MOCK_GAMES;
  }

  async getLaunchUrl(externalGameId: string, params: GameLaunchParams): Promise<string | null> {
    if (this.mode === 'real') {
      try {
        const data = await this.post<{ url?: string }>('/api/v1/games/launch', {
          gameId: externalGameId,
          playerId: params.userId,
          currency: params.currency || 'USDT',
          mode: params.mode === 'demo' ? 'demo' : 'real',
        });
        return data.url ?? this.buildDemoUrl(externalGameId);
      } catch (error) {
        this.logger.warn(`Spribe API failed, using demo URL: ${(error as Error).message}`);
        return this.buildDemoUrl(externalGameId);
      }
    }
    return this.buildDemoUrl(externalGameId);
  }

  validateWebhook(_payload: any, _signature: string): boolean {
    return true;
  }

  parseTransaction(payload: any): ProviderTransaction {
    return {
      externalId: payload.transactionId ?? '',
      type: payload.type === 'win' ? 'win' : 'bet',
      amount: Math.abs(Number(payload.amount ?? 0)),
      currency: payload.currency || 'USDT',
      gameId: payload.gameId ?? '',
      playerId: payload.playerId ?? '',
      roundId: payload.roundId ?? '',
      timestamp: new Date(),
    };
  }

  private buildDemoUrl(externalGameId: string): string {
    return `https://spribe.co/games/${externalGameId}/demo`;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`${this.apiUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': this.apiKey },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}