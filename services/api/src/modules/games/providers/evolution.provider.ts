import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GameProvider, GameLaunchParams, GameInfo, ProviderTransaction } from './base.provider';

/**
 * Operating mode for Evolution Gaming provider.
 * — REAL   : always call the live API; throw on failure.
 * — DEMO   : never call the API; return mock data.
 * — HYBRID : try the API first; fall back to mock on any error.
 */
export type EvolutionMode = 'real' | 'demo' | 'hybrid';

const MOCK_GAMES: GameInfo[] = [
  { id: 'ev-lightning-roulette',    name: 'Lightning Roulette',       externalId: 'lightningroulette',    category: 'LIVE', rtp: 97.30, minBet: 0.50, maxBet: 10000, thumbnailUrl: 'https://cdn.evolution.com/lightning-roulette.png',    isActive: true },
  { id: 'ev-speed-baccarat',        name: 'Speed Baccarat',           externalId: 'speedbaccarat',        category: 'LIVE', rtp: 98.94, minBet: 1,    maxBet: 10000, thumbnailUrl: 'https://cdn.evolution.com/speed-baccarat.png',        isActive: true },
  { id: 'ev-infinite-blackjack',    name: 'Infinite Blackjack',       externalId: 'infiniteblackjack',    category: 'LIVE', rtp: 99.60, minBet: 1,    maxBet: 10000, thumbnailUrl: 'https://cdn.evolution.com/infinite-blackjack.png',    isActive: true },
  { id: 'ev-baccarat-squeeze',      name: 'Baccarat Squeeze',         externalId: 'baccaratsqueeze',      category: 'LIVE', rtp: 98.90, minBet: 5,    maxBet: 25000, thumbnailUrl: 'https://cdn.evolution.com/baccarat-squeeze.png',      isActive: true },
  { id: 'ev-crazy-time',            name: 'Crazy Time',               externalId: 'crazytime',            category: 'LIVE', rtp: 96.08, minBet: 0.10, maxBet: 2000,  thumbnailUrl: 'https://cdn.evolution.com/crazy-time.png',            isActive: true },
  { id: 'ev-dream-catcher',         name: 'Dream Catcher',            externalId: 'dreamcatcher',         category: 'LIVE', rtp: 96.58, minBet: 0.10, maxBet: 2000,  thumbnailUrl: 'https://cdn.evolution.com/dream-catcher.png',         isActive: true },
  { id: 'ev-monopoly-live',         name: 'Monopoly Live',            externalId: 'monopolylive',         category: 'LIVE', rtp: 96.08, minBet: 0.10, maxBet: 2000,  thumbnailUrl: 'https://cdn.evolution.com/monopoly-live.png',         isActive: true },
  { id: 'ev-gonzo-treasure-hunt',   name: 'Gonzo\'s Treasure Hunt',   externalId: 'gonzostreasurehunt',   category: 'LIVE', rtp: 96.00, minBet: 0.20, maxBet: 2000,  thumbnailUrl: 'https://cdn.evolution.com/gonzo-treasure-hunt.png',   isActive: true },
  { id: 'ev-fun-time',              name: 'Funky Time',               externalId: 'funkytime',            category: 'LIVE', rtp: 96.09, minBet: 0.10, maxBet: 2000,  thumbnailUrl: 'https://cdn.evolution.com/funky-time.png',            isActive: true },
  { id: 'ev-mega-roulette',         name: 'Mega Roulette',            externalId: 'megaroulette',         category: 'LIVE', rtp: 97.00, minBet: 0.20, maxBet: 5000,  thumbnailUrl: 'https://cdn.evolution.com/mega-roulette.png',         isActive: true },
  { id: 'ev-super-andar-bahar',     name: 'Super Andar Bahar',       externalId: 'superandarbahar',      category: 'LIVE', rtp: 97.75, minBet: 0.50, maxBet: 5000,  thumbnailUrl: 'https://cdn.evolution.com/super-andar-bahar.png',     isActive: true },
  { id: 'ev-teen-patti',            name: 'Teen Patti',               externalId: 'teenpatti',            category: 'LIVE', rtp: 97.50, minBet: 0.50, maxBet: 5000,  thumbnailUrl: 'https://cdn.evolution.com/teen-patti.png',            isActive: true },
];

@Injectable()
export class EvolutionProvider implements GameProvider {
  readonly providerId = 'evolution';
  private readonly logger = new Logger(EvolutionProvider.name);

  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly casinoName: string;
  private readonly secretKey: string;
  private readonly mode: EvolutionMode;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('EVOLUTION_API_URL') || '';
    this.apiKey = this.configService.get<string>('EVOLUTION_API_KEY') || '';
    this.casinoName = this.configService.get<string>('EVOLUTION_CASINO_NAME') || '';
    this.secretKey = this.configService.get<string>('EVOLUTION_SECRET_KEY') || '';

    const raw = this.configService.get<string>('EVOLUTION_MODE') || '';
    if (raw === 'real' || raw === 'demo' || raw === 'hybrid') {
      this.mode = raw;
    } else {
      this.mode = this.apiKey && this.apiUrl ? 'hybrid' : 'demo';
    }

    this.logger.log(
      `EvolutionProvider initialised — mode: ${this.mode}, apiUrl: ${this.apiUrl || 'N/A'}`,
    );
  }

  async getGames(): Promise<GameInfo[]> {
    if (this.mode === 'demo') {
      this.logger.debug('DEMO mode — returning mock Evolution game list');
      return MOCK_GAMES;
    }

    try {
      const response = await this.post<{ games?: any[] }>('/IntegrationService/v3/game/list', {
        casinoName: this.casinoName,
        secureLogin: this.secretKey,
      });

      const rawGames = response.games ?? [];
      return rawGames.map((g) => this.mapGame(g));
    } catch (error) {
      if (this.mode === 'hybrid') {
        this.logger.warn(`HYBRID mode — real API failed, falling back to mock: ${(error as Error).message}`);
        return MOCK_GAMES;
      }
      throw error;
    }
  }

  async getLaunchUrl(externalGameId: string, params: GameLaunchParams): Promise<string> {
    if (this.mode === 'demo') {
      return this.buildDemoLaunchUrl(externalGameId, params);
    }

    try {
      const data = await this.post<{ gameURL?: string; launchUrl?: string; url?: string }>(
        '/IntegrationService/v3/game/url',
        {
          casinoName: this.casinoName,
          secureLogin: this.secretKey,
          gameId: externalGameId,
          playerId: params.userId,
          currency: params.currency || 'USDT',
          mode: params.mode === 'demo' ? 'fun' : 'real',
          language: params.language || 'en',
          lobbyUrl: params.returnUrl || '',
        },
      );

      return data.gameURL ?? data.launchUrl ?? data.url ?? '';
    } catch (error) {
      if (this.mode === 'hybrid') {
        this.logger.warn(`HYBRID mode — launching demo URL for ${externalGameId}`);
        return this.buildDemoLaunchUrl(externalGameId, params);
      }
      throw error;
    }
  }

  validateWebhook(payload: any, signature: string): boolean {
    if (!this.secretKey) return false;
    try {
      const { createHmac } = require('crypto');
      const expected = createHmac('sha256', this.secretKey)
        .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
        .digest('hex');
      return expected === signature;
    } catch {
      return false;
    }
  }

  parseTransaction(payload: any): ProviderTransaction {
    return {
      externalId: payload.transactionId ?? payload.roundId ?? '',
      type: 'bet',
      amount: Math.abs(Number(payload.amount ?? 0)),
      currency: payload.currency || 'USDT',
      gameId: payload.gameId ?? payload.gameID ?? '',
      playerId: payload.playerId ?? '',
      roundId: payload.roundId ?? '',
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    };
  }

  private buildDemoLaunchUrl(externalGameId: string, params: GameLaunchParams): string {
    const base = this.apiUrl || 'https://evolution-demo.com';
    const qp = new URLSearchParams({
      gameId: externalGameId,
      playerId: params.userId,
      currency: params.currency || 'USDT',
      mode: params.mode === 'demo' ? 'fun' : 'real',
      language: params.language || 'en',
    });
    return `${base}/demo/launch?${qp.toString()}`;
  }

  private mapGame(g: any): GameInfo {
    return {
      id: `ev-${g.gameID}`,
      name: g.gameName,
      externalId: g.gameID,
      category: 'LIVE',
      rtp: g.rtp ? Number(g.rtp) : undefined,
      minBet: g.minBet,
      maxBet: g.maxBet,
      thumbnailUrl: g.thumbnail,
      isActive: (g.status ?? 'active') === 'active',
    };
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.apiUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Evolution API ${path} → HTTP ${response.status}: ${text}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Evolution API ${path} → request timed out`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}