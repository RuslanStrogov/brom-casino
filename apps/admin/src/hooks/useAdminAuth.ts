import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  permissions: string[];
  avatar?: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    // Return a default implementation if not in provider
    return useAdminAuthStandalone();
  }
  return context;
}

function useAdminAuthStandalone() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setAdmin(response.data.admin);
    } catch {
      // Check for stored token
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('admin_user');
        if (stored) {
          try {
            setAdmin(JSON.parse(stored));
          } catch {
            localStorage.removeItem('admin_user');
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { admin: adminData, token } = response.data;

      if (typeof window !== 'undefined') {
        document.cookie = `admin_token=${token}; path=/; max-age=86400; secure; samesite=strict`;
        localStorage.setItem('admin_user', JSON.stringify(adminData));
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAdmin(adminData);
    } catch (error: any) {
      // Development fallback
      if (process.env.NODE_ENV === 'development') {
        const mockAdmin: AdminUser = {
          id: 1,
          email,
          name: 'Admin',
          role: 'super_admin',
          permissions: ['*'],
        };
        const mockToken = 'dev_admin_token_' + Date.now();

        if (typeof window !== 'undefined') {
          document.cookie = `admin_token=${mockToken}; path=/; max-age=86400`;
          localStorage.setItem('admin_user', JSON.stringify(mockAdmin));
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
        setAdmin(mockAdmin);
        return;
      }

      throw new Error(error?.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      if (typeof window !== 'undefined') {
        document.cookie = 'admin_token=; path=/; max-age=0';
        localStorage.removeItem('admin_user');
      }
      delete api.defaults.headers.common['Authorization'];
      setAdmin(null);
      router.push('/login');
    }
  }, [router]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!admin) return false;
      if (admin.permissions.includes('*')) return true;
      return admin.permissions.includes(permission);
    },
    [admin]
  );

  return {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    login,
    logout,
    hasPermission,
  };
}

// Auth guard hook
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}

// Permission guard hook
export function useRequirePermission(permission: string) {
  const { hasPermission, isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasPermission(permission)) {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, isLoading, hasPermission, permission, router]);

  return { hasPermission: hasPermission(permission), isAuthenticated, isLoading };
}

export default useAdminAuth;
