'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { login as authLogin, register as authRegister, fetchProfile, clearAuth } from '@/lib/auth';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export function useAuth() {
  const { user, isAuthenticated, setUser, setAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authLogin(username, password);
      setUser(data.user);
      setAuthenticated(true);
      connectSocket(data.token);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUser, setAuthenticated]);

  const register = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authRegister(username, password);
      setUser(data.user);
      setAuthenticated(true);
      connectSocket(data.token);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUser, setAuthenticated]);

  const logout = useCallback(() => {
    clearAuth();
    disconnectSocket();
    setUser(null);
    setAuthenticated(false);
  }, [setUser, setAuthenticated]);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await fetchProfile();
      setUser(profile);
      setAuthenticated(true);
    } catch {
      clearAuth();
      setUser(null);
      setAuthenticated(false);
    }
  }, [setUser, setAuthenticated]);

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
