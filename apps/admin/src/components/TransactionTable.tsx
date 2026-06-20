'use client';

import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, ExternalLink, MoreHorizontal } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'bonus';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  userId: number;
  username: string;
  txHash?: string;
  createdAt: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-001', type: 'withdrawal', amount: 500, currency: 'TON', status: 'pending', userId: 1, username: 'whale_ton', createdAt: '2 min ago' },
  { id: 'tx-002', type: 'deposit', amount: 100, currency: 'TON', status: 'completed', userId: 2, username: 'crypto_king', txHash: '0xabc...123', createdAt: '15 min ago' },
  { id: 'tx-003', type: 'bet', amount: 25, currency: 'TON', status: 'completed', userId: 3, username: 'lucky_player', createdAt: '20 min ago' },
  { id: 'tx-004', type: 'win', amount: 125, currency: 'TON', status: 'completed', userId: 4, username: 'high_roller', createdAt: '25 min ago' },
  { id: 'tx-005', type: 'withdrawal', amount: 50, currency: 'TON', status: 'failed', userId: 5, username: 'newbie123', createdAt: '1 hour ago' },
  { id: 'tx-006', type: 'bonus', amount: 10, currency: 'TON', status: 'completed', userId: 7, username: 'casual_gamer', createdAt: '2 hours ago' },
  { id: 'tx-007', type: 'deposit', amount: 250, currency: 'TON', status: 'completed', userId: 1, username: 'whale_ton', txHash: '0xdef...456', createdAt: '3 hours ago' },
  { id: 'tx-008', type: 'bet', amount: 5, currency: 'TON', status: 'completed', userId: 6, username: 'bot_suspect', createdAt: '5 hours ago' },
];

const TYPE_CONFIG: Record<Transaction['type'], { icon: typeof ArrowDownCircle; color: string; label: string }> = {
  deposit: { icon: ArrowDownCircle, color: 'text-green-400', label: 'Deposit' },
  withdrawal: { icon: ArrowUpCircle, color: 'text-amber-400', label: 'Withdrawal' },
  bet: { icon: RefreshCw, color: 'text-blue-400', label: 'Bet' },
  win: { icon: ArrowDownCircle, color: 'text-green-400', label: 'Win' },
  bonus: { icon: ArrowDownCircle, color: 'text-purple-400', label: 'Bonus' },
};

export default function TransactionTable({ limit }: { limit?: number }) {
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filtered = MOCK_TRANSACTIONS.filter(tx => {
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
    return <span className={`badge ${classes[status]}`}>{status}</span>;
  };

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
            <option value="bet">Bets</option>
            <option value="win">Wins</option>
            <option value="bonus">Bonuses</option>
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
            {display.map(tx => {
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
                    <span className={`font-medium ${tx.type === 'withdrawal' || tx.type === 'bet' ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.type === 'withdrawal' || tx.type === 'bet' ? '-' : '+'}{tx.amount} {tx.currency}
                    </span>
                  </td>
                  <td>{getStatusBadge(tx.status)}</td>
                  <td>
                    {tx.txHash ? (
                      <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                        {tx.txHash}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>
                  <td className="text-gray-500 text-sm">{tx.createdAt}</td>
                  <td>
                    <button className="p-1 rounded hover:bg-gray-800 transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* View All */}
      {limit && (
        <div className="px-5 py-3 border-t border-gray-800">
          <button className="text-sm text-amber-400 hover:text-amber-300 w-full text-center">
            View all transactions →
          </button>
        </div>
      )}
    </div>
  );
}
