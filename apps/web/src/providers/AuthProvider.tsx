'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { api } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token, setUser, setTokens, logout: storeLogout } = useAuthStore();

  useEffect(() => {
    // Try to restore session on mount
    const storedToken = useAuthStore.getState().token;
    const storedRefresh = useAuthStore.getState().refreshToken;

    if (storedToken) {
      connectSocket(storedToken);

      // Refresh profile
      api.getProfile(storedToken)
        .then((profile) => setUser(profile as any))
        .catch(() => {
          // Try refresh token
          if (storedRefresh) {
            api.refreshToken(storedRefresh)
              .then((data) => {
                setTokens(data.accessToken, data.refreshToken);
                connectSocket(data.accessToken);
              })
              .catch(() => storeLogout());
          } else {
            storeLogout();
          }
        });
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, token]);

  return <>{children}</>;
}
