'use client';

import React from 'react';
import { MoreHorizontal, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi } from '../lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  balance: number;
  totalWagered: number;
  kycStatus: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  wallet?: { balance: string; currency: string } | null;
  kyc?: { status: string; level: number } | null;
}

export default function UserTable({ limit }: { limit?: number }) {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await adminApi.users.list({ page: currentPage, limit: limit || 20 });
        const data = res.data;
        const mapped: User[] = (data.users || []).map((u: any) => ({
          id: u.id,
          username: u.username || u.email?.split('@')[0] || 'unknown',
          email: u.email,
          role: u.role,
          status: (u.status || 'ACTIVE').toLowerCase(),
          balance: Number(u.wallet?.balance || 0),
          totalWagered: Number(u.totalWagered || 0),
          kycStatus: u.kyc?.status?.toLowerCase() || null,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
          wallet: u.wallet,
          kyc: u.kyc,
        }));
        setUsers(mapped);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, limit]);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const displayUsers = limit ? filteredUsers.slice(0, limit) : filteredUsers;

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'badge-success',
      banned: 'badge-danger',
      suspended: 'badge-warning',
    };
    return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
  };

  const getKycBadge = (status: string | null) => {
    const map: Record<string, string> = {
      verified: 'badge-success',
      in_progress: 'badge-warning',
      pending: 'badge-warning',
      rejected: 'badge-danger',
    };
    const label = status || 'none';
    return <span className={`badge ${map[label] || 'badge-info'}`}>{label}</span>;
  };

  const getInitial = (username: string) => username.charAt(0).toUpperCase();

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
          <h2 className="text-lg font-semibold">Users</h2>
          <span className="text-sm text-gray-500">{users.length} total</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
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
              <th>Role</th>
              <th>Balance</th>
              <th>Wagered</th>
              <th>Status</th>
              <th>KYC</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-8">
                  No users found
                </td>
              </tr>
            ) : (
              displayUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black">
                        {getInitial(user.username)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs text-gray-400">{user.role}</td>
                  <td className="font-medium">${user.balance.toLocaleString()}</td>
                  <td className="text-gray-400">${user.totalWagered.toLocaleString()}</td>
                  <td>{getStatusBadge(user.status)}</td>
                  <td>{getKycBadge(user.kycStatus)}</td>
                  <td>
                    <button className="p-1 rounded hover:bg-gray-800 transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (only if not limited) */}
      {!limit && users.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing page {currentPage}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm">{currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* View All link for limited view */}
      {limit && users.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-800">
          <button className="text-sm text-amber-400 hover:text-amber-300 w-full text-center">
            View all users →
          </button>
        </div>
      )}
    </div>
  );
}
