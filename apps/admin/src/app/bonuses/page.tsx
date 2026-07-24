'use client';

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';
import { useI18n } from '@/i18n/I18nProvider';
import { Gift, Percent, Users, DollarSign } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import BonusManager from '@/components/BonusManager';
import AdminShell from '@/components/AdminShell';

export default function BonusesPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState({ active: 0, claimed: 0, avgWagering: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminApi.bonuses.list();
        const data = Array.isArray(res.data) ? res.data : [];
        const active = data.filter((b: any) => b.status === 'ACTIVE').length;
        setStats({
          active,
          claimed: data.reduce((s: number, b: any) => s + (b.activeUsers || 0), 0),
          avgWagering: data.length > 0
            ? Math.round(data.reduce((s: number, b: any) => s + (b.wageringRequirement || 20), 0) / data.length)
            : 0,
        });
      } catch (err) {
        console.error('Failed to fetch bonus stats:', err);
      }
    };
    fetchStats();
  }, []);

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
            <h1 className="text-2xl font-bold">{t('bonuses.title', 'Bonuses')}</h1>
            <p className="text-gray-400 text-sm mt-1">{t('bonuses.subtitle', 'Create and manage promotional bonuses, cashback, and free spins')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title={t('bonuses.activeBonuses', 'Active Bonuses')}
            value={String(stats.active)}
            icon={<Gift className="w-5 h-5" />}
            color="amber"
          />
          <StatsCard
            title={t('bonuses.activeUsers', 'Active Users')}
            value={String(stats.claimed)}
            icon={<Users className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            title={t('bonuses.avgWagering', 'Avg Wagering')}
            value={`${stats.avgWagering}x`}
            icon={<Percent className="w-5 h-5" />}
            color="blue"
          />
          <StatsCard
            title={t('bonuses.totalBonuses', 'Total Bonuses')}
            value="From DB"
            change={0}
            icon={<DollarSign className="w-5 h-5" />}
            color="purple"
          />
        </div>

        {/* Bonus Manager */}
        <BonusManager />
      </div>
    </AdminShell>
  );
}