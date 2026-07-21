import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_SECRET_KEY = process.env.API_SECRET_KEY || '';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_SECRET_KEY,
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token from cookies/session
    if (typeof window !== 'undefined') {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('admin_token='))
        ?.split('=')[1];

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add API secret for server-side requests
    if (API_SECRET_KEY) {
      config.headers['X-API-Key'] = API_SECRET_KEY;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }

    if (error.response?.status === 403) {
      console.error('Admin access forbidden');
    }

    return Promise.reject(error);
  }
);

// Admin API methods — mapped to actual backend endpoints
export const adminApi = {
  // Dashboard
  dashboard: {
    getStats: () => api.get('/admin/dashboard'),
  },

  // Users
  users: {
    list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
      api.get('/admin/users', { params }),
    getById: (id: string) => api.get(`/admin/users/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      api.patch(`/admin/users/${id}`, data),
    adjustBalance: (id: string, amount: number, reason: string) =>
      api.patch(`/admin/users/${id}/balance`, { amount: String(amount), reason, type: 'credit' }),
  },

  // Games
  games: {
    list: (params?: { page?: number; limit?: number }) =>
      api.get('/admin/games', { params }),
    getById: (id: string) => api.get(`/admin/games/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      api.patch(`/admin/games/${id}`, data),
    sync: () => api.post('/admin/games/sync'),
  },

  // Transactions (via deposits/withdrawals endpoints)
  transactions: {
    list: () => api.get('/admin/deposits/pending'), // simplified — returns pending deposits
    getPendingDeposits: () => api.get('/admin/deposits/pending'),
    getPendingWithdrawals: () => api.get('/admin/withdrawals/pending'),
    processWithdrawal: (id: string, action: 'approve' | 'reject', notes?: string) =>
      api.post(`/admin/withdrawals/${id}/process`, { action, notes }),
  },

  // Audit logs
  audit: {
    list: (params?: { page?: number; limit?: number; action?: string; userId?: string }) =>
      api.get('/admin/audit-logs', { params }),
  },

  // Reports
  reports: {
    getRevenue: (params?: { from?: string; to?: string }) =>
      api.get('/admin/reports/revenue', { params }),
    getGames: () => api.get('/admin/reports/games'),
  },
};

export default api;
