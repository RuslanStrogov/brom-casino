'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getStoredToken } from '@/lib/auth';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setAuthenticated, setUser } = useAuthStore();

  useEffect(() => {
    // Check for existing auth on mount
    const token = getStoredToken();
    if (token && isAuthenticated) {
      connectSocket(token);
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const token = getStoredToken();
      if (token) {
        connectSocket(token);
      }
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  return <>{children}</>;
}
