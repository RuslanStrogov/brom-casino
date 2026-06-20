import { Injectable, Logger } from '@nestjs/common';
import { GameSession, SessionStatus } from '../entities/game-session.entity';
import { GameResult, GameType } from '../entities/game-result.entity';

@Injectable()
export class SessionManager {
  private readonly logger = new Logger(SessionManager.name);
  private readonly sessions: Map<string, GameSession> = new Map();
  private readonly userSessions: Map<string, string> = new Map(); // userId -> sessionId
  private readonly results: Map<string, GameResult[]> = new Map(); // sessionId -> results
  private readonly userBalances: Map<string, number> = new Map(); // userId -> balance

  /** Create a new game session */
  createSession(
    userId: string,
    username: string,
    gameType: string,
    clientSeed: string,
    serverHash: string,
  ): GameSession {
    // Close any existing session for this user
    const existingSessionId = this.userSessions.get(userId);
    if (existingSessionId) {
      const existing = this.sessions.get(existingSessionId);
      if (existing && existing.status === SessionStatus.ACTIVE) {
        existing.complete();
        this.logger.log(`Closed existing session ${existingSessionId} for user ${userId}`);
      }
    }

    const session = new GameSession({
      userId,
      username,
      gameType,
      clientSeed,
      serverHash,
    });

    this.sessions.set(session.id, session);
    this.userSessions.set(userId, session.id);
    this.results.set(session.id, []);

    // Initialize balance if not set
    if (!this.userBalances.has(userId)) {
      this.userBalances.set(userId, 1000); // Starting balance
    }

    this.logger.log(`Created session ${session.id} for user ${userId} (${username}) — game: ${gameType}`);
    return session;
  }

  /** Get session by ID */
  getSession(sessionId: string): GameSession | undefined {
    return this.sessions.get(sessionId);
  }

  /** Get active session for a user */
  getUserSession(userId: string): GameSession | undefined {
    const sessionId = this.userSessions.get(userId);
    if (!sessionId) return undefined;
    const session = this.sessions.get(sessionId);
    if (session && session.status === SessionStatus.ACTIVE) return session;
    return undefined;
  }

  /** Record a game result */
  recordResult(result: GameResult): void {
    const sessionResults = this.results.get(result.sessionId);
    if (sessionResults) {
      sessionResults.push(result);
    }

    const session = this.sessions.get(result.sessionId);
    if (session) {
      session.addBet(result.betAmount);
      session.addWin(result.winAmount);
      session.incrementSpinCount();
    }

    // Update balance
    const currentBalance = this.userBalances.get(result.userId) || 0;
    const newBalance = currentBalance - result.betAmount + result.winAmount;
    this.userBalances.set(result.userId, Math.max(0, newBalance));
  }

  /** Get balance for a user */
  getBalance(userId: string): number {
    return this.userBalances.get(userId) || 0;
  }

  /** Set balance for a user */
  setBalance(userId: string, balance: number): void {
    this.userBalances.set(userId, Math.max(0, balance));
  }

  /** Add to balance (e.g. deposit) */
  addBalance(userId: string, amount: number): number {
    const current = this.userBalances.get(userId) || 0;
    const newBalance = current + amount;
    this.userBalances.set(userId, newBalance);
    return newBalance;
  }

  /** Deduct from balance (e.g. withdrawal) */
  deductBalance(userId: string, amount: number): { success: boolean; balance: number } {
    const current = this.userBalances.get(userId) || 0;
    if (current < amount) {
      return { success: false, balance: current };
    }
    const newBalance = current - amount;
    this.userBalances.set(userId, newBalance);
    return { success: true, balance: newBalance };
  }

  /** Get results for a session */
  getSessionResults(sessionId: string): GameResult[] {
    return this.results.get(sessionId) || [];
  }

  /** Get all-time results for a user */
  getUserResults(userId: string): GameResult[] {
    const allResults: GameResult[] = [];
    for (const [sessionId, results] of this.results.entries()) {
      const session = this.sessions.get(sessionId);
      if (session && session.userId === userId) {
        allResults.push(...results);
      }
    }
    return allResults;
  }

  /** Get leaderboard — top users by total winnings */
  getLeaderboard(limit: number = 10): { userId: string; username: string; totalWin: number; totalBet: number; profit: number }[] {
    const stats: Map<string, { username: string; totalWin: number; totalBet: number }> = new Map();

    for (const [sessionId, results] of this.results.entries()) {
      const session = this.sessions.get(sessionId);
      if (!session) continue;

      for (const result of results) {
        const existing = stats.get(result.userId);
        if (existing) {
          existing.totalWin += result.winAmount;
          existing.totalBet += result.betAmount;
        } else {
          stats.set(result.userId, {
            username: session.username,
            totalWin: result.winAmount,
            totalBet: result.betAmount,
          });
        }
      }
    }

    return Array.from(stats.entries())
      .map(([userId, data]) => ({
        userId,
        username: data.username,
        totalWin: data.totalWin,
        totalBet: data.totalBet,
        profit: data.totalWin - data.totalBet,
      }))
      .sort((a, b) => b.totalWin - a.totalWin)
      .slice(0, limit);
  }

  /** Get recent results across all sessions (for history) */
  getRecentResults(limit: number = 20): GameResult[] {
    const all: GameResult[] = [];
    for (const results of this.results.values()) {
      all.push(...results);
    }
    return all
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /** Get active sessions count */
  getActiveSessionsCount(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.status === SessionStatus.ACTIVE) count++;
    }
    return count;
  }

  /** Clean up expired sessions */
  cleanupExpiredSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.createdAt.getTime() > maxAgeMs) {
        session.status = SessionStatus.EXPIRED;
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired sessions`);
    }
    return cleaned;
  }
}
