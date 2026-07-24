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
    'habanero',
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
    const gameName = params.gameName || slug;

    switch (providerId) {
      // ─── IFRAME-SUPPORTED PROVIDERS (no X-Frame-Options) ───
      case 'pragmatic':
        // Pragmatic Play demo server (verified working)
        return `https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=${externalGameId}`;

      case 'spribe':
        // Spribe demo (verified working)
        return `https://spribe.co/games/${externalGameId}/demo`;

      case 'bgaming':
        // BGaming network demo — ALLOWALL, verified working
        return `https://demo.bgaming-network.com/play/${encodeURIComponent(gameName)}/FUN?server=demo`;

      case 'habanero':
        // Habanero demo — no iframe restrictions, verified working
        return `https://demo.habanero.com/gs/?game=${encodeURIComponent(gameName)}&language=en&mode=demo`;

      case 'netent':
        // NetEnt demo — works without X-Frame-Options (as of 2026)
        // Can be embedded in iframe on most browsers
        return `https://games.netent.com/play/${encodeURIComponent(slug)}`;

      // ─── REDIRECT PROVIDERS (X-Frame-Options: SAMEORIGIN or JS launcher) ───
      case 'yggdrasil':
        // Yggdrasil — https://yggdrasilgaming.com/play/[slug]
        // 200 OK, X-Frame-Options: SAMEORIGIN → frontend opens in new tab
        return `https://yggdrasilgaming.com/play/${encodeURIComponent(slug)}`;

      case 'redtiger':
        // Red Tiger — no public demo URL found
        // Redirect to their site's game search page
        return `https://redtiger.com/games`;

      case 'hacksaw':
        // Hacksaw Gaming — no public demo URL found
        // Redirect to their games list
        return `https://www.hacksawgaming.com/games`;

      case 'pushgaming':
        // Push Gaming — no public demo URL found
        // Redirect to their games page
        return `https://www.pushgaming.com/games/`;

      case 'wazdan':
        // Wazdan demo — blocks iframe
        return `https://wazdan.com/gs2/play/${encodeURIComponent(slug)}/`;

      case 'evoplay':
        // Evoplay demo — JS token launcher, blocks iframe
        return `https://evoplay.com/game/${encodeURIComponent(slug)}/`;

      case 'nolimitcity':
        // Nolimit City — marketing page, no direct demo
        // Redirect to their play page
        return `https://nolimitcity.com/play/${encodeURIComponent(slug)}`;

      case 'thunderkick':
        // Thunderkick — has game pages but no direct demo URL
        // Redirect to game info page
        return `https://thunderkick.com/demo/${encodeURIComponent(slug)}`;

      case 'playngo':
        // Play'n GO — DNS failure on direct demo, redirect to site
        return `https://www.playngo.com/games/${encodeURIComponent(slug)}`;

      case 'microgaming':
        // Microgaming — DNS failure on direct demo
        return `https://www.microgaming.co.uk/games/`;

      case 'playtech':
        // Playtech — restricted demo access
        return `https://www.playtech.com/games/`;

      case 'relaxgaming':
        // Relax Gaming — no public demo
        return `https://relax-gaming.com/games/`;

      case 'truelab':
        // True Lab — no public demo
        return `https://truelab.com/`;

      case 'elkstudios':
        // ELK Studios — no public demo
        return `https://elkstudios.com/games/`;

      case 'slotmill':
        // SlotMill — no public demo
        return `https://slotmill.com/games/`;

      default:
        // All other providers — fallback to redirect to provider's site
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