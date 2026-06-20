import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GameProvider, GameLaunchParams, GameInfo, ProviderTransaction } from './base.provider';

@Injectable()
export class PragmaticPlayProvider implements GameProvider {
  readonly providerId = 'pragmatic-play';
  private readonly logger = new Logger(PragmaticPlayProvider.name);

  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly casinoName: string;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('PRAGMATIC_PLAY_API_URL') || '';
    this.apiKey = this.configService.get<string>('PRAGMATIC_PLAY_API_KEY') || '';
    this.casinoName = this.configService.get<string>('PRAGMATIC_PLAY_CASINO_NAME') || '';
    this.secretKey = this.configService.get<string>('PRAGMATIC_PLAY_SECRET_KEY') || '';
  }

  async getGames(): Promise<GameInfo[]> {
    try {
      const response = await fetch(`${this.apiUrl}/IntegrationService/v3/game/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          casinoName: this.casinoName,
          secureLogin: this.secretKey,
        }),
      });

      if (!response.ok) {
        this.logger.error(`Pragmatic Play API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return (data.games || []).map((g: any) => ({
        id: g.gameID,
        name: g.gameName,
        externalId: g.gameID,
        category: this.mapCategory(g.gameCategory),
        rtp: g.rtp ? Number(g.rtp) / 100 : undefined,
        minBet: g.minBet,
        maxBet: g.maxBet,
        thumbnailUrl: g.thumbnail,
        isActive: g.status === 'active',
      }));
    } catch (error) {
      this.logger.error('Failed to fetch Pragmatic Play games', error);
      return [];
    }
  }

  async getLaunchUrl(externalGameId: string, params: GameLaunchParams): Promise<string> {
    const body = {
      casinoName: this.casinoName,
      secureLogin: this.secretKey,
      gameId: externalGameId,
      playerId: params.userId,
      currency: params.currency || 'USDT',
      mode: params.mode === 'demo' ? 'fun' : 'real',
      language: params.language || 'en',
      lobbyUrl: params.returnUrl || '',
      sessionToken: params.sessionToken,
    };

    try {
      const response = await fetch(`${this.apiUrl}/IntegrationService/v3/game/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Pragmatic Play launch URL error: ${response.status}`);
      }

      const data = await response.json();
      return data.gameURL || data.launchUrl || '';
    } catch (error) {
      this.logger.error('Failed to get Pragmatic Play launch URL', error);
      throw error;
    }
  }

  validateWebhook(payload: any, signature: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload);
      return expectedSignature === signature;
    } catch {
      return false;
    }
  }

  parseTransaction(payload: any): ProviderTransaction {
    return {
      externalId: payload.transactionId || payload.roundId,
      type: this.mapTransactionType(payload.type),
      amount: Math.abs(Number(payload.amount || 0)),
      currency: payload.currency || 'USDT',
      gameId: payload.gameId || payload.gameID,
      playerId: payload.playerId,
      roundId: payload.roundId,
      timestamp: new Date(payload.timestamp || Date.now()),
    };
  }

  async getBalance(playerId: string): Promise<number> {
    // Pragmatic Play uses our wallet, so this is handled internally
    return 0;
  }

  private generateSignature(payload: any): string {
    const crypto = require('crypto');
    const data = JSON.stringify(payload) + this.secretKey;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private mapCategory(category: string): string {
    const mapping: Record<string, string> = {
      slots: 'SLOTS',
      table: 'TABLE',
      live: 'LIVE',
      crash: 'CRASH',
      keno: 'KENO',
      lottery: 'LOTTERY',
      dice: 'DICE',
      plinko: 'PLINKO',
    };
    return mapping[category?.toLowerCase()] || 'SLOTS';
  }

  private mapTransactionType(type: string): 'bet' | 'win' | 'refund' | 'rollback' {
    const mapping: Record<string, 'bet' | 'win' | 'refund' | 'rollback'> = {
      bet: 'bet',
      win: 'win',
      refund: 'refund',
      rollback: 'rollback',
      debit: 'bet',
      credit: 'win',
    };
    return mapping[type?.toLowerCase()] || 'bet';
  }
}
