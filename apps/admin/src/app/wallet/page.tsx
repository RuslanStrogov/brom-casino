'use client';

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminApi } from '@/lib/api';
import { useI18n } from '@/i18n/I18nProvider';
import { Wallet, Banknote, ArrowUpRight, ArrowDownRight, Search, ExternalLink } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import AdminShell from '@/components/AdminShell';

interface WalletInfo {
  id: string;
  userId: string;
  username: string;
  email: string;
  balance: number;
  currency: string;
  totalDeposited: number;
  totalWithdrawn: number;
  status: string;
}

export default function WalletPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { t } = useI18n();
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchWallets = async () => {
      try {
        setLoading(true);
        const res = await adminApi.users.list({ limit: 100 });
        const data = res.data;
        const mapped: WalletInfo[] = (data.users || []).map((u: any) => ({
          id: u.id,
          userId: u.id,
          username: u.username || u.email?.split('@')[0] || 'unknown',
          email: u.email,
          balance: Number(u.wallet?.balance || 0),
          currency: u.wallet?.currency || 'USDT',
          totalDeposited: Number(u.totalDeposited || u._count?.deposits || 0),
          totalWithdrawn: Number(u.totalWithdrawn || 0),
          status: (u.status || 'ACTIVE').toLowerCase(),
        }));
        setWallets(mapped);
      } catch (err) {
        console.error('Failed to fetch wallets:', err);
        setWallets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWallets();
  }, [isAuthenticated]);

  const filtered = wallets.filter(w =>
    w.username.toLowerCase().includes(search.toLowerCase()) ||
    w.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const totalDeposited = wallets.reduce((sum, w) => sum + w.totalDeposited, 0);

  if (authLoading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-full">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">{t('login.pleaseLogin', 'Please log in to access this page')}</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('wallet.title', 'Wallets')}</h1>
            <p className="text-gray-400 text-sm mt-1">{t('wallet.subtitle', 'Monitor user balances and wallet activity')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title={t('wallet.totalBalance', 'Total Balance')}
            value={`$${totalBalance.toLocaleString()}`}
            change={0}
            icon={<Wallet className="w-5 h-5" />}
            color="amber"
          />
          <StatsCard
            title={t('wallet.totalDeposited', 'Total Deposited')}
            value={`$${totalDeposited.toLocaleString()}`}
            change={0}
            icon={<ArrowUpRight className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            title={t('wallet.activeWallets', 'Active Wallets')}
            value={wallets.length.toLocaleString()}
            change={0}
            icon={<Banknote className="w-5 h-5" />}
            color="blue"
          />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('wallet.searchPlaceholder', 'Search by username or email...')}
            className="input pl-10 w-full"
          />
        </div>

        {/* Wallet Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>{t('wallet.user', 'User')}</th>
                    <th>{t('wallet.balance', 'Balance')}</th>
                    <th>{t('wallet.currency', 'Currency')}</th>
                    <th>{t('wallet.deposited', 'Deposited')}</th>
                    <th>{t('wallet.withdrawn', 'Withdrawn')}</th>
                    <th>{t('wallet.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-500 py-8">{t('wallet.noWalletsFound', 'No wallets found')}</td>
                    </tr>
                  ) : (
                    filtered.map(w => (
                      <tr key={w.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-black">
                              {w.username[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{w.username}</p>
                              <p className="text-xs text-gray-500">{w.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="font-medium text-green-400">
                          ${w.balance.toLocaleString()}
                        </td>
                        <td className="text-xs text-gray-400">{w.currency}</td>
                        <td className="text-gray-300">${w.totalDeposited.toLocaleString()}</td>
                        <td className="text-gray-300">${w.totalWithdrawn.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${w.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}