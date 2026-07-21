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
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }

    if (error.response?.status === 403) {
      console.error('Admin access forbidden');
    }

    return Promise.reject(error);
  }
);

// Admin API methods
export const adminApi = {
  // Dashboard
  dashboard: {
    getStats: () => api.get('/admin/dashboard/stats'),
    getRevenueChart: (period: 'day' | 'week' | 'month' = 'week') =>
      api.get('/admin/dashboard/revenue', { params: { period } }),
    getActivity: () => api.get('/admin/dashboard/activity'),
  },

  // Users
  users: {
    list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
      api.get('/admin/users', { params }),
    getById: (id: number) => api.get(`/admin/users/${id}`),
    update: (id: number, data: Record<string, unknown>) =>
      api.patch(`/admin/users/${id}`, data),
    ban: (id: number, reason: string) =>
      api.post(`/admin/users/${id}/ban`, { reason }),
    unban: (id: number) => api.post(`/admin/users/${id}/unban`),
    suspend: (id: number, duration: number, reason: string) =>
      api.post(`/admin/users/${id}/suspend`, { duration, reason }),
    getTransactions: (id: number) => api.get(`/admin/users/${id}/transactions`),
    getGameHistory: (id: number) => api.get(`/admin/users/${id}/game-history`),
    adjustBalance: (id: number, amount: number, reason: string) =>
      api.post(`/admin/users/${id}/adjust-balance`, { amount, reason }),
  },

  // Games
  games: {
    list: () => api.get('/admin/games'),
    getById: (id: string) => api.get(`/admin/games/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      api.patch(`/admin/games/${id}`, data),
    create: (data: Record<string, unknown>) => api.post('/admin/games', data),
    delete: (id: string) => api.delete(`/admin/games/${id}`),
    getStats: (id: string) => api.get(`/admin/games/${id}/stats`),
    setRtp: (id: string, rtp: number) =>
      api.post(`/admin/games/${id}/rtp`, { rtp }),
  },

  // Transactions
  transactions: {
    list: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
      api.get('/admin/transactions', { params }),
    getById: (id: string) => api.get(`/admin/transactions/${id}`),
    approveWithdrawal: (id: string) =>
      api.post(`/admin/transactions/${id}/approve`),
    rejectWithdrawal: (id: string, reason: string) =>
      api.post(`/admin/transactions/${id}/reject`, { reason }),
    processDeposit: (id: string) =>
      api.post(`/admin/transactions/${id}/process`),
  },

  // Bonuses
  bonuses: {
    list: () => api.get('/admin/bonuses'),
    create: (data: Record<string, unknown>) => api.post('/admin/bonuses', data),
    update: (id: string, data: Record<string, unknown>) =>
      api.patch(`/admin/bonuses/${id}`, data),
    delete: (id: string) => api.delete(`/admin/bonuses/${id}`),
    toggle: (id: string) => api.post(`/admin/bonuses/${id}/toggle`),
    getClaims: (id: string) => api.get(`/admin/bonuses/${id}/claims`),
  },

  // KYC
  kyc: {
    list: (params?: { status?: string; risk?: string }) =>
      api.get('/admin/kyc', { params }),
    getById: (id: string) => api.get(`/admin/kyc/${id}`),
    approve: (id: string) => api.post(`/admin/kyc/${id}/approve`),
    reject: (id: string, reason: string) =>
      api.post(`/admin/kyc/${id}/reject`, { reason }),
    requestMoreInfo: (id: string, message: string) =>
      api.post(`/admin/kyc/${id}/request-info`, { message }),
  },

  // Wallets
  wallets: {
    getHotWallet: () => api.get('/admin/wallets/hot'),
    getColdWallet: () => api.get('/admin/wallets/cold'),
    getBalance: () => api.get('/admin/wallets/balance'),
    transfer: (data: { from: string; to: string; amount: number }) =>
      api.post('/admin/wallets/transfer', data),
    getPendingWithdrawals: () => api.get('/admin/wallets/pending-withdrawals'),
  },

  // Reports
  reports: {
    getFinancial: (params: { from: string; to: string }) =>
      api.get('/admin/reports/financial', { params }),
    getUserActivity: (params: { from: string; to: string }) =>
      api.get('/admin/reports/user-activity', { params }),
    getGamePerformance: (params: { from: string; to: string }) =>
      api.get('/admin/reports/game-performance', { params }),
    export: (type: string, params: Record<string, string>) =>
      api.get(`/admin/reports/export/${type}`, { params, responseType: 'blob' }),
  },

  // Settings
  settings: {
    get: () => api.get('/admin/settings'),
    update: (data: Record<string, unknown>) => api.patch('/admin/settings', data),
    getGameSettings: () => api.get('/admin/settings/games'),
    updateGameSettings: (data: Record<string, unknown>) =>
      api.patch('/admin/settings/games', data),
  },
};

export default api;
