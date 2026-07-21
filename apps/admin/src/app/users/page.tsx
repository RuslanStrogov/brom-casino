'use client';

import React from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Users, UserCheck, UserX, Activity } from 'lucide-react';
import StatsCard from '../../components/StatsCard';
import UserTable from '../../components/UserTable';

export default function UsersPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();

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
          value="1,234"
          change={12.5}
          icon={<Users className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Active Today"
          value="456"
          change={8.3}
          icon={<Activity className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Suspended"
          value="12"
          change={-3.2}
          icon={<UserX className="w-5 h-5" />}
          color="red"
        />
        <StatsCard
          title="KYC Verified"
          value="892"
          change={15.1}
          icon={<UserCheck className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* User Table */}
      <UserTable />
    </div>
  );
}