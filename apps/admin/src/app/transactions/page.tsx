'use client';

import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';
import { useI18n } from '@/i18n/I18nProvider';
import { ArrowLeftRight, ArrowDownCircle, ArrowUpCircle, Clock } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import TransactionTable from '@/components/TransactionTable';
import AdminShell from '@/components/AdminShell';

export default function TransactionsPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const { t } = useI18n();
  const [stats, setStats] = React.useState({ deposits: 0, withdrawals: 0, pending: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const fetchStats = async () => {
      try {
        const res = await adminApi.dashboard.getStats();
        const data = res.data;
        setStats({
          deposits: Number(data.deposits?.today || 0),
          withdrawals: Number(data.withdrawals?.today || 0),
          pending: data.withdrawals?.pending || 0,
        });
      } catch (err) {
        console.error('Failed to fetch transaction stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-full">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
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
            <h1 className="text-2xl font-bold">{t('transactions.title', 'Transactions')}</h1>
            <p className="text-gray-400 text-sm mt-1">{t('transactions.subtitle', 'Monitor deposits, withdrawals, and financial activity')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-amber-500/50 transition-colors text-sm">
              <Clock className="w-4 h-4" />
              {t('transactions.exportCsv', 'Export CSV')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title={t('transactions.totalTransactions', 'Total Transactions')}
            value={(stats.deposits + stats.withdrawals).toLocaleString()}
            change={0}
            icon={<ArrowLeftRight className="w-5 h-5" />}
            color="amber"
          />
          <StatsCard
            title={t('transactions.deposit', 'Deposits')}
            value={`$${stats.deposits.toLocaleString()}`}
            change={0}
            icon={<ArrowDownCircle className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            title={t('transactions.withdrawal', 'Withdrawals')}
            value={`$${stats.withdrawals.toLocaleString()}`}
            change={0}
            icon={<ArrowUpCircle className="w-5 h-5" />}
            color="red"
          />
          <StatsCard
            title={t('transactions.pending', 'Pending')}
            value={stats.pending.toLocaleString()}
            change={0}
            icon={<Clock className="w-5 h-5" />}
            color="blue"
          />
        </div>

        {/* Transaction Table */}
        <TransactionTable />
      </div>
    </AdminShell>
  );
}