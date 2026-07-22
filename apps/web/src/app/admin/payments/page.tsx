'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getPendingDeposits,
  getPendingWithdrawals,
  processWithdrawal,
} from '@/lib/adminApi';

// ─── Types ───────────────────────────────────────────────────────────────

interface PaymentUser {
  username: string;
  email: string;
}

interface Deposit {
  id: string;
  amount: number | string;
  currency: string;
  status: string;
  createdAt: string;
  user: PaymentUser;
}

interface Withdrawal {
  id: string;
  amount: number | string;
  currency: string;
  status: string;
  createdAt: string;
  user: PaymentUser;
}

type Tab = 'deposits' | 'withdrawals';

interface ConfirmAction {
  withdrawalId: string;
  action: 'approve' | 'reject';
  username: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatAmount(amount: number | string): string {
  const num = Number(amount);
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusVariant(status: string): { label: string; classes: string } {
  const s = status.toLowerCase();
  if (s === 'pending' || s === 'pending_approval') {
    return { label: 'Pending', classes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
  }
  if (s === 'approved' || s === 'completed') {
    return { label: 'Approved', classes: 'bg-green-500/10 text-green-400 border-green-500/20' };
  }
  if (s === 'rejected' || s === 'cancelled') {
    return { label: 'Rejected', classes: 'bg-red-500/10 text-red-400 border-red-500/20' };
  }
  return { label: status, classes: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
}

// ─── Sub-components ──────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-miami-pink/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-miami-pink rounded-full animate-spin" />
          <div className="absolute inset-1 border-2 border-transparent border-t-miami-cyan rounded-full animate-spin animation-delay-150" style={{ animationDuration: '0.8s' }} />
        </div>
        <p className="text-sm text-gray-400 animate-pulse">Loading payments...</p>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center max-w-md animate-fade-in">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-heading font-bold text-white mb-2">Failed to load payments</h2>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-miami hover:shadow-neon-pink transition-all duration-300"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function EmptyState({ type }: { type: 'deposits' | 'withdrawals' }) {
  const icon = type === 'deposits' ? '💰' : '💸';
  const title = type === 'deposits' ? 'No pending deposits' : 'No pending withdrawals';
  const desc = type === 'deposits'
    ? 'All deposits have been processed. New ones will appear here.'
    : 'All withdrawal requests have been handled.';

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-heading font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  );
}

function ConfirmModal({
  isOpen,
  action,
  processing,
  notes,
  onNotesChange,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  action: ConfirmAction | null;
  processing: boolean;
  notes: string;
  onNotesChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen || !action) return null;

  const isApprove = action.action === 'approve';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
        <div className="relative p-6 rounded-2xl border border-white/10 bg-casino-dark/95 backdrop-blur-xl">
          {/* Miami accent line */}
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-miami-pink via-miami-purple to-miami-cyan opacity-60" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-4 mt-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
              isApprove ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              {isApprove ? '✅' : '❌'}
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-white">
                {isApprove ? 'Approve Withdrawal' : 'Reject Withdrawal'}
              </h3>
              <p className="text-xs text-gray-500">
                {action.username} &middot; {action.withdrawalId.slice(0, 8)}...
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            {isApprove
              ? 'This will release funds to the user. This action cannot be undone.'
              : 'This will cancel the withdrawal request and return funds to the user\'s balance.'}
          </p>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Admin Notes <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add a note about this decision..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-miami-pink/50 focus:shadow-neon-pink transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={processing}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={processing}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                isApprove
                  ? 'bg-green-500 hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                  : 'bg-red-500 hover:bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
              }`}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : isApprove ? (
                'Approve Withdrawal'
              ) : (
                'Reject Withdrawal'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Table ───────────────────────────────────────────────────────

function DepositsTable({ deposits }: { deposits: Deposit[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
          </tr>
        </thead>
        <tbody>
          {deposits.map((deposit, idx) => {
            const badge = statusVariant(deposit.status);
            return (
              <tr
                key={deposit.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors animate-fade-in"
                style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' }}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-miami/20 flex items-center justify-center text-xs font-bold text-white">
                      {deposit.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{deposit.user.username}</p>
                      <p className="text-xs text-gray-500">{deposit.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-mono font-bold text-miami-cyan">
                    {formatAmount(deposit.amount)}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-1 rounded-md">
                    {deposit.currency}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.classes}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      badge.label === 'Pending' ? 'bg-yellow-400 animate-pulse' :
                      badge.label === 'Approved' ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    {badge.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(deposit.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WithdrawalsTable({
  withdrawals,
  onAction,
}: {
  withdrawals: Withdrawal[];
  onAction: (id: string, action: 'approve' | 'reject', username: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((wd, idx) => {
            const badge = statusVariant(wd.status);
            return (
              <tr
                key={wd.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors animate-fade-in"
                style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' }}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-miami/20 flex items-center justify-center text-xs font-bold text-white">
                      {wd.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{wd.user.username}</p>
                      <p className="text-xs text-gray-500">{wd.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-mono font-bold text-miami-pink">
                    {formatAmount(wd.amount)}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-1 rounded-md">
                    {wd.currency}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.classes}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      badge.label === 'Pending' ? 'bg-yellow-400 animate-pulse' :
                      badge.label === 'Approved' ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    {badge.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(wd.createdAt)}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onAction(wd.id, 'approve', wd.user.username)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-green-500 hover:bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all duration-300"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onAction(wd.id, 'reject', wd.user.username)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Summary Cards ───────────────────────────────────────────────────────

function SummaryCards({
  deposits,
  withdrawals,
}: {
  deposits: Deposit[];
  withdrawals: Withdrawal[];
}) {
  const totalDepositAmount = deposits.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalWithdrawalAmount = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  const cards = [
    {
      label: 'Pending Deposits',
      count: deposits.length,
      total: totalDepositAmount,
      icon: '💰',
      color: 'from-miami-cyan/20 to-transparent',
      textColor: 'text-miami-cyan',
    },
    {
      label: 'Pending Withdrawals',
      count: withdrawals.length,
      total: totalWithdrawalAmount,
      icon: '💸',
      color: 'from-miami-pink/20 to-transparent',
      textColor: 'text-miami-pink',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-2xl transition-all duration-300 group-hover:opacity-80`} />
          <div className="relative p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{card.icon}</div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-heading font-bold text-white">{card.count}</span>
                  <span className={`text-sm font-mono ${card.textColor}`}>
                    {formatAmount(card.total)} USDT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('deposits');
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Confirm modal state
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [depositsData, withdrawalsData] = await Promise.all([
        getPendingDeposits(),
        getPendingWithdrawals(),
      ]);
      setDeposits(Array.isArray(depositsData) ? depositsData : []);
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleWithdrawalAction = (id: string, action: 'approve' | 'reject', username: string) => {
    setConfirmAction({ withdrawalId: id, action, username });
    setNotes('');
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setProcessing(true);
    try {
      await processWithdrawal(confirmAction.withdrawalId, confirmAction.action, notes || undefined);
      setConfirmAction(null);
      setNotes('');
      // Refresh data after action
      await fetchData();
    } catch (err: any) {
      console.error('Failed to process withdrawal:', err);
      alert(`Failed to ${confirmAction.action} withdrawal: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'deposits', label: 'Pending Deposits', count: deposits.length },
    { key: 'withdrawals', label: 'Pending Withdrawals', count: withdrawals.length },
  ];

  // ── Render ──

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-white mb-1">Payments</h1>
        <p className="text-sm text-gray-400">Manage pending deposits and withdrawal requests</p>
      </div>

      {/* Summary cards */}
      <SummaryCards deposits={deposits} withdrawals={withdrawals} />

      {/* Tabs */}
      <div className="relative mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5 w-fit">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-white shadow-[inset_0_0_20px_rgba(255,45,149,0.05)]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-miami/10" />
                )}
                <span className="relative z-10">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`relative z-10 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-miami-pink/20 text-miami-pink'
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="relative">
        {/* Card wrapper */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl" />
        <div className="relative rounded-2xl border border-white/10 backdrop-blur-md overflow-hidden">
          {/* Neon accent header */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-miami-pink via-miami-purple to-miami-cyan opacity-30" />

          {activeTab === 'deposits' ? (
            deposits.length === 0 ? (
              <EmptyState type="deposits" />
            ) : (
              <DepositsTable deposits={deposits} />
            )
          ) : (
            withdrawals.length === 0 ? (
              <EmptyState type="withdrawals" />
            ) : (
              <WithdrawalsTable
                withdrawals={withdrawals}
                onAction={handleWithdrawalAction}
              />
            )
          )}
        </div>
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={confirmAction !== null}
        action={confirmAction}
        processing={processing}
        notes={notes}
        onNotesChange={setNotes}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
