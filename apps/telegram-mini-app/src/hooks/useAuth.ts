import { useState, useEffect, useCallback } from 'react';
import { useTelegram } from './useTelegram';
import { api } from '../lib/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: {
    id: number;
    telegramId: number;
    username: string;
    firstName: string;
    lastName?: string;
    photoUrl?: string;
    isNewUser: boolean;
  } | null;
}

export function useAuth() {
  const { initData, initDataUnsafe, isReady, showAlert } = useTelegram();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    user: null,
  });

  const authenticate = useCallback(async () => {
    if (!isReady) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // In production, send initData to backend for verification
      const response = await api.post('/auth/telegram', {
        initData: initData || '',
        initDataUnsafe: initDataUnsafe || {},
      });

      const { token, user } = response.data;

      // Store token
      localStorage.setItem('brom_casino_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setState({
        isAuthenticated: true,
        isLoading: false,
        token,
        user,
      });
    } catch (error: any) {
      console.error('Auth error:', error);

      // Development fallback - create mock auth
      if (process.env.NODE_ENV === 'development' || !initData) {
        const mockUser = {
          id: 1,
          telegramId: initDataUnsafe?.user?.id || 123456789,
          username: initDataUnsafe?.user?.username || 'player',
          firstName: initDataUnsafe?.user?.first_name || 'Player',
          lastName: initDataUnsafe?.user?.last_name || '',
          photoUrl: initDataUnsafe?.user?.photo_url || '',
          isNewUser: false,
        };

        const mockToken = 'dev_token_' + Date.now();
        localStorage.setItem('brom_casino_token', mockToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;

        setState({
          isAuthenticated: true,
          isLoading: false,
          token: mockToken,
          user: mockUser,
        });
        return;
      }

      setState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        user: null,
      });
    }
  }, [isReady, initData, initDataUnsafe]);

  useEffect(() => {
    // Check for existing token
    const existingToken = localStorage.getItem('brom_casino_token');
    if (existingToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
    }

    authenticate();
  }, [authenticate]);

  const logout = useCallback(() => {
    localStorage.removeItem('brom_casino_token');
    delete api.defaults.headers.common['Authorization'];
    setState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      user: null,
    });
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { token } = response.data;
      localStorage.setItem('brom_casino_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setState(prev => ({ ...prev, token }));
    } catch {
      logout();
    }
  }, [logout]);

  return {
    ...state,
    logout,
    refreshToken,
    authenticate,
  };
}
