const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://brombet.ru/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export async function adminFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOpts } = options;
  const token = getToken();

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    ...fetchOpts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOpts.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Dashboard
export const getDashboard = () => adminFetch('/admin/dashboard');

// Users
export const getUsers = (page = 1, limit = 20, status?: string, search?: string) =>
  adminFetch('/admin/users', { params: { page, limit, status, search } });

export const getUser = (id: string) => adminFetch(`/admin/users/${id}`);

export const adjustBalance = (userId: string, amount: string, reason: string, type: 'credit' | 'debit') =>
  adminFetch(`/admin/users/${userId}/balance`, {
    method: 'PATCH',
    body: JSON.stringify({ amount, reason, type }),
  });

// Payments
export const getPendingDeposits = () => adminFetch('/admin/deposits/pending');
export const getPendingWithdrawals = () => adminFetch('/admin/withdrawals/pending');
export const processWithdrawal = (id: string, action: 'approve' | 'reject', notes?: string) =>
  adminFetch(`/admin/withdrawals/${id}/process`, {
    method: 'POST',
    body: JSON.stringify({ action, notes }),
  });

// Games
export const getAdminGames = (page = 1, limit = 50) =>
  adminFetch('/admin/games', { params: { page, limit } });

export const syncGames = () =>
  adminFetch('/admin/games/sync', { method: 'POST' });

export const updateGame = (id: string, dto: Record<string, any>) =>
  adminFetch(`/admin/games/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });

// Reports
export const getRevenueReport = (from?: string, to?: string) =>
  adminFetch('/admin/reports/revenue', { params: { from, to } });

export const getGameReport = () => adminFetch('/admin/reports/games');

// Audit
export const getAuditLogs = (page = 1, limit = 50, action?: string, userId?: string) =>
  adminFetch('/admin/audit-logs', { params: { page, limit, action, userId } });

// KYC
export const getKycVerifications = () => adminFetch('/admin/kyc');

// Bonuses
export const getBonuses = () => adminFetch('/admin/bonuses');