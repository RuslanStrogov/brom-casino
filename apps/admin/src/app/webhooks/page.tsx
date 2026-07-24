'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useI18n } from '@/i18n/I18nProvider';
import AdminShell from '@/components/AdminShell';
import {
  Webhook,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Clock,
  Activity,
  ExternalLink,
} from 'lucide-react';

interface WebhookLog {
  id: string;
  provider: string;
  event: string;
  status: 'success' | 'failed' | 'pending';
  ip: string;
  timestamp: string;
  responseTime: number;
  payload?: string;
}

const MOCK_WEBHOOKS: WebhookLog[] = [
  { id: 'wh-001', provider: 'cryptomus', event: 'payment.completed', status: 'success', ip: '143.198.xx.xx', timestamp: '2 min ago', responseTime: 45 },
  { id: 'wh-002', provider: 'pragmatic-play', event: 'game.bet', status: 'success', ip: '5.18.xx.xx', timestamp: '5 min ago', responseTime: 120 },
  { id: 'wh-003', provider: 'cryptomus', event: 'payment.pending', status: 'success', ip: '143.198.xx.xx', timestamp: '8 min ago', responseTime: 32 },
  { id: 'wh-004', provider: 'sumsub', event: 'kyc.approved', status: 'success', ip: '185.xx.xx.xx', timestamp: '15 min ago', responseTime: 200 },
  { id: 'wh-005', provider: 'pragmatic-play', event: 'game.win', status: 'failed', ip: '5.18.xx.xx', timestamp: '22 min ago', responseTime: 5000 },
  { id: 'wh-006', provider: 'cryptomus', event: 'payment.failed', status: 'success', ip: '143.198.xx.xx', timestamp: '30 min ago', responseTime: 28 },
];

export default function WebhooksPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const { t } = useI18n();
  const [webhooks, setWebhooks] = useState<WebhookLog[]>(MOCK_WEBHOOKS);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookLog | null>(null);
  const [showPayload, setShowPayload] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">{t('app.loading', 'Loading...')}</p>
          </div>
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

  const filteredWebhooks = webhooks.filter(wh => {
    if (filter === 'all') return true;
    if (filter === 'success') return wh.status === 'success';
    if (filter === 'failed') return wh.status === 'failed';
    return wh.provider === filter;
  });

  const getStatusIcon = (status: WebhookLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      'cryptomus': 'bg-green-500/10 text-green-400 border-green-500/30',
      'pragmatic-play': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      'sumsub': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    };
    return (
      <span className={`badge text-[10px] border ${colors[provider] || 'bg-gray-800 text-gray-400'}`}>
        {provider}
      </span>
    );
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('webhooks.title', 'Webhooks')}</h1>
            <p className="text-gray-400 text-sm mt-1">{t('webhooks.subtitle', 'Monitor incoming webhook events from providers')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Activity className="w-4 h-4 text-green-400" />
              <span>{t('webhooks.live', 'Live')}</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-amber-500/50 transition-colors text-sm">
              <RefreshCw className="w-4 h-4" />
              {t('webhooks.refresh', 'Refresh')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t('webhooks.stats.total24h', 'Total (24h)')}</span>
              <Webhook className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{webhooks.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t('webhooks.stats.successful', 'Successful')}</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400 mt-2">
              {webhooks.filter(w => w.status === 'success').length}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t('webhooks.stats.failed', 'Failed')}</span>
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400 mt-2">
              {webhooks.filter(w => w.status === 'failed').length}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t('webhooks.stats.avgResponse', 'Avg Response')}</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400 mt-2">
              {Math.round(webhooks.reduce((sum, w) => sum + w.responseTime, 0) / webhooks.length)}ms
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'cryptomus', 'pragmatic-play', 'sumsub', 'success', 'failed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Webhook List */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>{t('webhooks.table.provider', 'Provider')}</th>
                  <th>{t('webhooks.table.event', 'Event')}</th>
                  <th>{t('webhooks.table.status', 'Status')}</th>
                  <th>{t('webhooks.table.ipAddress', 'IP Address')}</th>
                  <th>{t('webhooks.table.responseTime', 'Response Time')}</th>
                  <th>{t('webhooks.table.time', 'Time')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredWebhooks.map(wh => (
                  <tr key={wh.id} className="hover:bg-gray-800/30 transition-colors">
                    <td>{getProviderBadge(wh.provider)}</td>
                    <td className="text-sm font-mono">{wh.event}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(wh.status)}
                        <span className="text-sm capitalize">{wh.status}</span>
                      </div>
                    </td>
                    <td className="text-sm text-gray-500 font-mono">{wh.ip}</td>
                    <td>
                      <span className={`text-sm ${wh.responseTime > 1000 ? 'text-red-400' : 'text-green-400'}`}>
                        {wh.responseTime}ms
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">{wh.timestamp}</td>
                    <td>
                      <button
                        onClick={() => setSelectedWebhook(wh)}
                        className="p-1 rounded hover:bg-gray-800 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Webhook Detail Modal */}
        {selectedWebhook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t('webhooks.detail.title', 'Webhook Detail')}</h2>
                <button
                  onClick={() => setSelectedWebhook(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500">{t('webhooks.detail.id', 'ID')}</span>
                    <p className="text-sm font-mono">{selectedWebhook.id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{t('webhooks.detail.provider', 'Provider')}</span>
                    <p>{getProviderBadge(selectedWebhook.provider)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{t('webhooks.detail.event', 'Event')}</span>
                    <p className="text-sm font-mono">{selectedWebhook.event}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{t('webhooks.detail.status', 'Status')}</span>
                    <p>{getStatusIcon(selectedWebhook.status)} {selectedWebhook.status}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{t('webhooks.detail.ipAddress', 'IP Address')}</span>
                    <p className="text-sm font-mono">{selectedWebhook.ip}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">{t('webhooks.detail.responseTime', 'Response Time')}</span>
                    <p className="text-sm">{selectedWebhook.responseTime}ms</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{t('webhooks.detail.payload', 'Payload')}</span>
                    <button
                      onClick={() => setShowPayload(!showPayload)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                    >
                      {showPayload ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showPayload ? t('webhooks.detail.hide', 'Hide') : t('webhooks.detail.show', 'Show')}
                    </button>
                  </div>
                  {showPayload && (
                    <pre className="bg-gray-800 rounded-lg p-3 text-xs font-mono text-gray-300 overflow-x-auto">
{JSON.stringify(
  selectedWebhook.provider === 'cryptomus'
    ? { order_id: 'ord-123', amount: '100', currency: 'USDT', status: 'completed', uuid: 'uuid-123', sign: 'md5hash' }
    : selectedWebhook.provider === 'pragmatic-play'
    ? { transactionId: 'tx-456', type: 'bet', amount: 50, gameId: 'vs20olympgate', playerId: 'user-789', roundId: 'round-001' }
    : { applicantId: 'app-123', status: 'approved', reviewResult: { reviewAnswer: 'GREEN' } },
  null,
  2
)}
                    </pre>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    {t('webhooks.detail.resend', 'Resend')}
                  </button>
                  <a
                    href={`/api/admin/webhooks/${selectedWebhook.id}`}
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-gray-800 text-gray-400 border border-gray-700 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('webhooks.detail.viewInApi', 'View in API')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}