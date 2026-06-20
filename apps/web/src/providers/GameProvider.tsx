'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getSocket } from '@/lib/socket';

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, updateBalance } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  const listenersAttached = useRef(false);

  useEffect(() => {
    setInitialized(true);
  }, []);

  // Attach socket listeners once
  useEffect(() => {
    if (listenersAttached.current) return;
    listenersAttached.current = true;

    const socket = getSocket();

    socket.on('game:result', (data: any) => {
      if (data.winAmount > 0 && data.balance !== undefined) {
        updateBalance(data.balance);
      }
    });

    socket.on('balance:update', (data: any) => {
      if (data.balance !== undefined) {
        updateBalance(data.balance);
      }
    });

    socket.on('crash:tick', (_data: any) => {
      // Handled by CrashGame component
    });

    socket.on('crash:result', (_data: any) => {
      // Handled by CrashGame component
    });

    return () => {
      socket.off('game:result');
      socket.off('balance:update');
      socket.off('crash:tick');
      socket.off('crash:result');
    };
  }, [updateBalance]);

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
