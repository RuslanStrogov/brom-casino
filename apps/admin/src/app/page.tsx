'use client';

import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';
import { useI18n } from '@/i18n/I18nProvider';
import { DollarSign, Users, Gamepad2, TrendingUp, Activity, Wallet, ArrowDownRight } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import UserTable from '@/components/UserTable';
import TransactionTable from '@/components/TransactionTable';
import GameTable from '@/components/GameTable';
import BonusManager from '@/components/BonusManager';
import KycQueue from '@/components/KycQueue';
import AdminShell from '@/components/AdminShell';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalBets: number;
  grossGamingRevenue: number;
  pendingKyc: number;
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const { t } = useI18n();
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminApi.dashboard.getStats();
        const data = res.data;

        setStats({
          totalUsers: data.users.total,
          activeUsers: data.users.active,
          newUsersToday: data.users.newToday,
          totalDeposits: Number(data.deposits.today),
          totalWithdrawals: Number(data.withdrawals.today),
          pendingWithdrawals: data.withdrawals.pending,
          totalBets: Number(data.bets.today),
          grossGamingRevenue: data.grossGamingRevenue,
          pendingKyc: data.pendingKyc,
        });
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setStats({
          totalUsers: 0, activeUsers: 0, newUsersToday: 0,
          totalDeposits: 0, totalWithdrawals: 0, pendingWithdrawals: 0,
          totalBets: 0, grossGamingRevenue: 0, pendingKyc: 0,
        });
        setError(t('common.failedToLoad', 'Failed to load stats'));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, t]);

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">{t('common.loading', 'Loading dashboard...')}</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('dashboard.title', 'Dashboard')}</h1>
            <p className="text-gray-400 text-sm mt-1">{t('dashboard.subtitle', 'Overview of BROM Casino performance')}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Activity className="w-4 h-4 text-green-400" />
            <span>{t('common.live', 'Live')}</span>
            <span className="text-gray-600">•</span>
            <span>{loading ? t('common.loading', 'Loading...') : t('dashboard.updatedLive', 'Updated live')}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={t('dashboard.totalDeposits', 'Total Deposits')}
            value={`$${(stats?.totalDeposits ?? 0).toLocaleString()}`}
            change={0}
            icon={<DollarSign className="w-5 h-5" />}
            color="amber"
          />
          <StatsCard
            title={t('dashboard.totalUsers', 'Total Users')}
            value={(stats?.totalUsers ?? 0).toLocaleString()}
            change={0}
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <StatsCard
            title={t('dashboard.activeUsers', 'Active Users')}
            value={(stats?.activeUsers ?? 0).toLocaleString()}
            change={0}
            icon={<Activity className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            title={t('dashboard.totalBets', 'Total Bets')}
            value={(stats?.totalBets ?? 0).toLocaleString()}
            change={0}
            icon={<Gamepad2 className="w-5 h-5" />}
            color="purple"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{t('dashboard.totalBetsAmount', 'Total Bets Amount')}</span>
              <Wallet className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-2xl font-bold">${(stats?.totalBets ?? 0).toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1 text-gray-400 text-sm">
              <span>{t('common.today', 'Today')}</span>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{t('dashboard.grossGamingRevenue', 'Gross Gaming Revenue')}</span>
              <TrendingUp className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-green-400">${(stats?.grossGamingRevenue ?? 0).toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1 text-gray-400 text-sm">
              <span>{t('dashboard.thisMonth', 'This month')}</span>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{t('dashboard.pendingWithdrawals', 'Pending Withdrawals')}</span>
              <ArrowDownRight className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats?.pendingWithdrawals ?? 0}</p>
            <div className="flex items-center gap-1 mt-1 text-gray-400 text-sm">
              <span>{t('dashboard.awaitingApproval', 'Awaiting approval')}</span>
            </div>
          </div>
        </div>

        {/* KYC & New Users Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{t('dashboard.newUsersToday', 'New Users Today')}</span>
              <Users className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-2xl font-bold">{stats?.newUsersToday ?? 0}</p>
            <div className="flex items-center gap-1 mt-1 text-gray-400 text-sm">
              <span>{t('dashboard.registeredToday', 'Registered today')}</span>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{t('dashboard.pendingKyc', 'Pending KYC')}</span>
              <Activity className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats?.pendingKyc ?? 0}</p>
            <div className="flex items-center gap-1 mt-1 text-gray-400 text-sm">
              <span>{t('dashboard.awaitingVerification', 'Awaiting verification')}</span>
            </div>
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
    </AdminShell>
  );
}