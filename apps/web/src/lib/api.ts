const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface User {
  id: string;
  email?: string;
  username?: string;
  role: string;
  balance: number;
  currency: string;
  vipLevel: number;
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  provider: string;
  category: string;
  rtp?: number;
  thumbnail?: string;
  isEnabled: boolean;
  isFeatured: boolean;
}

export interface GameResult {
  id: string;
  gameId: string;
  betAmount: number;
  winAmount: number;
  multiplier?: number;
  result?: Record<string, unknown>;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface ProvablyFairSeed {
  serverHash: string;
  clientSeed: string;
  nonce: number;
}

export const api = {
  // ===== Auth =====
  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  register: (email: string, password: string, username?: string, referralCode?: string) =>
    request<{ accessToken: string; refreshToken: string; user: User }>('/auth/register', {
      method: 'POST',
      body: { email, password, username, referralCode },
    }),

  registerByPhone: (phone: string, password: string, username?: string) =>
    request<{ accessToken: string; refreshToken: string; user: User }>('/auth/register', {
      method: 'POST',
      body: { phone, password, username },
    }),

  loginByPhone: (phone: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { phone, password },
    }),

  telegramAuth: (data: { telegramId: string; username?: string; firstName?: string }) =>
    request<{ accessToken: string; refreshToken: string; user: User }>('/auth/telegram', {
      method: 'POST',
      body: data,
    }),

  refreshToken: (refreshToken: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),

  logout: (token: string) =>
    request<void>('/auth/logout', { method: 'POST', token }),

  // ===== Users =====
  getProfile: (token: string) =>
    request<User>('/users/me', { token }),

  updateProfile: (token: string, data: { username?: string }) =>
    request<User>('/users/me', { method: 'PATCH', token, body: data }),

  // ===== Games =====
  getGames: (token: string | undefined, params?: { category?: string; provider?: string; limit?: number; offset?: number }) => {
    const search = new URLSearchParams();
    if (params?.category) search.set('category', params.category);
    if (params?.provider) search.set('provider', params.provider);
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.offset) search.set('offset', String(params.offset));
    const qs = search.toString() ? `?${search.toString()}` : '';
    return request<{ games: Game[]; total: number }>(`/games${qs}`, { token });
  },

  getGameBySlug: (token: string, slug: string) =>
    request<Game>(`/games/${slug}`, { token }),

  launchGame: (token: string, slug: string) =>
    request<{ sessionToken: string; mode: string; launchUrl?: string; serverHash?: string; clientSeed?: string; game: any }>(`/games/${slug}/launch`, { method: 'POST', token }),

  // ===== Wallet =====
  getWallet: (token: string) =>
    request<{ id: string; userId: string; balance: number; bonusBalance: number; currency: string; createdAt: string }>('/wallet', { token }).then(w => ({
      ...w,
      balance: Number(w.balance) || 0,
      bonusBalance: Number(w.bonusBalance) || 0,
    })),

  getBalance: (token: string) =>
    request<{ balance: number; currency: string; bonusBalance: number }>('/wallet', { token }).then(w => ({
      balance: Number(w.balance) || 0,
      currency: w.currency,
      bonusBalance: Number(w.bonusBalance) || 0,
    })),

  getTransactions: (token: string, params?: { page?: number; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    const qs = search.toString() ? `?${search.toString()}` : '';
    return request<{ transactions: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(`/payments/transactions${qs}`, { token });
  },

  transferBalance: (token: string, from: 'real' | 'bonus', to: 'real' | 'bonus', amount: string) =>
    request<{ balance: number; bonusBalance: number }>('/wallet/transfer', {
      method: 'POST', token, body: { from, to, amount },
    }),

  // ===== Payments =====
  createDeposit: (token: string, amount: string, currency?: string, paymentMethod?: string, extra?: Record<string, any>) =>
    request<{ depositId: string; amount: number; currency: string; paymentUrl: string; expiresAt: string; status: string; bankName?: string; fiatCurrency?: string }>(
      '/payments/deposits',
      { method: 'POST', token, body: { amount, currency, paymentMethod, ...extra } }
    ),

  getDeposits: (token: string, params?: { page?: number; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    const qs = search.toString() ? `?${search.toString()}` : '';
    return request<{ deposits: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(`/payments/deposits${qs}`, { token });
  },

  requestWithdrawal: (token: string, amount: string, destination: string, currency?: string, paymentMethod?: string) =>
    request<{ withdrawalId: string; amount: number; currency: string; destination: string; status: string; estimatedArrival: string }>(
      '/payments/withdrawals',
      { method: 'POST', token, body: { amount, destination, currency, paymentMethod } }
    ),

  getWithdrawals: (token: string, params?: { page?: number; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    const qs = search.toString() ? `?${search.toString()}` : '';
    return request<{ withdrawals: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(`/payments/withdrawals${qs}`, { token });
  },

  getPaymentMethods: (token: string) =>
    request<{
      crypto: Array<{ id: string; name: string; icon: string; currencies: string[]; min: number; max: number; fee: number }>;
      fiat: Array<{ id: string; name: string; icon: string; min: number; max: number; fee: number; currencies: string[] }>;
      banks: Array<{ id: string; name: string; icon: string }>;
      presets: number[];
      limits: { min: number; max: number };
      commission: number;
    }>('/payments/methods', { token }),

  // ===== Bonuses =====
  getBonuses: (token: string) =>
    request<{ bonuses: Array<{ id: string; name: string; type: string; status: string; wageringProgress: number; wageringTarget: number }> }>(
      '/bonuses',
      { token }
    ),

  claimBonus: (token: string, bonusId: string) =>
    request<{ success: boolean; balance: number }>(`/bonuses/${bonusId}/claim`, { method: 'POST', token }),

  // ===== Provably Fair =====
  getServerSeed: (token: string) =>
    request<{ serverHash: string }>('/provably-fair/seed', { token }),

  verifyResult: (token: string, serverSeed: string, clientSeed: string, nonce: number) =>
    request<{ result: number; hash: string; valid: boolean }>('/provably-fair/verify', {
      method: 'POST',
      token,
      body: { serverSeed, clientSeed, nonce },
    }),

  // ===== Admin =====
  adminGetStats: (token: string) =>
    request<{
      totalUsers: number;
      activeUsers: number;
      totalDeposits: number;
      totalWithdrawals: number;
      ggr: number;
      ngr: number;
    }>('/admin/stats', { token }),

  adminGetUsers: (token: string, params?: { limit?: number; offset?: number; search?: string }) => {
    const search = new URLSearchParams();
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.offset) search.set('offset', String(params.offset));
    if (params?.search) search.set('search', params.search);
    const qs = search.toString() ? `?${search.toString()}` : '';
    return request<{ users: User[]; total: number }>(`/admin/users${qs}`, { token });
  },
};
