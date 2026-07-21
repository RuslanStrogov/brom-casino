'use client';

import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, ExternalLink, MoreHorizontal } from 'lucide-react';
import { adminApi } from '../lib/api';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'bonus';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  userId: string;
  username: string;
  txHash?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<Transaction['type'], { icon: typeof ArrowDownCircle; color: string; label: string }> = {
  deposit: { icon: ArrowDownCircle, color: 'text-green-400', label: 'Deposit' },
  withdrawal: { icon: ArrowUpCircle, color: 'text-amber-400', label: 'Withdrawal' },
  bet: { icon: RefreshCw, color: 'text-blue-400', label: 'Bet' },
  win: { icon: ArrowDownCircle, color: 'text-green-400', label: 'Win' },
  bonus: { icon: ArrowDownCircle, color: 'text-purple-400', label: 'Bonus' },
};

export default function TransactionTable({ limit }: { limit?: number }) {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const [pendingDeposits, pendingWithdrawals] = await Promise.all([
          adminApi.transactions.getPendingDeposits().catch(() => ({ data: [] })),
          adminApi.transactions.getPendingWithdrawals().catch(() => ({ data: [] })),
        ]);

        const combined: Transaction[] = [
          ...((pendingDeposits.data as any[])?.map((d: any) => ({
            id: d.id || `dep-${Math.random()}`,
            type: 'deposit' as const,
            amount: Number(d.amount || 0),
            currency: d.currency || 'USDT',
            status: d.status?.toLowerCase() || 'completed',
            userId: d.userId || d.user?.id || '',
            username: d.user?.username || d.user?.email?.split('@')[0] || 'unknown',
            txHash: d.txHash || d.transactionHash,
            createdAt: d.createdAt || d.createdAt,
          })) || []),
          ...((pendingWithdrawals.data as any[])?.map((w: any) => ({
            id: w.id || `wdr-${Math.random()}`,
            type: 'withdrawal' as const,
            amount: Number(w.amount || 0),
            currency: w.currency || 'USDT',
            status: w.status?.toLowerCase() || 'pending',
            userId: w.userId || w.user?.id || '',
            username: w.user?.username || w.user?.email?.split('@')[0] || 'unknown',
            txHash: w.txHash,
            createdAt: w.createdAt || w.createdAt,
          })) || []),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setTransactions(combined);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filtered = transactions.filter(tx => {
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const display = limit ? filtered.slice(0, limit) : filtered;

  const getStatusBadge = (status: Transaction['status']) => {
    const classes = {
      completed: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-danger',
      cancelled: 'badge-info',
    };
    return <span className={`badge ${classes[status] || 'badge-info'}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Transactions</h2>
          <span className="text-sm text-gray-500">{filtered.length} total</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="input w-36"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input w-36"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>User</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Tx Hash</th>
              <th>Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {display.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-8">
                  No transactions found
                </td>
              </tr>
            ) : (
              display.map(tx => {
                const config = TYPE_CONFIG[tx.type];
                const Icon = config.icon;
                return (
                  <tr key={tx.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="text-sm">{config.label}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium">@{tx.username}</span>
                    </td>
                    <td>
                      <span className={`font-medium ${tx.type === 'withdrawal' ? 'text-red-400' : 'text-green-400'}`}>
                        {tx.type === 'withdrawal' ? '-' : '+'}{tx.amount} {tx.currency}
                      </span>
                    </td>
                    <td>{getStatusBadge(tx.status)}</td>
                    <td>
                      {tx.txHash ? (
                        <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                          {tx.txHash.slice(0, 10)}...
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                    <td className="text-gray-500 text-sm">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="p-1 rounded hover:bg-gray-800 transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View All */}
      {limit && transactions.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-800">
          <button className="text-sm text-amber-400 hover:text-amber-300 w-full text-center">
            View all transactions →
          </button>
        </div>
      )}
    </div>
  );
}
