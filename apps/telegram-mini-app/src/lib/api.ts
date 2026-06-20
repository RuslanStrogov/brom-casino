import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.brom-casino.com';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('brom_casino_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          token: localStorage.getItem('brom_casino_token'),
        });

        const { token } = refreshResponse.data;
        localStorage.setItem('brom_casino_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        return api(originalRequest);
      } catch {
        // Refresh failed, clear auth
        localStorage.removeItem('brom_casino_token');
        delete api.defaults.headers.common['Authorization'];
        window.location.reload();
      }
    }

    return Promise.reject(error);
  }
);

// API helper methods
export const apiClient = {
  // Auth
  auth: {
    telegram: (data: { initData: string; initDataUnsafe: Record<string, unknown> }) =>
      api.post('/auth/telegram', data),
    refresh: () => api.post('/auth/refresh'),
    logout: () => api.post('/auth/logout'),
  },

  // User
  user: {
    getProfile: () => api.get('/user/profile'),
    getBalance: () => api.get('/user/balance'),
    getStats: () => api.get('/user/stats'),
    updateProfile: (data: Record<string, unknown>) => api.patch('/user/profile', data),
  },

  // Games
  games: {
    list: () => api.get('/games'),
    getById: (id: string) => api.get(`/games/${id}`),
    getHistory: (params?: { limit?: number; offset?: number }) =>
      api.get('/games/history', { params }),
  },

  // Slots
  slots: {
    spin: (data: { gameId: string; bet: number }) =>
      api.post('/games/slot/spin', data),
    getHistory: () => api.get('/games/slot/history'),
  },

  // Crash
  crash: {
    placeBet: (data: { gameId: string; bet: number; autoCashout?: number }) =>
      api.post('/games/crash/bet', data),
    cashout: (data: { roundId: string }) =>
      api.post('/games/crash/cashout', data),
    getHistory: () => api.get('/games/crash/history'),
    getCurrentRound: () => api.get('/games/crash/current'),
  },

  // Wallet
  wallet: {
    getDepositAddress: () => api.get('/wallet/deposit-address'),
    withdraw: (data: { amount: number; address: string }) =>
      api.post('/wallet/withdraw', data),
    getTransactions: (params?: { limit?: number; offset?: number; type?: string }) =>
      api.get('/wallet/transactions', { params }),
  },

  // Bonuses
  bonuses: {
    list: () => api.get('/bonuses'),
    claim: (bonusId: string) => api.post(`/bonuses/${bonusId}/claim`),
    getWageringProgress: () => api.get('/bonuses/wagering'),
  },

  // Leaderboard
  leaderboard: {
    get: (period: 'daily' | 'weekly' | 'monthly' = 'weekly') =>
      api.get('/leaderboard', { params: { period } },
    ),
  },
};

export default api;
