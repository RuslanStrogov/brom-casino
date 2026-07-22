'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getUsers, adjustBalance } from '@/lib/adminApi';

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserWallet {
  balance: number;
  currency: string;
}

interface UserKyc {
  status: string;
  level: string | null;
}

interface UserCounts {
  bets: number;
  referrals: number;
}

interface User {
  id: string;
  email: string;
  username: string;
  phone: string | null;
  status: string;
  createdAt: string;
  wallet: UserWallet;
  kyc: UserKyc | null;
  _count: UserCounts;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsersResponse {
  users: User[];
  meta: Meta;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'suspended':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'banned':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

function getKycBadgeClass(status: string): string {
  switch (status) {
    case 'verified':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'rejected':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

function getKycLabel(status: string): string {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'pending':
      return 'Pending';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Not Submitted';
  }
}

// ── Spinner ────────────────────────────────────────────────────────────────────

function Spinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-miami-pink border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">{text}</p>
      </div>
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────────

function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Failed to load users</h2>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl bg-gradient-miami text-white text-sm font-bold hover:shadow-neon-pink transition-all duration-300"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ search, onClear }: { search: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      {search ? (
        <>
          <h3 className="text-lg font-bold text-white mb-1">No users found</h3>
          <p className="text-sm text-gray-400 mb-4">
            No users matching &quot;{search}&quot;
          </p>
          <button
            onClick={onClear}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all"
          >
            Clear search
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold text-white mb-1">No users yet</h3>
          <p className="text-sm text-gray-400">There are no registered users on the platform.</p>
        </>
      )}
    </div>
  );
}

// ── Balance Adjustment Modal ──────────────────────────────────────────────────

interface BalanceModalProps {
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

function BalanceModal({ user, onClose, onSuccess }: BalanceModalProps) {
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!user) return null;

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the adjustment');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await adjustBalance(user.id, amount, reason.trim(), type);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust balance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="bg-casino-card border border-white/10 rounded-2xl shadow-card-miami overflow-hidden">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-miami" />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-bold text-white">Adjust Balance</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {user.username} &middot; Current: {formatCurrency(user.wallet.balance)} {user.wallet.currency || 'USDT'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Credit / Debit Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
              <div className="flex rounded-xl overflow-hidden border border-white/10 p-0.5 bg-casino-darker/50">
                <button
                  onClick={() => setType('credit')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                    type === 'credit'
                      ? 'bg-green-500/20 text-green-400 shadow-[inset_0_0_12px_rgba(34,197,94,0.15)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Credit
                  </span>
                </button>
                <button
                  onClick={() => setType('debit')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                    type === 'debit'
                      ? 'bg-red-500/20 text-red-400 shadow-[inset_0_0_12px_rgba(239,68,68,0.15)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    Debit
                  </span>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-casino-darker/50 border border-white/10 text-white text-lg font-heading font-bold placeholder-gray-600 focus:outline-none focus:border-miami-pink/50 focus:shadow-[0_0_15px_rgba(255,45,149,0.1)] transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                  {user.wallet.currency || 'USDT'}
                </span>
              </div>
              {type === 'debit' && (
                <p className="mt-1.5 text-xs text-gray-500">
                  New balance: {formatCurrency(Math.max(0, user.wallet.balance - (parseFloat(amount) || 0)))} {user.wallet.currency || 'USDT'}
                </p>
              )}
              {type === 'credit' && (
                <p className="mt-1.5 text-xs text-gray-500">
                  New balance: {formatCurrency(user.wallet.balance + (parseFloat(amount) || 0))} {user.wallet.currency || 'USDT'}
                </p>
              )}
            </div>

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Bonus credit, refund, penalty..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-casino-darker/50 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-miami-pink/50 focus:shadow-[0_0_15px_rgba(255,45,149,0.1)] transition-all resize-none"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2 flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-gradient-miami text-white text-sm font-bold hover:shadow-neon-pink transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                `${type === 'credit' ? 'Credit' : 'Debit'} Balance`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Status filter helpers ─────────────────────────────────────────────────────

const STATUS_OPTIONS = ['', 'active', 'suspended', 'banned', 'pending'] as const;

function getStatusFilterClasses(s: string, isActive: boolean): string {
  if (!isActive) return 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10';
  if (s === '') return 'bg-gradient-miami text-white shadow-neon-pink';
  if (s === 'active') return 'bg-green-500/20 text-green-400 border border-green-500/30';
  if (s === 'suspended' || s === 'banned') return 'bg-red-500/20 text-red-400 border border-red-500/30';
  if (s === 'pending') return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
  return 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10';
}

// ── Table helpers ──────────────────────────────────────────────────────────────

function TH({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-[11px] uppercase tracking-widest text-gray-500 font-medium ${className ?? ''}`}>
      {children}
    </th>
  );
}

function TD({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className ?? ''}`}>{children}</td>;
}

// ── Page Header (search + filters) ─────────────────────────────────────────────

function PageHeader({
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: {
  searchInput: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage all registered users and their balances</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by username or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-casino-card border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-miami-pink/50 focus:shadow-[0_0_15px_rgba(255,45,149,0.1)] transition-all"
          />
          {searchInput && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-500 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${getStatusFilterClasses(s, statusFilter === s)}`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [balanceTarget, setBalanceTarget] = useState<User | null>(null);

  // ── Debounced search (300ms) ──────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Fetch users ──────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: UsersResponse = await getUsers(
        currentPage,
        PAGE_LIMIT,
        statusFilter || undefined,
        debouncedSearch || undefined,
      );
      setUsers(data.users);
      setMeta(data.meta);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      setUsers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Pagination helpers ───────────────────────────────────────────────────
  const totalPages = meta?.totalPages ?? 1;

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);

    return pages;
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  // ── Handle successful balance adjustment ─────────────────────────────────
  const handleBalanceSuccess = () => {
    fetchUsers();
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (error && !loading && users.length === 0) {
    return (
      <div>
        <PageHeader searchInput={searchInput} onSearchChange={setSearchInput} statusFilter={statusFilter} onStatusChange={setStatusFilter} />
        <ErrorDisplay message={error} onRetry={fetchUsers} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Stats summary */}
      {meta && !loading && (
        <div className="flex items-center gap-4 mb-5 text-sm">
          <span className="text-gray-400">
            Total: <span className="text-white font-bold">{meta.total}</span>
          </span>
          <span className="w-px h-4 bg-white/10" />
          <span className="text-gray-400">
            Page <span className="text-white font-bold">{meta.page}</span> of{' '}
            <span className="text-white font-bold">{meta.totalPages}</span>
          </span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-casino-card/50 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="py-24">
            <Spinner text="Loading users..." />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            search={debouncedSearch}
            onClear={() => {
              setSearchInput('');
              setDebouncedSearch('');
            }}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <TH>Username</TH>
                    <TH>Email</TH>
                    <TH>Balance</TH>
                    <TH>Status</TH>
                    <TH>KYC</TH>
                    <TH>Bets</TH>
                    <TH>Joined</TH>
                    <TH className="text-right">Actions</TH>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <TD>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-miami/20 flex items-center justify-center text-sm font-bold text-white">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{user.username}</p>
                            <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <p className="text-sm text-gray-300">{user.email}</p>
                        {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                      </TD>
                      <TD>
                        <p className="text-sm font-bold text-white">
                          {formatCurrency(user.wallet.balance)}{' '}
                          <span className="text-xs font-normal text-gray-500">{user.wallet.currency || 'USDT'}</span>
                        </p>
                      </TD>
                      <TD>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusBadgeClass(user.status)}`}
                        >
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </TD>
                      <TD>
                        {user.kyc ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getKycBadgeClass(user.kyc.status)}`}
                          >
                            {getKycLabel(user.kyc.status)}
                            {user.kyc.level && ` · ${user.kyc.level}`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">&mdash;</span>
                        )}
                      </TD>
                      <TD>
                        <p className="text-sm text-gray-300">{user._count.bets}</p>
                      </TD>
                      <TD>
                        <p className="text-sm text-gray-400 whitespace-nowrap">{formatDate(user.createdAt)}</p>
                      </TD>
                      <TD className="text-right">
                        <button
                          onClick={() => setBalanceTarget(user)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-miami/10 border border-miami-pink/20 text-xs font-bold text-miami-pink hover:bg-gradient-miami/20 hover:shadow-neon-pink transition-all duration-300"
                        >
                          Adjust Balance
                        </button>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-miami/20 flex items-center justify-center text-sm font-bold text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${getStatusBadgeClass(user.status)}`}
                    >
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Balance</p>
                      <p className="text-white font-bold">
                        {formatCurrency(user.wallet.balance)} <span className="text-xs font-normal text-gray-500">{user.wallet.currency || 'USDT'}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">KYC</p>
                      {user.kyc ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${getKycBadgeClass(user.kyc.status)}`}
                        >
                          {getKycLabel(user.kyc.status)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">&mdash;</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Bets</p>
                      <p className="text-gray-300">{user._count.bets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Joined</p>
                      <p className="text-gray-400 text-xs">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBalanceTarget(user)}
                    className="w-full py-2 rounded-lg bg-gradient-miami/10 border border-miami-pink/20 text-xs font-bold text-miami-pink hover:bg-gradient-miami/20 transition-all"
                  >
                    Adjust Balance
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {meta && totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {/* Previous */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((page, idx) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-500 text-sm">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`min-w-[36px] h-9 rounded-xl text-sm font-bold transition-all ${
                  page === currentPage
                    ? 'bg-gradient-miami text-white shadow-neon-pink'
                    : 'border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {page}
              </button>
            ),
          )}

          {/* Next */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Balance Adjustment Modal */}
      {balanceTarget && (
        <BalanceModal
          user={balanceTarget}
          onClose={() => setBalanceTarget(null)}
          onSuccess={handleBalanceSuccess}
        />
      )}
    </div>
  );
}
