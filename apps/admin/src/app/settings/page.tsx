'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useI18n } from '@/i18n/I18nProvider';
import AdminShell from '@/components/AdminShell';
import { Settings, Save, Bell, Shield, Globe, CreditCard, Gamepad2, RefreshCw } from 'lucide-react';

const SETTINGS_SECTIONS = [
  { id: 'general', icon: Settings },
  { id: 'notifications', icon: Bell },
  { id: 'security', icon: Shield },
  { id: 'localization', icon: Globe },
  { id: 'payments', icon: CreditCard },
  { id: 'games', icon: Gamepad2 },
];

export default function SettingsPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);

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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('settings.title', 'Settings')}</h1>
            <p className="text-gray-400 text-sm mt-1">{t('settings.subtitle', 'Configure platform settings, preferences, and defaults')}</p>
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              saved
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500'
            }`}
          >
            {saved ? (
              <>{t('app.saved', '✓ Saved')}</>
            ) : (
              <><Save className="w-4 h-4" /> {t('app.save', 'Save Changes')}</>
            )}
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-56 shrink-0">
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              {SETTINGS_SECTIONS.map(section => {
                const Icon = section.icon;
                const sectionKey = `settings.sections.${section.id}`;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(sectionKey, section.id.charAt(0).toUpperCase() + section.id.slice(1))}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {activeSection === 'general' && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5">
                <h3 className="font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  {t('settings.general.title', 'General Settings')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">{t('settings.general.platformName', 'Platform Name')}</label>
                    <input className="input" defaultValue="BROM Casino" />
                  </div>
                  <div>
                    <label className="form-label">{t('settings.general.supportEmail', 'Support Email')}</label>
                    <input className="input" defaultValue="support@brom.casino" />
                  </div>
                  <div>
                    <label className="form-label">{t('settings.general.defaultCurrency', 'Default Currency')}</label>
                    <select className="input">
                      <option>TON</option>
                      <option>USDT</option>
                      <option>BTC</option>
                      <option>ETH</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">{t('settings.general.minDeposit', 'Min Deposit')}</label>
                    <input className="input" type="number" defaultValue="1" />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">{t('settings.general.maintenanceMode', 'Maintenance Mode')}</label>
                    <div className="flex items-center gap-3 mt-1">
                      <button className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium">{t('settings.general.maintenanceEnable', 'Enable')}</button>
                      <span className="text-xs text-gray-500">{t('settings.general.maintenanceDesc', 'Disables all gameplay and deposits')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5">
                <h3 className="font-semibold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  {t('settings.notifications.title', 'Notification Settings')}
                </h3>
                <div className="space-y-4">
                  {[
                    { id: 'large_deposit', label: t('settings.notifications.items.large_deposit.label', 'Large Deposits'), desc: t('settings.notifications.items.large_deposit.desc', 'Notify on deposits over 100 TON') },
                    { id: 'large_withdrawal', label: t('settings.notifications.items.large_withdrawal.label', 'Large Withdrawals'), desc: t('settings.notifications.items.large_withdrawal.desc', 'Notify on withdrawals over 50 TON') },
                    { id: 'kyc_new', label: t('settings.notifications.items.kyc_new.label', 'New KYC Submissions'), desc: t('settings.notifications.items.kyc_new.desc', 'Notify when new documents are uploaded') },
                    { id: 'suspicious', label: t('settings.notifications.items.suspicious.label', 'Suspicious Activity'), desc: t('settings.notifications.items.suspicious.desc', 'Notify on potential fraud detection') },
                    { id: 'server_health', label: t('settings.notifications.items.server_health.label', 'Server Health'), desc: t('settings.notifications.items.server_health.desc', 'Alert on service degradation or downtime') },
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  {t('settings.security.title', 'Security Settings')}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">{t('settings.security.sessionTimeout', 'Session Timeout (minutes)')}</label>
                      <input className="input" type="number" defaultValue="30" />
                    </div>
                    <div>
                      <label className="form-label">{t('settings.security.maxLoginAttempts', 'Max Login Attempts')}</label>
                      <input className="input" type="number" defaultValue="5" />
                    </div>
                    <div>
                      <label className="form-label">{t('settings.security.tfaEnforcement', '2FA Enforcement')}</label>
                      <select className="input">
                        <option>{t('settings.security.tfaDisabled', 'Disabled')}</option>
                        <option>{t('settings.security.tfaAdmin', 'Admin only')}</option>
                        <option>{t('settings.security.tfaAll', 'All users')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">{t('settings.security.ipWhitelist', 'IP Whitelist Mode')}</label>
                      <select className="input">
                        <option>{t('settings.security.ipDisabled', 'Disabled')}</option>
                        <option>{t('settings.security.ipAdmin', 'Admin panel only')}</option>
                        <option>{t('settings.security.ipApi', 'API only')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-800">
                    <label className="form-label">{t('settings.security.apiKeys', 'Admin API Keys')}</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input className="input flex-1 font-mono text-xs" value="adm_sk_••••••••••••••••" readOnly />
                      <button className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'localization' && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5">
                <h3 className="font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  {t('settings.localization.title', 'Localization Settings')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">{t('settings.localization.defaultLang', 'Default Language')}</label>
                    <select className="input">
                      <option>{t('settings.localization.lang_en', 'English')}</option>
                      <option>{t('settings.localization.lang_ru', 'Russian')}</option>
                      <option>{t('settings.localization.lang_zh', 'Chinese')}</option>
                      <option>{t('settings.localization.lang_es', 'Spanish')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">{t('settings.localization.timezone', 'Timezone')}</label>
                    <select className="input">
                      <option>{t('settings.localization.tz_utc', 'UTC+0')}</option>
                      <option>{t('settings.localization.tz_moscow', 'UTC+3 (Moscow)')}</option>
                      <option>{t('settings.localization.tz_beijing', 'UTC+8 (Beijing)')}</option>
                      <option>{t('settings.localization.tz_newyork', 'UTC-5 (New York)')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">{t('settings.localization.currencyDisplay', 'Currency Display')}</label>
                    <select className="input">
                      <option>{t('settings.localization.currency_ton', 'TON (default)')}</option>
                      <option>{t('settings.localization.currency_usdt', 'USDT')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">{t('settings.localization.dateFormat', 'Date Format')}</label>
                    <select className="input">
                      <option>{t('settings.localization.date_ymd', 'YYYY-MM-DD')}</option>
                      <option>{t('settings.localization.date_dmy', 'DD/MM/YYYY')}</option>
                      <option>{t('settings.localization.date_mdy', 'MM/DD/YYYY')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'payments' && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  {t('settings.payments.title', 'Payment Settings')}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">{t('settings.payments.minWithdrawal', 'Min Withdrawal')}</label>
                      <input className="input" type="number" defaultValue="2" />
                    </div>
                    <div>
                      <label className="form-label">{t('settings.payments.maxWithdrawal', 'Max Withdrawal')}</label>
                      <input className="input" type="number" defaultValue="1000" />
                    </div>
                    <div>
                      <label className="form-label">{t('settings.payments.withdrawalFee', 'Withdrawal Fee (%)')}</label>
                      <input className="input" type="number" defaultValue="1" step="0.1" />
                    </div>
                    <div>
                      <label className="form-label">{t('settings.payments.autoApprove', 'Auto-Approve Threshold')}</label>
                      <input className="input" type="number" defaultValue="10" />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-800">
                    <p className="text-sm font-medium mb-2">{t('settings.payments.enabledMethods', 'Enabled Payment Methods')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'ton', label: t('settings.payments.methods.ton', 'TON') },
                        { key: 'telegramStars', label: t('settings.payments.methods.telegramStars', 'Telegram Stars') },
                        { key: 'usdtTrc20', label: t('settings.payments.methods.usdtTrc20', 'USDT (TRC-20)') },
                        { key: 'usdtErc20', label: t('settings.payments.methods.usdtErc20', 'USDT (ERC-20)') },
                        { key: 'btc', label: t('settings.payments.methods.btc', 'BTC') },
                        { key: 'eth', label: t('settings.payments.methods.eth', 'ETH') },
                      ].map(method => (
                        <label key={method.key} className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50 text-sm">
                          <input type="checkbox" defaultChecked className="accent-amber-500" />
                          {method.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'games' && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5">
                <h3 className="font-semibold flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-amber-400" />
                  {t('settings.games.title', 'Game Default Settings')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">{t('settings.games.maxBet', 'Default Max Bet')}</label>
                    <input className="input" type="number" defaultValue="100" />
                  </div>
                  <div>
                    <label className="form-label">{t('settings.games.minBet', 'Default Min Bet')}</label>
                    <input className="input" type="number" defaultValue="0.1" step="0.1" />
                  </div>
                  <div>
                    <label className="form-label">{t('settings.games.rtp', 'Default RTP (%)')}</label>
                    <input className="input" type="number" defaultValue="97.5" step="0.1" />
                  </div>
                  <div>
                    <label className="form-label">{t('settings.games.houseEdge', 'House Edge (%)')}</label>
                    <input className="input" type="number" defaultValue="2.5" step="0.1" readOnly />
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-800">
                  <p className="text-sm font-medium mb-2">{t('settings.games.autoSync', 'Auto-Sync Providers')}</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50 text-sm">
                      <input type="checkbox" defaultChecked className="accent-amber-500" />
                      {t('settings.games.syncAuto', 'Sync new games automatically')}
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}