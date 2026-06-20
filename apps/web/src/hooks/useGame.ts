'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useBalance } from './useBalance';
import { useAuthStore } from '@/stores/authStore';
import { useSocketEvent } from '@/lib/socket';

interface GameConfig {
  name: string;
  minBet: number;
  maxBet: number;
}

export function useGame(config: GameConfig) {
  const { isAuthenticated, token } = useAuthStore();
  const { balance, subtractBalance, addBalance } = useBalance();
  const { gameHistory, addGameResult, setIsPlaying } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for server-side game results
  useSocketEvent('game:result', (data: any) => {
    if (data.game === config.name) {
      if (data.winAmount > 0) {
        addBalance(data.winAmount);
      }
      addGameResult({
        id: data.id || crypto.randomUUID(),
        game: config.name,
        bet: data.betAmount,
        winAmount: data.winAmount,
        multiplier: data.multiplier,
        result: data.result,
        timestamp: Date.now(),
      });
      setLoading(false);
      setIsPlaying(false);
    }
  });

  useSocketEvent('game:error', (data: any) => {
    setError(data.message);
    setLoading(false);
    setIsPlaying(false);
  });

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
    subtractBalance(bet);
    setIsPlaying(true);

    try {
      // Emit game:spin via socket (handled by GameProvider)
      const socket = (window as any).__brom_socket;
      if (socket) {
        socket.emit('game:spin', {
          game: config.name,
          betAmount: bet,
          clientSeed: gameData?.clientSeed,
          ...gameData,
        });
      } else {
        // Fallback: simulate locally if no socket
        const result = await simulateGame(config.name, gameData);
        if (result.winAmount > 0) {
          addBalance(result.winAmount);
        }
        addGameResult({
          id: crypto.randomUUID(),
          game: config.name,
          bet,
          winAmount: result.winAmount,
          result: result.data,
          timestamp: Date.now(),
        });
        setLoading(false);
        setIsPlaying(false);
        return result;
      }

      return { pending: true };
    } catch (err: any) {
      setError(err.message);
      addBalance(bet); // Refund
      setLoading(false);
      setIsPlaying(false);
      return null;
    }
  }, [isAuthenticated, token, balance, config, subtractBalance, addBalance, addGameResult, setIsPlaying]);

  return {
    play,
    loading,
    error,
    gameHistory: gameHistory.filter(g => g.game === config.name),
    clearError: () => setError(null),
  };
}

// Client-side simulation fallback
async function simulateGame(gameName: string, _data?: any): Promise<{ winAmount: number; data: any }> {
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
      const result = Math.floor(Math.random() * 10000) / 100;
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
