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

  register: (email: string, password: string, username?: string) =>
    request<{ accessToken: string; refreshToken: string; user: User }>('/auth/register', {
      method: 'POST',
      body: { email, password, username },
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
  getGames: (token: string, params?: { category?: string; provider?: string; limit?: number; offset?: number }) => {
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
    request<{ game: Game; sessionToken: string }>(`/games/${slug}/launch`, { method: 'POST', token }),

  // ===== Wallet =====
  getBalance: (token: string) =>
    request<{ balance: number; currency: string; bonusBalance: number }>('/users/me/balance', { token }),

  getTransactions: (token: string, params?: { type?: string; limit?: number; offset?: number }) => {
    const search = new URLSearchParams();
    if (params?.type) search.set('type', params.type);
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.offset) search.set('offset', String(params.offset));
    const qs = search.toString() ? `?${search.toString()}` : '';
    return request<{ transactions: Transaction[]; total: number }>(`/users/me/transactions${qs}`, { token });
  },

  // ===== Payments =====
  createDeposit: (token: string, currency: string, amount?: number) =>
    request<{ invoiceId: string; address: string; amount: number; currency: string; expiresAt: string }>(
      '/payments/deposit',
      { method: 'POST', token, body: { currency, amount } }
    ),

  requestWithdrawal: (token: string, currency: string, amount: number, address: string) =>
    request<{ id: string; status: string; fee: number }>(
      '/payments/withdraw',
      { method: 'POST', token, body: { currency, amount, address } }
    ),

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
