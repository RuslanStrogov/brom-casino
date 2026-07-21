'use client';

import React from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Gift, Percent, Users, DollarSign } from 'lucide-react';
import StatsCard from '../../components/StatsCard';
import BonusManager from '../../components/BonusManager';

export default function BonusesPage() {
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
          <h1 className="text-2xl font-bold">Bonuses</h1>
          <p className="text-gray-400 text-sm mt-1">Create and manage promotional bonuses, cashback, and free spins</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Active Bonuses"
          value="4"
          change={0}
          icon={<Gift className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Total Claimed"
          value="1,647"
          change={23.4}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Avg Wagering"
          value="21x"
          change={-3.2}
          icon={<Percent className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Bonus Value (Active)"
          value="12,500 TON"
          change={15.8}
          icon={<DollarSign className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Bonus Manager */}
      <BonusManager />
    </div>
  );
}