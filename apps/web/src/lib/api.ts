const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: unknown }>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    }),

  register: (username: string, password: string) =>
    request<{ token: string; user: unknown }>('/api/auth/register', {
      method: 'POST',
      body: { username, password },
    }),

  // User
  getProfile: (token: string) =>
    request<unknown>('/api/user/profile', { token }),

  getBalance: (token: string) =>
    request<{ balance: number }>('/api/user/balance', { token }),

  // Games
  placeBet: (token: string, game: string, amount: number, data?: unknown) =>
    request<{ result: unknown; balance: number }>('/api/games/bet', {
      method: 'POST',
      token,
      body: { game, amount, ...data },
    }),

  // Provably Fair
  getServerSeed: (token: string) =>
    request<{ seed: string; hash: string }>('/api/fair/seed', { token }),

  verifyResult: (token: string, serverSeed: string, clientSeed: string, nonce: number) =>
    request<{ result: number; valid: boolean }>('/api/fair/verify', {
      method: 'POST',
      token,
      body: { serverSeed, clientSeed, nonce },
    }),

  // Leaderboard
  getLeaderboard: () =>
    request<unknown[]>('/api/leaderboard'),

  // Transactions
  getTransactions: (token: string, limit = 20) =>
    request<unknown[]>(`/api/user/transactions?limit=${limit}`, { token }),

  // Deposit/Withdraw
  deposit: (token: string, amount: number, address: string) =>
    request<{ txid: string }>('/api/wallet/deposit', {
      method: 'POST',
      token,
      body: { amount, address },
    }),

  withdraw: (token: string, amount: number, address: string) =>
    request<{ txid: string }>('/api/wallet/withdraw', {
      method: 'POST',
      token,
      body: { amount, address },
    }),
};
