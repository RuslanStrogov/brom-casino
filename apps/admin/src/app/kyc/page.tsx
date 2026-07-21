'use client';

import React from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Shield, Users, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import StatsCard from '../../components/StatsCard';
import KycQueue from '../../components/KycQueue';

export default function KycPage() {
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
          <h1 className="text-2xl font-bold">KYC Queue</h1>
          <p className="text-gray-400 text-sm mt-1">Review and verify identity documents submitted by users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Pending Reviews"
          value="5"
          change={33.3}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Approved (24h)"
          value="12"
          change={20.0}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Rejected (24h)"
          value="2"
          change={-50.0}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        <StatsCard
          title="Verified Users"
          value="892"
          change={15.1}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* KYC Queue */}
      <KycQueue />
    </div>
  );
}