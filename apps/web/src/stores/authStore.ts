'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email?: string;
  username?: string;
  role: string;
  balance: number;
  currency: string;
  vipLevel: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  setTokens: (token: string, refreshToken: string) => void;
  setUser: (user: User | null) => void;
  updateBalance: (balance: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,

      setTokens: (token, refreshToken) => set({ token, refreshToken, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      updateBalance: (balance) => {
        const user = get().user;
        if (user) set({ user: { ...user, balance } });
      },

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          refreshToken: null,
        }),
    }),
    {
      name: 'brom-casino-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
