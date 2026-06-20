'use client';

import React from 'react';
import { MoreHorizontal, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  id: number;
  telegramId: number;
  username: string;
  firstName: string;
  balance: number;
  totalWagered: number;
  status: 'active' | 'banned' | 'suspended';
  kycStatus: 'verified' | 'pending' | 'rejected' | 'none';
  joinedAt: string;
  lastActive: string;
}

const MOCK_USERS: User[] = [
  { id: 1, telegramId: 123456789, username: 'whale_ton', firstName: 'Alex', balance: 1250.0, totalWagered: 45000, status: 'active', kycStatus: 'verified', joinedAt: '2026-01-15', lastActive: '2 min ago' },
  { id: 2, telegramId: 987654321, username: 'crypto_king', firstName: 'Dmitry', balance: 890.5, totalWagered: 32000, status: 'active', kycStatus: 'verified', joinedAt: '2026-02-20', lastActive: '15 min ago' },
  { id: 3, telegramId: 456789123, username: 'lucky_player', firstName: 'Sarah', balance: 45.2, totalWagered: 5200, status: 'active', kycStatus: 'pending', joinedAt: '2026-03-10', lastActive: '1 hour ago' },
  { id: 4, telegramId: 321654987, username: 'high_roller', firstName: 'Mike', balance: 3200.0, totalWagered: 120000, status: 'active', kycStatus: 'verified', joinedAt: '2025-12-01', lastActive: '5 min ago' },
  { id: 5, telegramId: 654321987, username: 'newbie123', firstName: 'Anna', balance: 12.5, totalWagered: 150, status: 'active', kycStatus: 'none', joinedAt: '2026-06-18', lastActive: '30 min ago' },
  { id: 6, telegramId: 147258369, username: 'bot_suspect', firstName: 'Unknown', balance: 0.5, totalWagered: 50000, status: 'suspended', kycStatus: 'rejected', joinedAt: '2026-06-01', lastActive: '3 days ago' },
  { id: 7, telegramId: 963852741, username: 'casual_gamer', firstName: 'Tom', balance: 78.3, totalWagered: 2400, status: 'active', kycStatus: 'none', joinedAt: '2026-04-22', lastActive: '2 hours ago' },
  { id: 8, telegramId: 741852963, username: 'banned_user', firstName: 'Spam', balance: 0, totalWagered: 100, status: 'banned', kycStatus: 'rejected', joinedAt: '2026-05-15', lastActive: '1 week ago' },
];

export default function UserTable({ limit }: { limit?: number }) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const perPage = limit || 10;

  const filteredUsers = MOCK_USERS.filter(user => {
    const matchesSearch =
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.telegramId.toString().includes(search);
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const displayUsers = limit ? filteredUsers.slice(0, limit) : filteredUsers;

  const getStatusBadge = (status: User['status']) => {
    const classes = {
      active: 'badge-success',
      suspended: 'badge-warning',
      banned: 'badge-danger',
    };
    return <span className={`badge ${classes[status]}`}>{status}</span>;
  };

  const getKycBadge = (status: User['kycStatus']) => {
    const classes = {
      verified: 'badge-success',
      pending: 'badge-warning',
      rejected: 'badge-danger',
      none: 'badge-info',
    };
    return <span className={`badge ${classes[status]}`}>{status}</span>;
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Users</h2>
          <span className="text-sm text-gray-500">{filteredUsers.length} total</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, username, or ID..."
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input w-36"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Balance</th>
              <th>Wagered</th>
              <th>Status</th>
              <th>KYC</th>
              <th>Last Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black">
                      {user.firstName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.firstName}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="font-medium">{user.balance.toFixed(2)} TON</td>
                <td className="text-gray-400">{user.totalWagered.toLocaleString()} TON</td>
                <td>{getStatusBadge(user.status)}</td>
                <td>{getKycBadge(user.kycStatus)}</td>
                <td className="text-gray-500 text-sm">{user.lastActive}</td>
                <td>
                  <button className="p-1 rounded hover:bg-gray-800 transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination (only if not limited) */}
      {!limit && (
        <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing 1-{Math.min(perPage, filteredUsers.length)} of {filteredUsers.length}
          </span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm">1</span>
            <button className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* View All link for limited view */}
      {limit && (
        <div className="px-5 py-3 border-t border-gray-800">
          <button className="text-sm text-amber-400 hover:text-amber-300 w-full text-center">
            View all users →
          </button>
        </div>
      )}
    </div>
  );
}
