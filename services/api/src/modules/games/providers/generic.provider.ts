import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GameProvider, GameLaunchParams, GameInfo, ProviderTransaction } from './base.provider';

/**
 * Generic fallback provider for third-party game studios.
 *
 * Most providers (NetEnt, Microgaming, Play'nGO, etc.) restrict embedding
 * their games on third-party domains. Only Pragmatic Play ("demogamesfree")
 * and Spribe ("spribe.co/games") provide publicly embeddable iframe demos.
 *
 * For all other providers, `getLaunchUrl` returns null — the frontend shows
 * a "Coming Soon" state. When a real aggregator (SoftSwiss, EveryMatrix) is
 * configured via AGGREGATOR_API_URL + AGGREGATOR_API_KEY, this provider
 * routes through that aggregator's launch API instead.
 */
@Injectable()
export class GenericProvider implements GameProvider {
  readonly providerId = 'generic';
  private readonly logger = new Logger(GenericProvider.name);

  private readonly aggregatorUrl: string;
  private readonly aggregatorKey: string;
  private readonly useAggregator: boolean;

  /** Provider IDs that this generic provider handles */
  readonly supportedProviders = [
    'netent',
    'microgaming',
    'playngo',
    'yggdrasil',
    'hacksaw',
    'pushgaming',
    'redtiger',
    'playtech',
    'relaxgaming',
    'truelab',
    'elkstudios',
    'thunderkick',
    'nolimitcity',
    'slotmill',
    'bgaming',
    'evolution',
  ];

  constructor(private readonly configService: ConfigService) {
    this.aggregatorUrl = this.configService.get<string>('AGGREGATOR_API_URL') || '';
    this.aggregatorKey = this.configService.get<string>('AGGREGATOR_API_KEY') || '';
    this.useAggregator = !!(this.aggregatorUrl && this.aggregatorKey);

    this.logger.log(
      `GenericProvider initialised — useAggregator: ${this.useAggregator}`,
    );
  }

  /**
   * Generic provider doesn't manage its own game list.
   * Games are seeded directly into the database.
   */
  async getGames(): Promise<GameInfo[]> {
    return [];
  }

  /**
   * Provide a launch/demo URL for any supported provider's game.
   */
  async getLaunchUrl(externalGameId: string, params: GameLaunchParams): Promise<string | null> {
    if (this.useAggregator) {
      try {
        const data = await this.post<{ url?: string; gameURL?: string }>(
          '/api/v1/games/launch',
          {
            gameId: externalGameId,
            providerId: params.providerId ?? 'generic',
            playerId: params.userId,
            currency: params.currency || 'USDT',
            mode: params.mode === 'demo' ? 'demo' : 'real',
            language: params.language || 'en',
          },
        );
        return data.url ?? data.gameURL ?? this.buildDemoUrl(externalGameId, params);
      } catch (error) {
        this.logger.warn(`Aggregator launch failed, using demo: ${(error as Error).message}`);
        return this.buildDemoUrl(externalGameId, params);
      }
    }

    return this.buildDemoUrl(externalGameId, params);
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

  private buildDemoUrl(externalGameId: string, params: GameLaunchParams): string | null {
    // Provider-specific demo URLs
    const providerId = params.providerId || '';
    const slug = params.slug || externalGameId;

    // Only providers with publicly embeddable iframe demos
    switch (providerId) {
      case 'pragmatic':
        // Pragmatic Play demo server (verified working)
        return `https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=${externalGameId}`;

      case 'spribe':
        // Spribe demo (verified working)
        return `https://spribe.co/games/${externalGameId}/demo`;

      default:
        // All other providers restrict embedding — no public demo URL available
        // When an aggregator is configured, the aggregator code path above handles this
        return null;
    }
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`${this.aggregatorUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.aggregatorKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}