'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useBalance } from './useBalance';
import { useAuthStore } from '@/stores/authStore';

interface GameConfig {
  name: string;
  minBet: number;
  maxBet: number;
}

export function useGame(config: GameConfig) {
  const { isAuthenticated } = useAuthStore();
  const { balance, setBalance } = useBalance();
  const { gameHistory, addGameResult, currentGame, setCurrentGame } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const play = useCallback(async (bet: number, gameData?: any) => {
    if (!isAuthenticated) {
      setError('Please login to play');
      return null;
    }

    if (bet < config.minBet || bet > config.maxBet) {
      setError(`Bet must be between ${config.minBet} and ${config.maxBet}`);
      return null;
    }

    if (bet > balance) {
      setError('Insufficient balance');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Deduct bet
      const newBalance = balance - bet;
      setBalance(newBalance);

      // Simulate game result (in real app, this would be an API call)
      const result = await simulateGame(config.name, gameData);

      // Update balance if won
      if (result.winAmount > 0) {
        setBalance(newBalance + result.winAmount);
      }

      // Add to history
      addGameResult({
        game: config.name,
        bet,
        result: result.data,
        winAmount: result.winAmount,
        timestamp: Date.now(),
      });

      return result;
    } catch (err: any) {
      setError(err.message);
      // Refund bet on error
      setBalance(balance);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, balance, config, setBalance, addGameResult]);

  return {
    play,
    loading,
    error,
    gameHistory: gameHistory.filter(g => g.game === config.name),
    currentGame,
    setCurrentGame,
    clearError: () => setError(null),
  };
}

// Simulate game results (client-side for demo)
async function simulateGame(gameName: string, _data?: any): Promise<{ winAmount: number; data: any }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  switch (gameName) {
    case 'slots': {
      const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐', '🔔'];
      const reels = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ];
      let winAmount = 0;
      if (reels[0] === reels[1] && reels[1] === reels[2]) {
        const values: Record<string, number> = { '💎': 50, '7️⃣': 30, '⭐': 20, '🔔': 15, '🍇': 10, '🍊': 8, '🍋': 5, '🍒': 3 };
        winAmount = values[reels[0]] || 10;
      }
      return { winAmount, data: { reels } };
    }

    case 'crash': {
      const crashPoint = Math.max(1, 0.99 / (1 - Math.random()));
      return { winAmount: 0, data: { crashPoint: Math.min(crashPoint, 100) } };
    }

    case 'dice': {
      const result = Math.floor(Math.random() * 100) + 1;
      return { winAmount: 0, data: { result } };
    }

    case 'plinko': {
      const multipliers = [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6];
      const slot = Math.floor(Math.random() * multipliers.length);
      return { winAmount: multipliers[slot], data: { slot, multiplier: multipliers[slot] } };
    }

    default:
      return { winAmount: 0, data: {} };
  }
}
