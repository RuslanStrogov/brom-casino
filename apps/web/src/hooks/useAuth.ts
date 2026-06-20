'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export function useAuth() {
  const { user, isAuthenticated, token, refreshToken, setUser, setTokens, logout: storeLogout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(email, password);
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      connectSocket(data.accessToken);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setTokens, setUser]);

  const register = useCallback(async (email: string, password: string, username?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.register(email, password, username);
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      connectSocket(data.accessToken);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setTokens, setUser]);

  const logout = useCallback(async () => {
    try {
      if (token) await api.logout(token);
    } catch { /* ignore */ }
    disconnectSocket();
    storeLogout();
  }, [token, storeLogout]);

  const loadProfile = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await api.getProfile(token);
      setUser(profile as any);
    } catch {
      storeLogout();
    }
  }, [token, setUser, storeLogout]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    loadProfile,
  };
}
