'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSocketEvent } from '@/lib/socket';
import { BalanceUpdate } from '@/lib/socket';

const INITIAL_BALANCE = 100; // Starting balance for demo

export function useBalance() {
  const { isAuthenticated } = useAuthStore();
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [loading, setLoading] = useState(false);

  // Listen for balance updates via socket
  useSocketEvent('balance:update', (data: BalanceUpdate) => {
    setBalance(data.balance);
  });

  const refreshBalance = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      // In a real app, this would fetch from the API
      // const data = await api.fetchBalance();
      // setBalance(data.balance);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addBalance = useCallback((amount: number) => {
    setBalance(prev => prev + amount);
  }, []);

  const subtractBalance = useCallback((amount: number) => {
    setBalance(prev => Math.max(0, prev - amount));
  }, []);

  return {
    balance,
    setBalance,
    loading,
    refreshBalance,
    addBalance,
    subtractBalance,
  };
}
