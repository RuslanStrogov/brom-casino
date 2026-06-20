'use client';

import React from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import StatsCard from '../components/StatsCard';
import UserTable from '../components/UserTable';
import TransactionTable from '../components/TransactionTable';
import GameTable from '../components/GameTable';
import BonusManager from '../components/BonusManager';
import KycQueue from '../components/KycQueue';
import {
  DollarSign,
  Users,
  Gamepad2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
} from 'lucide-react';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [stats, setStats] = React.useState({
    totalRevenue: 125430.5,
    totalUsers: 15847,
    activeUsers: 3241,
    totalBets: 892341,
    totalWagered: 2450000.0,
    grossProfit: 73500.0,
    houseEdge: 3.0,
    avgBetSize: 2.75,
    pendingWithdrawals: 45,
    pendingWithdrawalAmount: 12500.0,
    newUsersToday: 127,
    revenueToday: 4230.5,
  });

  const [revenueChart, setRevenueChart] = React.useState([
    { date: 'Mon', revenue: 3200, bets: 1200 },
    { date: 'Tue', revenue: 4100, bets: 1500 },
    { date: 'Wed', revenue: 3800, bets: 1400 },
    { date: 'Thu', revenue: 5200, bets: 1800 },
    { date: 'Fri', revenue: 6100, bets: 2100 },
    { date: 'Sat', revenue: 7500, bets: 2500 },
    { date: 'Sun', revenue: 6800, bets: 2300 },
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
          <p className="text-gray-400 mb-6">Sign in to access the admin panel</p>
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Overview of BROM Casino performance</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Activity className="w-4 h-4 text-green-400" />
          <span>Live</span>
          <span className="text-gray-600">•</span>
          <span>Last updated: just now</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change={12.5}
          icon={<DollarSign className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={8.2}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          change={-2.1}
          icon={<Activity className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Total Bets"
          value={stats.totalBets.toLocaleString()}
          change={15.3}
          icon={<Gamepad2 className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Total Wagered</span>
            <Wallet className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold">{stats.totalWagered.toLocaleString()} TON</p>
          <div className="flex items-center gap-1 mt-1 text-green-400 text-sm">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.2% vs last week</span>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-green-400">${stats.grossProfit.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1 text-gray-400 text-sm">
            <span>House edge: {stats.houseEdge}%</span>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Pending Withdrawals</span>
            <ArrowDownRight className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-400">{stats.pendingWithdrawals}</p>
          <div className="flex items-center gap-1 mt-1 text-gray-400 text-sm">
            <span>{stats.pendingWithdrawalAmount.toLocaleString()} TON</span>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Revenue (Last 7 Days)</h2>
        <div className="flex items-end gap-3 h-48">
          {revenueChart.map((day, i) => {
            const maxRevenue = Math.max(...revenueChart.map(d => d.revenue));
            const height = (day.revenue / maxRevenue) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-gray-400">${(day.revenue / 1000).toFixed(1)}k</span>
                <div
                  className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md transition-all hover:from-amber-500 hover:to-amber-300"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-gray-500">{day.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <UserTable limit={5} />
        <TransactionTable limit={5} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <GameTable />
        <BonusManager />
        <KycQueue />
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-gray-800 rounded-lg px-4 py-2.5 border border-gray-700 focus:border-amber-500 focus:outline-none text-white"
          placeholder="admin@brom-casino.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-gray-800 rounded-lg px-4 py-2.5 border border-gray-700 focus:border-amber-500 focus:outline-none text-white"
          placeholder="••••••••"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
