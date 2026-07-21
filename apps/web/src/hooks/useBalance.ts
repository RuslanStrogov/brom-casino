'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

export function useBalance() {
  const { isAuthenticated, token, updateBalance } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [currency, setCurrency] = useState('USDT');
  const [loading, setLoading] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    try {
      const data = await api.getBalance(token);
      setBalance(Number(data.balance) || 0);
      setBonusBalance(Number(data.bonusBalance) || 0);
      setCurrency(data.currency);
      updateBalance(Number(data.balance) || 0);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, updateBalance]);

  // Auto-refresh on auth
  useEffect(() => {
    if (isAuthenticated) {
      refreshBalance();
    } else {
      setBalance(0);
      setBonusBalance(0);
    }
  }, [isAuthenticated, refreshBalance]);

  const addBalance = useCallback((amount: number) => {
    setBalance(prev => {
      const newBal = prev + amount;
      updateBalance(newBal);
      return newBal;
    });
  }, [updateBalance]);

  const subtractBalance = useCallback((amount: number) => {
    setBalance(prev => {
      const newBal = Math.max(0, prev - amount);
      updateBalance(newBal);
      return newBal;
    });
  }, [updateBalance]);

  return {
    balance,
    bonusBalance,
    currency,
    loading,
    refreshBalance,
    addBalance,
    subtractBalance,
    setBalance,
  };
}
