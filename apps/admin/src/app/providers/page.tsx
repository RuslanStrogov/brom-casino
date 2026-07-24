'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useI18n } from '@/i18n/I18nProvider';
import AdminShell from '@/components/AdminShell';
import {
  Server,
  ExternalLink,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  type: 'game' | 'payment' | 'kyc';
  status: 'active' | 'inactive' | 'error';
  mode: 'real' | 'demo' | 'hybrid';
  endpoint?: string;
  webhookUrl?: string;
  gameCount?: number;
  apiStatus: 'connected' | 'disconnected' | 'pending';
  lastPing?: string;
  description: string;
}

const MOCK_PROVIDERS: Provider[] = [
  {
    id: 'pragmatic-play',
    name: 'Pragmatic Play',
    type: 'game',
    status: 'active',
    mode: 'hybrid',
    endpoint: 'https://api.pragmaticplay.net',
    webhookUrl: '/api/payments/webhook/pragmatic-play',
    gameCount: 20,
    apiStatus: 'connected',
    lastPing: '2 min ago',
    description: 'Leading provider of slots, live casino, and table games',
  },
  {
    id: 'cryptomus',
    name: 'Cryptomus',
    type: 'payment',
    status: 'active',
    mode: 'hybrid',
    endpoint: 'https://api.cryptomus.com/v1',
    webhookUrl: '/api/payments/webhook/cryptomus',
    apiStatus: 'connected',
    lastPing: '5 min ago',
    description: 'Crypto payment gateway supporting 20+ cryptocurrencies',
  },
  {
    id: 'sumsub',
    name: 'Sumsub',
    type: 'kyc',
    status: 'active',
    mode: 'hybrid',
    endpoint: 'https://api.sumsub.com',
    webhookUrl: '/api/payments/webhook/sumsub',
    apiStatus: 'connected',
    lastPing: '10 min ago',
    description: 'KYC/AML verification and identity proofing',
  },
  {
    id: 'evolution',
    name: 'Evolution Gaming',
    type: 'game',
    status: 'inactive',
    mode: 'demo',
    endpoint: 'https://api.evolutiongaming.com',
    gameCount: 0,
    apiStatus: 'disconnected',
    description: 'Premium live dealer games (roulette, blackjack, baccarat)',
  },
  {
    id: 'metamask',
    name: 'MetaMask (Web3)',
    type: 'payment',
    status: 'inactive',
    mode: 'demo',
    apiStatus: 'disconnected',
    description: 'Web3 wallet integration for ETH/BSC/Polygon',
  },
];

export default function ProvidersPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const { t } = useI18n();
  const [providers, setProviders] = useState<Provider[]>(MOCK_PROVIDERS);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

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

  const toggleProviderStatus = (id: string) => {
    setProviders(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: p.status === 'active' ? 'inactive' : 'active', apiStatus: p.status === 'active' ? 'disconnected' : 'connected' }
          : p
      )
    );
  };

  const toggleProviderMode = (id: string) => {
    setProviders(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, mode: p.mode === 'real' ? 'demo' : p.mode === 'demo' ? 'hybrid' : 'real' }
          : p
      )
    );
  };

  const getStatusIcon = (status: Provider['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const getApiStatusBadge = (status: Provider['apiStatus']) => {
    switch (status) {
      case 'connected':
        return <span className="badge badge-success text-[10px]">{t('providers.connected', 'Connected')}</span>;
      case 'disconnected':
        return <span className="badge badge-danger text-[10px]">{t('providers.disconnected', 'Disconnected')}</span>;
      case 'pending':
        return <span className="badge badge-warning text-[10px]">{t('app.loading', 'Pending')}</span>;
    }
  };

  const getTypeBadge = (type: Provider['type']) => {
    const colors = {
      game: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      payment: 'bg-green-500/10 text-green-400 border-green-500/30',
      kyc: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    };
    return (
      <span className={`badge text-[10px] border ${colors[type]}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  const getModeBadge = (mode: Provider['mode']) => {
    const colors = {
      real: 'bg-red-500/10 text-red-400',
      demo: 'bg-yellow-500/10 text-yellow-400',
      hybrid: 'bg-blue-500/10 text-blue-400',
    };
    return (
      <span className={`badge text-[10px] ${colors[mode]}`}>
        {mode.toUpperCase()}
      </span>
    );
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('providers.title', 'Providers')}</h1>
            <p className="text-gray-400 text-sm mt-1">{t('providers.subtitle', 'Manage game, payment, and KYC integrations')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-amber-500/50 transition-colors text-sm">
              <RefreshCw className="w-4 h-4" />
              {t('providers.testAll', 'Test All')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t('providers.stats.total', 'Total Providers')}</span>
              <Server className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{providers.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t('providers.stats.active', 'Active')}</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400 mt-2">
              {providers.filter(p => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t('providers.stats.connected', 'Connected')}</span>
              <CheckCircle className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400 mt-2">
              {providers.filter(p => p.apiStatus === 'connected').length}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{t('providers.stats.totalGames', 'Total Games')}</span>
              <Server className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400 mt-2">
              {providers.reduce((sum, p) => sum + (p.gameCount || 0), 0)}
            </p>
          </div>
        </div>

        {/* Provider Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {providers.map(provider => (
            <div
              key={provider.id}
              className={`bg-gray-900 rounded-xl border transition-all cursor-pointer ${
                selectedProvider?.id === provider.id
                  ? 'border-amber-500/50 shadow-lg shadow-amber-500/5'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
              onClick={() => setSelectedProvider(provider)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      provider.type === 'game' ? 'bg-purple-500/10' :
                      provider.type === 'payment' ? 'bg-green-500/10' : 'bg-blue-500/10'
                    }`}>
                      {provider.type === 'game' ? <Gamepad2 className="w-5 h-5 text-purple-400" /> :
                       provider.type === 'payment' ? <Wallet className="w-5 h-5 text-green-400" /> :
                       <Shield className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{provider.name}</h3>
                      <p className="text-xs text-gray-500">{provider.description}</p>
                    </div>
                  </div>
                  {getStatusIcon(provider.status)}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {getTypeBadge(provider.type)}
                  {getModeBadge(provider.mode)}
                  {getApiStatusBadge(provider.apiStatus)}
                  {provider.gameCount !== undefined && (
                    <span className="badge text-[10px] bg-gray-800 text-gray-400">
                      {provider.gameCount} {t('providers.gamesLabel', 'games')}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {t('providers.lastPing', 'Last ping')}: {provider.lastPing || t('providers.na', 'N/A')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProviderMode(provider.id);
                      }}
                      className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                      {provider.mode.toUpperCase()}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProviderStatus(provider.id);
                      }}
                      className={`p-1 rounded transition-colors ${
                        provider.status === 'active'
                          ? 'text-green-400 hover:text-red-400'
                          : 'text-gray-500 hover:text-green-400'
                      }`}
                    >
                      {provider.status === 'active' ? (
                        <Power className="w-4 h-4" />
                      ) : (
                        <PowerOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Provider Detail Panel */}
        {selectedProvider && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{selectedProvider.name} {t('providers.detail.settings', 'Settings')}</h2>
              <button
                onClick={() => setSelectedProvider(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* API Configuration */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">{t('providers.detail.apiConfig', 'API Configuration')}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('providers.detail.endpoint', 'Endpoint')}</label>
                    <input
                      type="text"
                      defaultValue={selectedProvider.endpoint || ''}
                      className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-amber-500 focus:outline-none text-white"
                      placeholder="https://api.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('providers.detail.apiKey', 'API Key')}</label>
                    <div className="relative">
                      <input
                        type={showSecrets[selectedProvider.id] ? 'text' : 'password'}
                        defaultValue="«redacted:sk_live_…»"
                        className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-amber-500 focus:outline-none text-white pr-10"
                        placeholder={t('providers.detail.enterApiKey', 'Enter API key')}
                      />
                      <button
                        onClick={() => setShowSecrets(prev => ({ ...prev, [selectedProvider.id]: !prev[selectedProvider.id] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showSecrets[selectedProvider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('providers.detail.webhookUrl', 'Webhook URL')}</label>
                    <input
                      type="text"
                      defaultValue={selectedProvider.webhookUrl || ''}
                      className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-amber-500 focus:outline-none text-white"
                      placeholder="/api/webhook/provider"
                    />
                  </div>
                </div>
              </div>

              {/* Mode & Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">{t('providers.detail.modeStatus', 'Mode & Status')}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('providers.detail.operationMode', 'Operation Mode')}</label>
                    <select
                      defaultValue={selectedProvider.mode}
                      className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-amber-500 focus:outline-none text-white"
                    >
                      <option value="real">{t('providers.detail.modeReal', 'Real (Live API)')}</option>
                      <option value="demo">{t('providers.detail.modeDemo', 'Demo (Sandbox)')}</option>
                      <option value="hybrid">{t('providers.detail.modeHybrid', 'Hybrid (Try real, fallback to demo)')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('providers.detail.statusLabel', 'Status')}</label>
                    <div className="flex items-center gap-3">
                      <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedProvider.status === 'active'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        {t('providers.detail.statusActive', 'Active')}
                      </button>
                      <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedProvider.status === 'inactive'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}
                      >
                        {t('providers.detail.statusInactive', 'Inactive')}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('providers.detail.actions', 'Actions')}</label>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                        <RefreshCw className="w-3 h-3" />
                        {t('providers.detail.testConnection', 'Test Connection')}
                      </button>
                      <a
                        href={selectedProvider.endpoint}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-400 border border-gray-700 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {t('providers.detail.docs', 'Docs')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button className="px-4 py-2 rounded-lg text-sm bg-gray-800 text-gray-400 border border-gray-700 hover:text-white transition-colors">
                {t('app.cancel', 'Cancel')}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium hover:from-amber-400 hover:to-amber-500 transition-all">
                <Save className="w-4 h-4" />
                {t('app.save', 'Save Changes')}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function Gamepad2(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="15" y1="13" x2="15.01" y2="13" /><line x1="18" y1="11" x2="18.01" y2="11" /><rect width="20" height="12" x="2" y="6" rx="2" />
    </svg>
  );
}

function Wallet(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function Shield(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}
