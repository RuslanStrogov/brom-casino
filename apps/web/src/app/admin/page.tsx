'use client';

import { useState, useEffect } from 'react';
import { getDashboard } from '@/lib/adminApi';

interface DashboardData {
  users: { total: number; active: number; newToday: number; newThisMonth: number };
  deposits: { today: number; thisMonth: number };
  withdrawals: { today: number; thisMonth: number; pending: number };
  bets: { today: number; thisMonth: number };
  grossGamingRevenue: number;
  pendingKyc: number;
}

function StatCard({ title, value, subtitle, icon, color, trend }: {
  title: string; value: string; subtitle?: string; icon: string; color: string; trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl transition-all duration-300 group-hover:from-white/10" />
      <div className="relative p-5 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color}`}>
            {icon}
          </div>
          {trend && (
            <span className={`flex items-center gap-1 text-xs font-medium ${
              trend.positive ? 'text-green-400' : 'text-red-400'
            }`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend.positive ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
              </svg>
              {trend.value}
            </span>
          )}
        </div>
        <p className="text-2xl font-heading font-bold text-white mb-1">{value}</p>
        <p className="text-sm text-gray-400">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
      </div>
    </div>
  );
}

function formatCurrency(amount: number | string): string {
  const num = Number(amount);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(2);
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getDashboard();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-miami-pink border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Failed to load dashboard</h2>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      title: 'Total Users',
      value: data.users.total.toLocaleString(),
      subtitle: `Active: ${data.users.active.toLocaleString()}`,
      icon: '👥',
      color: 'bg-blue-500/10',
      trend: { value: `+${data.users.newToday} today`, positive: true },
    },
    {
      title: 'Deposits (Month)',
      value: `${formatCurrency(data.deposits.thisMonth)} USDT`,
      subtitle: `${formatCurrency(data.deposits.today)} USDT today`,
      icon: '💰',
      color: 'bg-green-500/10',
    },
    {
      title: 'Withdrawals (Month)',
      value: `${formatCurrency(data.withdrawals.thisMonth)} USDT`,
      subtitle: `${data.withdrawals.pending} pending`,
      icon: '💸',
      color: 'bg-red-500/10',
    },
    {
      title: 'Bets (Month)',
      value: `${formatCurrency(data.bets.thisMonth)} USDT`,
      subtitle: `${formatCurrency(data.bets.today)} USDT today`,
      icon: '🎲',
      color: 'bg-purple-500/10',
    },
    {
      title: 'GGR (Month)',
      value: `${formatCurrency(data.grossGamingRevenue)} USDT`,
      subtitle: 'Gross Gaming Revenue',
      icon: '📈',
      color: 'bg-miami-pink/10',
    },
    {
      title: 'Pending KYC',
      value: data.pendingKyc.toString(),
      subtitle: 'Verifications needed',
      icon: '🪪',
      color: 'bg-yellow-500/10',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-white mb-1">Dashboard</h1>
        <p className="text-sm text-gray-400">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/admin/users', label: 'Manage Users', icon: '👥', desc: 'View and manage all users' },
            { href: '/admin/payments', label: 'Pending Payments', icon: '💳', desc: `${data.withdrawals.pending} pending withdrawals` },
            { href: '/admin/kyc', label: 'KYC Verifications', icon: '🪪', desc: `${data.pendingKyc} pending verifications` },
            { href: '/admin/reports', label: 'Revenue Reports', icon: '📈', desc: 'View financial reports' },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="group relative p-4 rounded-2xl border border-white/10 hover:border-miami-pink/30 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl group-hover:from-miami-pink/5 transition-all duration-300" />
              <div className="relative z-10">
                <div className="text-2xl mb-3">{action.icon}</div>
                <h3 className="text-sm font-bold text-white mb-1 group-hover:text-miami-pink transition-colors">{action.label}</h3>
                <p className="text-xs text-gray-500">{action.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}