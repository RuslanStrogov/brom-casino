'use client';

import React from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Gamepad2, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import StatsCard from '../../components/StatsCard';
import GameTable from '../../components/GameTable';

export default function GamesPage() {
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
          <h1 className="text-2xl font-bold">Games</h1>
          <p className="text-gray-400 text-sm mt-1">Manage games, monitor RTP, and configure game providers</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium hover:from-amber-400 hover:to-amber-500 transition-all text-sm">
            <TrendingUp className="w-4 h-4" />
            Sync Games
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Games"
          value="7"
          change={0}
          icon={<Gamepad2 className="w-5 h-5" />}
          color="purple"
        />
        <StatsCard
          title="Total Bets (24h)"
          value="834,000"
          change={15.2}
          icon={<BarChart3 className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Total Wagered (24h)"
          value="2,325,000"
          change={12.8}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Avg RTP"
          value="97.5%"
          change={0.3}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Game Table */}
      <GameTable />
    </div>
  );
}