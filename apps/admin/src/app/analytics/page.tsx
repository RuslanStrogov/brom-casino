'use client';

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { adminApi } from '../../lib/api';
import { BarChart3, TrendingUp, Users, DollarSign, Activity, Globe } from 'lucide-react';
import StatsCard from '../../components/StatsCard';

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [stats, setStats] = useState({ revenue: 0, users: 0, bets: 0, ggr: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchStats = async () => {
      try {
        const res = await adminApi.dashboard.getStats();
        const data = res.data;
        setStats({
          revenue: Number(data.deposits?.today || 0),
          users: data.users?.active || data.users?.total || 0,
          bets: Number(data.bets?.today || 0),
          ggr: Number(data.grossGamingRevenue || 0),
        });
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated]);

  if (authLoading) {
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
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Platform metrics, user behavior, and revenue analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input w-36">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Platform Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          change={0}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Active Users"
          value={stats.users.toLocaleString()}
          change={0}
          icon={<Users className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Total Bets"
          value={stats.bets.toLocaleString()}
          change={0}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Gross Gaming Revenue"
          value={`$${stats.ggr.toLocaleString()}`}
          change={0}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Revenue Overview
            </h3>
            <span className="text-xs text-gray-500">Today: ${stats.revenue.toLocaleString()}</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {[65, 78, 52, 85, 92, 78, 88].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-md transition-all hover:opacity-80"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-gray-500">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Growth */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              User Growth
            </h3>
            <span className="text-xs text-gray-500">{stats.users} active</span>
          </div>
          <div className="relative h-40">
            <svg className="w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
              <path
                d="M0,120 Q50,100 100,80 Q150,60 200,40 Q250,30 300,20"
                fill="none"
                stroke="rgb(34 197 94)"
                strokeWidth="2"
              />
              <path
                d="M0,120 Q50,100 100,80 Q150,60 200,40 Q250,30 300,20 L300,160 L0,160 Z"
                fill="url(#growthGradient)"
                opacity="0.1"
              />
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(34 197 94)" />
                  <stop offset="100%" stopColor="rgb(34 197 94)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
                <span key={i} className="text-[10px] text-gray-500">{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Games */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Top Games by Volume
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Lucky 7s', volume: '845,000 TON', percentage: 85 },
              { name: 'Plinko', volume: '523,000 TON', percentage: 52 },
              { name: 'Dice', volume: '312,000 TON', percentage: 31 },
              { name: 'Mines', volume: '245,000 TON', percentage: 24 },
              { name: 'Roulette', volume: '189,000 TON', percentage: 19 },
            ].map((game, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-300">{game.name}</span>
                  <span className="text-gray-400">{game.volume}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                    style={{ width: `${game.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Traffic Sources
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { source: 'Direct', count: '45%', color: 'bg-amber-500' },
              { source: 'Telegram', count: '28%', color: 'bg-blue-500' },
              { source: 'Referral', count: '15%', color: 'bg-green-500' },
              { source: 'Organic', count: '8%', color: 'bg-purple-500' },
              { source: 'Other', count: '4%', color: 'bg-gray-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full ${item.color}" />
                <span className="flex-1 text-sm text-gray-300">{item.source}</span>
                <span className="text-sm font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}