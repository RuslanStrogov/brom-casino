'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Wallet, Banknote, ArrowUpRight, ArrowDownRight, Search, ExternalLink } from 'lucide-react';
import StatsCard from '../../components/StatsCard';

interface WalletInfo {
  id: string;
  userId: number;
  username: string;
  address: string;
  network: 'TON' | 'TRON' | 'ETH' | 'BSC' | 'SOL';
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  lastActive: string;
  status: 'active' | 'locked' | 'disabled';
}

const MOCK_WALLETS: WalletInfo[] = [
  { id: 'w-001', userId: 1, username: 'whale_ton', address: 'UQABCD...1234', network: 'TON', balance: 1250, totalDeposited: 15000, totalWithdrawn: 13750, lastActive: '2 min ago', status: 'active' },
  { id: 'w-002', userId: 2, username: 'crypto_king', address: '0x1234...5678', network: 'ETH', balance: 890.5, totalDeposited: 10000, totalWithdrawn: 9109.5, lastActive: '15 min ago', status: 'active' },
  { id: 'w-003', userId: 4, username: 'high_roller', address: 'TXYZ...7890', network: 'TRON', balance: 3200, totalDeposited: 50000, totalWithdrawn: 46800, lastActive: '5 min ago', status: 'active' },
  { id: 'w-004', userId: 3, username: 'lucky_player', address: '0xABCD...EF01', network: 'BSC', balance: 45.2, totalDeposited: 500, totalWithdrawn: 454.8, lastActive: '1 hour ago', status: 'active' },
  { id: 'w-005', userId: 6, username: 'bot_suspect', address: 'So111...2222', network: 'SOL', balance: 0.5, totalDeposited: 100, totalWithdrawn: 99.5, lastActive: '3 days ago', status: 'locked' },
];

const NETWORK_BADGES: Record<string, string> = {
  TON: 'bg-blue-500/10 text-blue-400',
  ETH: 'bg-purple-500/10 text-purple-400',
  TRON: 'bg-red-500/10 text-red-400',
  BSC: 'bg-yellow-500/10 text-yellow-400',
  SOL: 'bg-green-500/10 text-green-400',
};

export default function WalletPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [search, setSearch] = useState('');
  const [networkFilter, setNetworkFilter] = useState('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Please log in to access this page</p>
      </div>
    );
  }

  const filtered = MOCK_WALLETS.filter(w => {
    const matchesSearch = w.username.toLowerCase().includes(search.toLowerCase()) || w.address.toLowerCase().includes(search.toLowerCase());
    const matchesNetwork = networkFilter === 'all' || w.network === networkFilter;
    return matchesSearch && matchesNetwork;
  });

  const totalBalance = MOCK_WALLETS.reduce((sum, w) => sum + w.balance, 0);
  const totalDeposits = MOCK_WALLETS.reduce((sum, w) => sum + w.totalDeposited, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wallets</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor user wallets, balances, and transaction history</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Balance"
          value={`${totalBalance.toLocaleString()} TON`}
          change={8.5}
          icon={<Wallet className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Active Wallets"
          value={MOCK_WALLETS.filter(w => w.status === 'active').length.toString()}
          change={0}
          icon={<Banknote className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Total Deposited"
          value={`${totalDeposits.toLocaleString()} TON`}
          change={22.1}
          icon={<ArrowDownRight className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Total Withdrawn"
          value={`${MOCK_WALLETS.reduce((s, w) => s + w.totalWithdrawn, 0).toLocaleString()} TON`}
          change={-12.3}
          icon={<ArrowUpRight className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by username or address..."
            className="input pl-10"
          />
        </div>
        <select
          value={networkFilter}
          onChange={e => setNetworkFilter(e.target.value)}
          className="input w-36"
        >
          <option value="all">All Networks</option>
          <option value="TON">TON</option>
          <option value="ETH">ETH</option>
          <option value="TRON">TRON</option>
          <option value="BSC">BSC</option>
          <option value="SOL">SOL</option>
        </select>
      </div>

      {/* Wallet List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Address</th>
                <th>Network</th>
                <th>Balance</th>
                <th>Deposited</th>
                <th>Withdrawn</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(wallet => (
                <tr key={wallet.id} className="hover:bg-gray-800/30 transition-colors">
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">@{wallet.username}</span>
                    </div>
                  </td>
                  <td className="font-mono text-sm text-gray-400">{wallet.address}</td>
                  <td>
                    <span className={`badge text-[10px] ${NETWORK_BADGES[wallet.network]}`}>
                      {wallet.network}
                    </span>
                  </td>
                  <td className="font-medium">{wallet.balance.toLocaleString()} TON</td>
                  <td className="text-green-400">{wallet.totalDeposited.toLocaleString()} TON</td>
                  <td className="text-red-400">{wallet.totalWithdrawn.toLocaleString()} TON</td>
                  <td>
                    <span className={`badge ${
                      wallet.status === 'active' ? 'badge-success' :
                      wallet.status === 'locked' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {wallet.status}
                    </span>
                  </td>
                  <td>
                    <button className="p-1 rounded hover:bg-gray-800 transition-colors">
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}