'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, adjustBalance } from '@/lib/adminApi';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UserWallet {
  balance: number;
  currency: string;
  bonusBalance: number;
  lockedBalance: number;
}

interface UserKyc {
  status: string;
  level: string;
  documentType: string;
  createdAt: string;
  updatedAt: string;
}

interface UserCounts {
  bets: number;
  referrals: number;
  gameSessions: number;
  deposits: number;
  withdrawals: number;
}

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  phone: string | null;
  status: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  wallet: UserWallet;
  kyc: UserKyc | null;
  _count: UserCounts;
  recentActivity: ActivityItem[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'inactive':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    case 'suspended':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'banned':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

function kycStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'verified':
      return 'text-green-400';
    case 'pending':
      return 'text-yellow-400';
    case 'rejected':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

function roleColor(role: string): string {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'bg-miami-pink/10 text-miami-pink border-miami-pink/20';
    case 'moderator':
      return 'bg-miami-purple/10 text-miami-purple border-miami-purple/20';
    case 'vip':
      return 'bg-miami-cyan/10 text-miami-cyan border-miami-cyan/20';
    default:
      return 'bg-white/5 text-gray-300 border-white/10';
  }
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

// ─── Balance Adjustment Modal ──────────────────────────────────────────────────

function BalanceModal({
  open,
  onClose,
  userId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: (result: { balance: number; bonusBalance: number }) => void;
}) {
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setType('credit');
      setAmount('');
      setReason('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid positive amount');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await adjustBalance(userId, amount, reason, type);
      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust balance');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="absolute inset-0 bg-gradient-to-br from-miami-pink/5 via-miami-purple/5 to-miami-cyan/5 rounded-2xl" />
        <div className="relative bg-casino-card border border-white/10 rounded-2xl p-6 shadow-card-miami">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-heading font-bold text-white">Adjust Balance</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Toggle */}
            <div className="flex rounded-xl bg-casino-darker p-1 border border-white/5">
              <button
                type="button"
                onClick={() => setType('credit')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  type === 'credit'
                    ? 'bg-gradient-miami text-white shadow-neon-pink'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Credit
              </button>
              <button
                type="button"
                onClick={() => setType('debit')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  type === 'debit'
                    ? 'bg-gradient-miami text-white shadow-neon-pink'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Debit
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-casino-darker border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-miami-pink/50 focus:ring-1 focus:ring-miami-pink/20 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">USDT</span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Deposit correction, bonus adjustment..."
                rows={3}
                className="w-full bg-casino-darker border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-miami-pink/50 focus:ring-1 focus:ring-miami-pink/20 transition-all resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-miami text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                `${type === 'credit' ? 'Credit' : 'Debit'} ${amount || '0'} USDT`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl transition-all duration-300 group-hover:from-white/10" />
      <div className="relative p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-xl font-heading font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);

  const fetchUser = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUser(id);
      setUser(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleBalanceSuccess = (result: { balance: number; bonusBalance: number }) => {
    if (user) {
      setUser({
        ...user,
        wallet: {
          ...user.wallet,
          balance: result.balance,
          bonusBalance: result.bonusBalance,
        },
      });
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-miami-pink border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading user details...</p>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Failed to load user</h2>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={fetchUser}
              className="px-4 py-2 rounded-xl bg-gradient-miami text-white text-sm font-medium hover:opacity-90 transition-all"
            >
              Try Again
            </button>
            <Link
              href="/admin/users"
              className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 text-sm font-medium hover:bg-white/10 transition-all"
            >
              Back to Users
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-up">
      {/* Back Button */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6 group"
      >
        <svg
          className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Users
      </Link>

      {/* ── User Info Header ──────────────────────────────────────────────────── */}
      <div className="relative mb-8">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-miami-pink/5 via-miami-purple/5 to-miami-cyan/5 rounded-2xl" />

        <div className="relative bg-casino-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-card-miami">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-miami flex items-center justify-center text-xl font-bold text-white shadow-neon-pink flex-shrink-0">
              {getInitials(user.username)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-heading font-bold text-white truncate">
                  {user.username}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor(user.status)}`}>
                  {user.status}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {user.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Joined {formatShortDate(user.createdAt)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => setShowBalanceModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-miami text-white text-sm font-medium hover:opacity-90 transition-all shadow-neon-pink whitespace-nowrap"
            >
              Adjust Balance
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid: Wallet + KYC ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Wallet Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl transition-all duration-300 group-hover:from-white/10" />
          <div className="relative p-5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-miami-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Wallet
              </h3>
              <span className="text-xs text-gray-500">{user.wallet.currency}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-gray-400">Balance</span>
                <span className="text-lg font-heading font-bold text-white">
                  {formatCurrency(user.wallet.balance)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-gray-400">Bonus Balance</span>
                <span className="text-sm font-medium text-miami-pink">
                  {formatCurrency(user.wallet.bonusBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-400">Locked Balance</span>
                <span className="text-sm font-medium text-miami-cyan">
                  {formatCurrency(user.wallet.lockedBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl transition-all duration-300 group-hover:from-white/10" />
          <div className="relative p-5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-miami-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                KYC Verification
              </h3>
              {user.kyc ? (
                <span className={`text-xs font-medium ${kycStatusColor(user.kyc.status)}`}>
                  {user.kyc.status}
                </span>
              ) : (
                <span className="text-xs text-gray-500">Not submitted</span>
              )}
            </div>

            {user.kyc ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-400">Level</span>
                  <span className="text-sm font-medium text-white">{user.kyc.level}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-400">Document Type</span>
                  <span className="text-sm font-medium text-white">{user.kyc.documentType}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-gray-400">Submitted</span>
                  <span className="text-sm text-gray-300">{formatShortDate(user.kyc.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-400">Last Updated</span>
                  <span className="text-sm text-gray-300">{formatShortDate(user.kyc.updatedAt)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-gray-500">No KYC data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-white mb-4">Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Total Bets" value={user._count.bets.toLocaleString()} icon="🎲" color="bg-miami-pink/10" />
          <StatCard label="Referrals" value={user._count.referrals.toLocaleString()} icon="👥" color="bg-miami-cyan/10" />
          <StatCard label="Game Sessions" value={user._count.gameSessions.toLocaleString()} icon="🎮" color="bg-miami-purple/10" />
          <StatCard label="Deposits" value={user._count.deposits.toLocaleString()} icon="💰" color="bg-green-500/10" />
          <StatCard label="Withdrawals" value={user._count.withdrawals.toLocaleString()} icon="💸" color="bg-red-500/10" />
        </div>
      </div>

      {/* ── Recent Activity ─────────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
        <div className="relative bg-casino-card/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-card-miami">
          <div className="p-5 border-b border-white/5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-miami-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Activity
            </h3>
          </div>

          {user.recentActivity.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {user.recentActivity.map((activity) => (
                    <tr key={activity.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-white">{activity.action}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-400">
                          {activity.entity}
                          <span className="text-gray-600 ml-1">#{activity.entityId.slice(0, 8)}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-500">{formatDate(activity.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="w-10 h-10 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Balance Adjustment Modal ─────────────────────────────────────────────── */}
      <BalanceModal
        open={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        userId={id}
        onSuccess={handleBalanceSuccess}
      />
    </div>
  );
}