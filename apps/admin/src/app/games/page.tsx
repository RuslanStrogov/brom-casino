'use client';

import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';
import { useI18n } from '@/i18n/I18nProvider';
import { Gamepad2, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import GameTable from '@/components/GameTable';
import AdminShell from '@/components/AdminShell';

export default function GamesPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const { t } = useI18n();
  const [stats, setStats] = React.useState({ total: 0, totalBets: 0, avgRtp: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        const [gamesRes, dashboardRes] = await Promise.all([
          adminApi.games.list({ limit: 100 }),
          adminApi.dashboard.getStats(),
        ]);

        const games = gamesRes.data.games || [];
        const avgRtp = games.length > 0
          ? games.reduce((sum: number, g: any) => sum + Number(g.rtp || 0), 0) / games.length
          : 0;

        setStats({
          total: games.length,
          totalBets: Number(dashboardRes.data.bets?.today || 0),
          avgRtp: Math.round(avgRtp * 10) / 10,
        });
      } catch (err) {
        console.error('Failed to fetch game stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
            <h1 className="text-2xl font-bold">{t('games.title', 'Games')}</h1>
            <p className="text-gray-400 text-sm mt-1">{t('games.subtitle', 'Manage games, monitor RTP, and configure game providers')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium hover:from-amber-400 hover:to-amber-500 transition-all text-sm">
              <TrendingUp className="w-4 h-4" />
              {t('games.syncGames', 'Sync Games')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title={t('games.totalGames', 'Total Games')}
            value={stats.total.toLocaleString()}
            change={0}
            icon={<Gamepad2 className="w-5 h-5" />}
            color="purple"
          />
          <StatsCard
            title={t('games.totalBets', 'Total Bets')}
            value={stats.totalBets.toLocaleString()}
            change={0}
            icon={<BarChart3 className="w-5 h-5" />}
            color="amber"
          />
          <StatsCard
            title={t('games.totalWagered', 'Total Wagered')}
            value={`$${stats.totalBets.toLocaleString()}`}
            change={0}
            icon={<DollarSign className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            title={t('games.avgRtp', 'Avg RTP')}
            value={`${stats.avgRtp}%`}
            change={0}
            icon={<TrendingUp className="w-5 h-5" />}
            color="blue"
          />
        </div>

        {/* Game Table */}
        <GameTable />
      </div>
    </AdminShell>
  );
}