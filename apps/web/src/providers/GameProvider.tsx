'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSocketEvent, BalanceUpdate, GameResult } from '@/lib/socket';

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  // Listen for game results via socket
  useSocketEvent('game:result', (data: GameResult) => {
    // Game results are handled by individual game components
    console.log('Game result received:', data);
  });

  // Listen for balance updates
  useSocketEvent('balance:update', (data: BalanceUpdate) => {
    // Balance updates are handled by useBalance hook
    console.log('Balance update received:', data);
  });

  // Listen for crash game updates
  useSocketEvent('crash:update', (data: any) => {
    console.log('Crash update:', data);
  });

  // Listen for leaderboard updates
  useSocketEvent('leaderboard:update', (data: any) => {
    console.log('Leaderboard update:', data);
  });

  useEffect(() => {
    setInitialized(true);
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-casino-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🎰</div>
          <div className="text-casino-gold font-bold text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
