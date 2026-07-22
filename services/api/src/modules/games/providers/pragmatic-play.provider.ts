import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, createHash } from 'crypto';
import { GameProvider, GameLaunchParams, GameInfo, ProviderTransaction } from './base.provider';

/**
 * Operating mode for the Pragmatic Play provider.
 * — REAL   : always call the live API; throw on failure.
 * — DEMO   : never call the API; return mock data.
 * — HYBRID : try the API first; fall back to mock on any error.
 */
export type PpMode = 'real' | 'demo' | 'hybrid';

/* ------------------------------------------------------------------ */
/*  Pragmatic Play API v3 response shapes (minimal, only what we use) */
/* ------------------------------------------------------------------ */

interface PpGameListItem {
  gameID: string;
  gameName: string;
  gameCategory?: string;
  rtp?: number | string;
  minBet?: number;
  maxBet?: number;
  thumbnail?: string;
  status?: string;
  /** Free-form fields some PP accounts return */
  [key: string]: unknown;
}

interface PpGameListResponse {
  games?: PpGameListItem[];
  [key: string]: unknown;
}

interface PpGameUrlResponse {
  gameURL?: string;
  launchUrl?: string;
  url?: string;
  [key: string]: unknown;
}

interface PpPlayerDetailsResponse {
  playerId?: string;
  currency?: string;
  balance?: number;
  status?: string;
  [key: string]: unknown;
}

/** PP webhook payload – the fields we care about */
export interface PpWebhookPayload {
  transactionId?: string;
  roundId?: string;
  type?: string;
  amount?: number | string;
  currency?: string;
  gameId?: string;
  gameID?: string;
  playerId?: string;
  timestamp?: string | number;
  /** Allow extra fields for forward-compat */
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

const MOCK_GAMES: GameInfo[] = [
  { id: 'pp-gates-of-olympus',       name: 'Gates of Olympus',        externalId: 'vs20olympgate',   category: 'SLOTS', rtp: 96.50,  minBet: 0.40, maxBet: 200,   thumbnailUrl: 'https://cdn.pragmaticplay.net/gates-of-olympus.png',       isActive: true },
  { id: 'pp-sweet-bonanza',          name: 'Sweet Bonanza',           externalId: 'vs20frbonanza',   category: 'SLOTS', rtp: 96.48,  minBet: 0.20, maxBet: 200,   thumbnailUrl: 'https://cdn.pragmaticplay.net/sweet-bonanza.png',          isActive: true },
  { id: 'pp-the-dog-house',          name: 'The Dog House',           externalId: 'vs20doghouse',    category: 'SLOTS', rtp: 96.51,  minBet: 0.20, maxBet: 240,   thumbnailUrl: 'https://cdn.pragmaticplay.net/the-dog-house.png',          isActive: true },
  { id: 'pp-wolf-gold',              name: 'Wolf Gold',               externalId: 'vs20wolfgold',    category: 'SLOTS', rtp: 96.01,  minBet: 0.25, maxBet: 125,   thumbnailUrl: 'https://cdn.pragmaticplay.net/wolf-gold.png',              isActive: true },
  { id: 'pp-big-bass-bonanza',       name: 'Big Bass Bonanza',        externalId: 'vs10bbbonanza',   category: 'SLOTS', rtp: 96.71,  minBet: 0.10, maxBet: 250,   thumbnailUrl: 'https://cdn.pragmaticplay.net/big-bass-bonanza.png',       isActive: true },
  { id: 'pp-sugar-rush',             name: 'Sugar Rush',              externalId: 'vs20sugarrush',   category: 'SLOTS', rtp: 96.50,  minBet: 0.20, maxBet: 200,   thumbnailUrl: 'https://cdn.pragmaticplay.net/sugar-rush.png',             isActive: true },
  { id: 'pp-starlight-princess',     name: 'Starlight Princess',      externalId: 'vs1000starlight', category: 'SLOTS', rtp: 96.50,  minBet: 0.40, maxBet: 200,   thumbnailUrl: 'https://cdn.pragmaticplay.net/starlight-princess.png',     isActive: true },
  { id: 'pp-gates-of-olympus-2',     name: 'Gates of Olympus 2',      externalId: 'vswaysolympgate', category: 'SLOTS', rtp: 96.50,  minBet: 0.20, maxBet: 200,   thumbnailUrl: 'https://cdn.pragmaticplay.net/gates-of-olympus-2.png',     isActive: true },
  { id: 'pp-sweet-bonanza-xmas',     name: 'Sweet Bonanza Xmas',      externalId: 'vs20sbxmas',      category: 'SLOTS', rtp: 96.48,  minBet: 0.20, maxBet: 200,   thumbnailUrl: 'https://cdn.pragmaticplay.net/sweet-bonanza-xmas.png',     isActive: true },
  { id: 'pp-the-dog-house-megaways', name: 'The Dog House Megaways',  externalId: 'vswaysdhouse',   category: 'SLOTS', rtp: 96.55,  minBet: 0.20, maxBet: 240,   thumbnailUrl: 'https://cdn.pragmaticplay.net/the-dog-house-megaways.png', isActive: true },
  { id: 'pp-buffalo-king',           name: 'Buffalo King',            externalId: 'vs50buffalo',     category: 'SLOTS', rtp: 96.50,  minBet: 0.40, maxBet: 200,   thumbnailUrl: 'https://cdn.pragmaticplay.net/buffalo-king.png',           isActive: true },
  { id: 'pp-fire-hot-5',             name: 'Fire Hot 5',              externalId: 'vs5firehot',      category: 'SLOTS', rtp: 96.50,  minBet: 0.05, maxBet: 50,    thumbnailUrl: 'https://cdn.pragmaticplay.net/fire-hot-5.png',             isActive: true },
  { id: 'pp-zeus-vs-hades',          name: 'Zeus vs Hades',           externalId: 'vs20hadesgod',    category: 'SLOTS', rtp: 96.00,  minBet: 0.20, maxBet: 200,   thumbnailUrl: 'https://cdn.pragmaticplay.net/zeus-vs-hades.png',          isActive: true },
  { id: 'pp-big-bass-splash',        name: 'Big Bass Splash',         externalId: 'vs10bbsplash',    category: 'SLOTS', rtp: 96.71,  minBet: 0.10, maxBet: 250,   thumbnailUrl: 'https://cdn.pragmaticplay.net/big-bass-splash.png',        isActive: true },
  { id: 'pp-gems-bonanza',           name: 'Gems Bonanza',            externalId: 'vs20rhinoluxe',   category: 'SLOTS', rtp: 96.50,  minBet: 0.20, maxBet: 200,   thumbnailUrl: 'https://cdn.pragmaticplay.net/gems-bonanza.png',           isActive: true },
  { id: 'pp-fruit-party',            name: 'Fruit Party',             externalId: 'vs20fruitparty',  category: 'SLOTS', rtp: 96.47,  minBet: 0.20, maxBet: 200,   thumbnailUrl: 'https://cdn.pragmaticplay.net/fruit-party.png',            isActive: true },
  { id: 'pp-release-the-kraken',     name: 'Release the Kraken',      externalId: 'vs20kraken',      category: 'SLOTS', rtp: 96.50,  minBet: 0.20, maxBet: 200,   thumbnailUrl: 'https://cdn.pragmaticplay.net/release-the-kraken.png',     isActive: true },
  { id: 'pp-live-mega-roulette',     name: 'Mega Roulette Live',      externalId: 'rla_megaroulette', category: 'LIVE',  rtp: 97.00,  minBet: 0.20, maxBet: 5000,  thumbnailUrl: 'https://cdn.pragmaticplay.net/mega-roulette-live.png',     isActive: true },
  { id: 'pp-live-blackjack',         name: 'Blackjack VIP Live',      externalId: 'rla_blackjack_vip',category: 'LIVE',  rtp: 99.50,  minBet: 1,    maxBet: 10000, thumbnailUrl: 'https://cdn.pragmaticplay.net/blackjack-vip.png',         isActive: true },
  { id: 'pp-live-baccarat',          name: 'Speed Baccarat Live',     externalId: 'rla_speedbaccarat',category: 'LIVE',  rtp: 98.94,  minBet: 1,    maxBet: 10000, thumbnailUrl: 'https://cdn.pragmaticplay.net/speed-baccarat.png',        isActive: true },
];

/* ------------------------------------------------------------------ */
/*  Provider implementation                                           */
/* ------------------------------------------------------------------ */

@Injectable()
export class PragmaticPlayProvider implements GameProvider {
  readonly providerId = 'pragmatic-play';
  private readonly logger = new Logger(PragmaticPlayProvider.name);

  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly casinoName: string;
  private readonly secretKey: string;
  private readonly mode: PpMode;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('PRAGMATIC_PLAY_API_URL') || '';
    this.apiKey = this.configService.get<string>('PRAGMATIC_PLAY_API_KEY') || '';
    this.casinoName = this.configService.get<string>('PRAGMATIC_PLAY_CASINO_NAME') || '';
    this.secretKey = this.configService.get<string>('PRAGMATIC_PLAY_SECRET_KEY') || '';

    // Determine operating mode from env; default to hybrid
    const raw = this.configService.get<string>('PRAGMATIC_PLAY_MODE') || '';
    if (raw === 'real' || raw === 'demo' || raw === 'hybrid') {
      this.mode = raw;
    } else {
      // Auto-detect: if we have both key and URL → hybrid, otherwise demo
      this.mode = this.apiKey && this.apiUrl ? 'hybrid' : 'demo';
    }

    this.logger.log(
      `PragmaticPlayProvider initialised — mode: ${this.mode}, apiUrl: ${this.apiUrl || 'N/A'}, casino: ${this.casinoName || 'N/A'}`,
    );
  }

  /* ========================= public API ========================== */

  /**
   * Return the list of available games.
   *
   * REAL   → calls POST /IntegrationService/v3/game/list
   * DEMO   → returns 20 mock games
   * HYBRID → tries REAL first, falls back to DEMO on any error
   */
  async getGames(): Promise<GameInfo[]> {
    if (this.mode === 'demo') {
      this.logger.debug('DEMO mode — returning mock game list');
      return MOCK_GAMES;
    }

    try {
      const body = {
        casinoName: this.casinoName,
        secureLogin: this.secretKey,
      };

      this.logger.debug(`Fetching game list from ${this.apiUrl}/IntegrationService/v3/game/list`);

      const response = await this.post<PpGameListResponse>(
        '/IntegrationService/v3/game/list',
        body,
      );

      const rawGames = response.games ?? [];
      if (rawGames.length === 0) {
        this.logger.warn('Pragmatic Play returned 0 games');
      }

      return rawGames.map((g) => this.mapGame(g));
    } catch (error) {
      if (this.mode === 'hybrid') {
        this.logger.warn(
          `HYBRID mode — real API failed, falling back to mock games: ${(error as Error).message}`,
        );
        return MOCK_GAMES;
      }
      // REAL mode — propagate
      this.logger.error('Failed to fetch Pragmatic Play games', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get a launch / iframe URL for a given game.
   *
   * REAL   → calls POST /IntegrationService/v3/game/url
   * DEMO   → returns a synthetic demo URL
   * HYBRID → tries REAL first, falls back to DEMO on any error
   */
  async getLaunchUrl(externalGameId: string, params: GameLaunchParams): Promise<string | null> {
    if (this.mode === 'demo') {
      this.logger.debug(`DEMO mode — returning demo launch URL for game ${externalGameId}`);
      return this.buildDemoLaunchUrl(externalGameId, params);
    }

    const body = {
      casinoName: this.casinoName,
      secureLogin: this.secretKey,
      gameId: externalGameId,
      playerId: params.userId,
      currency: params.currency || 'USDT',
      mode: params.mode === 'demo' ? 'fun' : 'real',
      language: params.language || 'en',
      lobbyUrl: params.returnUrl || '',
    };

    try {
      this.logger.debug(`Requesting launch URL for game ${externalGameId}, player ${params.userId}`);

      const data = await this.post<PpGameUrlResponse>(
        '/IntegrationService/v3/game/url',
        body,
      );

      const url = data.gameURL ?? data.launchUrl ?? data.url ?? '';
      if (!url) {
        throw new Error('Pragmatic Play /game/url returned empty URL');
      }

      this.logger.debug(`Launch URL obtained for game ${externalGameId}`);
      return url;
    } catch (error) {
      if (this.mode === 'hybrid') {
        this.logger.warn(
          `HYBRID mode — real API failed for launch URL, falling back to demo: ${(error as Error).message}`,
        );
        return this.buildDemoLaunchUrl(externalGameId, params);
      }
      this.logger.error('Failed to get Pragmatic Play launch URL', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Fetch player details from Pragmatic Play.
   * (Not required for wallet ops, but useful for account sync / verification.)
   */
  async getPlayerDetails(playerId: string): Promise<PpPlayerDetailsResponse> {
    if (this.mode === 'demo') {
      this.logger.debug(`DEMO mode — returning mock player details for ${playerId}`);
      return {
        playerId,
        currency: 'USDT',
        balance: 0,
        status: 'active',
      };
    }

    const body = {
      casinoName: this.casinoName,
      secureLogin: this.secretKey,
      playerId,
    };

    try {
      const data = await this.post<PpPlayerDetailsResponse>(
        '/IntegrationService/v3/player/details',
        body,
      );
      return data;
    } catch (error) {
      if (this.mode === 'hybrid') {
        this.logger.warn(
          `HYBRID mode — real API failed for player details, returning mock: ${(error as Error).message}`,
        );
        return { playerId, currency: 'USDT', balance: 0, status: 'active' };
      }
      throw error;
    }
  }

  /**
   * Validate an incoming Pragmatic Play webhook.
   *
   * PP signs the payload body with HMAC-SHA256 using the secret key.
   * The signature is sent in the `X-PragmaticPlay-Signature` header.
   */
  validateWebhook(payload: unknown, signature: string): boolean {
    if (!this.secretKey) {
      this.logger.warn('PRAGMATIC_PLAY_SECRET_KEY is not set — webhook validation always fails');
      return false;
    }

    try {
      const expected = this.generateSignature(payload);
      // Constant-time comparison to prevent timing attacks
      const a = Buffer.from(expected, 'hex');
      const b = Buffer.from(signature, 'hex');
      if (a.length !== b.length) return false;
      return a.reduce((acc, byte, i) => acc | (byte ^ b[i]), 0) === 0;
    } catch (error) {
      this.logger.error('Webhook signature validation error', (error as Error).stack);
      return false;
    }
  }

  /**
   * Parse a Pragmatic Play webhook payload into our internal
   * ProviderTransaction format.
   */
  parseTransaction(payload: PpWebhookPayload): ProviderTransaction {
    const externalId = payload.transactionId ?? payload.roundId ?? '';
    const rawAmount = payload.amount ?? 0;
    const amount = typeof rawAmount === 'string' ? Math.abs(parseFloat(rawAmount)) : Math.abs(rawAmount);
    const ts = payload.timestamp
      ? typeof payload.timestamp === 'number'
        ? new Date(payload.timestamp)
        : new Date(payload.timestamp)
      : new Date();

    return {
      externalId,
      type: this.mapTransactionType(payload.type),
      amount,
      currency: payload.currency || 'USDT',
      gameId: payload.gameId ?? payload.gameID ?? '',
      playerId: payload.playerId ?? '',
      roundId: payload.roundId ?? '',
      timestamp: ts,
    };
  }

  /**
   * Balance is managed by our internal wallet, not PP.
   */
  async getBalance(_playerId: string): Promise<number> {
    return 0;
  }

  /* ====================== private helpers ======================== */

  /**
   * Generic POST helper with auth header, timeout, and structured error.
   */
  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.apiUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000); // 15 s

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
        throw new Error(
          `Pragmatic Play API ${path} → HTTP ${response.status}: ${text}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Pragmatic Play API ${path} → request timed out after 15 s`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Generate HMAC-SHA256 signature for webhook validation.
   * PP signs the raw JSON body string with the secret key.
   */
  private generateSignature(payload: unknown): string {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  /**
   * Map a raw PP game object → our GameInfo.
   */
  private mapGame(g: PpGameListItem): GameInfo {
    const rtpRaw = g.rtp;
    let rtp: number | undefined;
    if (typeof rtpRaw === 'number') {
      // PP returns RTP as e.g. 9650 meaning 96.50 %
      rtp = rtpRaw >= 100 ? rtpRaw / 100 : rtpRaw;
    } else if (typeof rtpRaw === 'string') {
      const parsed = parseFloat(rtpRaw);
      rtp = isNaN(parsed) ? undefined : parsed >= 100 ? parsed / 100 : parsed;
    }

    return {
      id: `pp-${g.gameID}`,
      name: g.gameName,
      externalId: g.gameID,
      category: this.mapCategory(g.gameCategory),
      rtp,
      minBet: g.minBet,
      maxBet: g.maxBet,
      thumbnailUrl: g.thumbnail,
      isActive: (g.status ?? 'active') === 'active',
    };
  }

  private buildDemoLaunchUrl(externalGameId: string, params: GameLaunchParams): string {
    const base = this.apiUrl || 'https://demogamesfree.pragmaticplay.net';
    const qp = new URLSearchParams({
      gameSymbol: externalGameId,
    });
    return `${base}/gs2c/openGame.do?${qp.toString()}`;
  }

  private mapCategory(category: string | undefined): string {
    const mapping: Record<string, string> = {
      slots: 'SLOTS',
      table: 'TABLE',
      live: 'LIVE',
      crash: 'CRASH',
      keno: 'KENO',
      lottery: 'LOTTERY',
      dice: 'DICE',
      plinko: 'PLINKO',
      blackjack: 'LIVE',
      roulette: 'LIVE',
      baccarat: 'LIVE',
      poker: 'TABLE',
      videopoker: 'TABLE',
    };
    return mapping[category?.toLowerCase() ?? ''] || 'SLOTS';
  }

  private mapTransactionType(
    type: string | undefined,
  ): 'bet' | 'win' | 'refund' | 'rollback' {
    const mapping: Record<string, 'bet' | 'win' | 'refund' | 'rollback'> = {
      bet: 'bet',
      win: 'win',
      refund: 'refund',
      rollback: 'rollback',
      debit: 'bet',
      credit: 'win',
      withdraw: 'bet',
      deposit: 'win',
    };
    return mapping[type?.toLowerCase() ?? ''] || 'bet';
  }
}
