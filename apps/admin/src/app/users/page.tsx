'use client';

import React from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { adminApi } from '../../lib/api';
import { Users, UserCheck, UserX, Activity } from 'lucide-react';
import StatsCard from '../../components/StatsCard';
import UserTable from '../../components/UserTable';

export default function UsersPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [stats, setStats] = React.useState({ total: 0, active: 0, newToday: 0, pendingKyc: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const fetchStats = async () => {
      try {
        const res = await adminApi.dashboard.getStats();
        const data = res.data;
        setStats({
          total: data.users.total,
          active: data.users.active,
          newToday: data.users.newToday,
          pendingKyc: data.pendingKyc,
        });
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated]);

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-gray-400 text-sm mt-1">Manage players, review activity, and handle restrictions</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium hover:from-amber-400 hover:to-amber-500 transition-all text-sm">
            <UserCheck className="w-4 h-4" />
            Invite User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.total.toLocaleString()}
          change={0}
          icon={<Users className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Active"
          value={stats.active.toLocaleString()}
          change={0}
          icon={<Activity className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="New Today"
          value={stats.newToday.toLocaleString()}
          change={0}
          icon={<UserX className="w-5 h-5" />}
          color="red"
        />
        <StatsCard
          title="Pending KYC"
          value={stats.pendingKyc.toLocaleString()}
          change={0}
          icon={<UserCheck className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* User Table */}
      <UserTable />
    </div>
  );
}
