'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Settings, Save, Bell, Shield, Globe, CreditCard, Gamepad2, Mail, Palette, RefreshCw } from 'lucide-react';

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'localization', label: 'Localization', icon: Globe },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'games', label: 'Game Defaults', icon: Gamepad2 },
];

export default function SettingsPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Please log in to access this page</p>
      </div>
    );
  }

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Configure platform settings, preferences, and defaults</p>
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
            <>✓ Saved</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-56 shrink-0">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {SETTINGS_SECTIONS.map(section => {
              const Icon = section.icon;
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
                  {section.label}
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
                General Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Platform Name</label>
                  <input className="input" defaultValue="BROM Casino" />
                </div>
                <div>
                  <label className="form-label">Support Email</label>
                  <input className="input" defaultValue="support@brom.casino" />
                </div>
                <div>
                  <label className="form-label">Default Currency</label>
                  <select className="input">
                    <option>TON</option>
                    <option>USDT</option>
                    <option>BTC</option>
                    <option>ETH</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Min Deposit</label>
                  <input className="input" type="number" defaultValue="1" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Maintenance Mode</label>
                  <div className="flex items-center gap-3 mt-1">
                    <button className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium">Enable</button>
                    <span className="text-xs text-gray-500">Disables all gameplay and deposits</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                Notification Settings
              </h3>
              <div className="space-y-4">
                {[
                  { id: 'large_deposit', label: 'Large Deposits', desc: 'Notify on deposits over 100 TON' },
                  { id: 'large_withdrawal', label: 'Large Withdrawals', desc: 'Notify on withdrawals over 50 TON' },
                  { id: 'kyc_new', label: 'New KYC Submissions', desc: 'Notify when new documents are uploaded' },
                  { id: 'suspicious', label: 'Suspicious Activity', desc: 'Notify on potential fraud detection' },
                  { id: 'server_health', label: 'Server Health', desc: 'Alert on service degradation or downtime' },
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
                Security Settings
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Session Timeout (minutes)</label>
                    <input className="input" type="number" defaultValue="30" />
                  </div>
                  <div>
                    <label className="form-label">Max Login Attempts</label>
                    <input className="input" type="number" defaultValue="5" />
                  </div>
                  <div>
                    <label className="form-label">2FA Enforcement</label>
                    <select className="input">
                      <option>Disabled</option>
                      <option>Admin only</option>
                      <option>All users</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">IP Whitelist Mode</label>
                    <select className="input">
                      <option>Disabled</option>
                      <option>Admin panel only</option>
                      <option>API only</option>
                    </select>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-800">
                  <label className="form-label">Admin API Keys</label>
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
                Localization Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Default Language</label>
                  <select className="input">
                    <option>English</option>
                    <option>Russian</option>
                    <option>Chinese</option>
                    <option>Spanish</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Timezone</label>
                  <select className="input">
                    <option>UTC+0</option>
                    <option>UTC+3 (Moscow)</option>
                    <option>UTC+8 (Beijing)</option>
                    <option>UTC-5 (New York)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Currency Display</label>
                  <select className="input">
                    <option>TON (default)</option>
                    <option>USDT</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Date Format</label>
                  <select className="input">
                    <option>YYYY-MM-DD</option>
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'payments' && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                Payment Settings
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Min Withdrawal</label>
                    <input className="input" type="number" defaultValue="2" />
                  </div>
                  <div>
                    <label className="form-label">Max Withdrawal</label>
                    <input className="input" type="number" defaultValue="1000" />
                  </div>
                  <div>
                    <label className="form-label">Withdrawal Fee (%)</label>
                    <input className="input" type="number" defaultValue="1" step="0.1" />
                  </div>
                  <div>
                    <label className="form-label">Auto-Approve Threshold</label>
                    <input className="input" type="number" defaultValue="10" />
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-800">
                  <p className="text-sm font-medium mb-2">Enabled Payment Methods</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['TON', 'Telegram Stars', 'USDT (TRC-20)', 'USDT (ERC-20)', 'BTC', 'ETH'].map(method => (
                      <label key={method} className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50 text-sm">
                        <input type="checkbox" defaultChecked className="accent-amber-500" />
                        {method}
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
                Game Default Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Default Max Bet</label>
                  <input className="input" type="number" defaultValue="100" />
                </div>
                <div>
                  <label className="form-label">Default Min Bet</label>
                  <input className="input" type="number" defaultValue="0.1" step="0.1" />
                </div>
                <div>
                  <label className="form-label">Default RTP (%)</label>
                  <input className="input" type="number" defaultValue="97.5" step="0.1" />
                </div>
                <div>
                  <label className="form-label">House Edge (%)</label>
                  <input className="input" type="number" defaultValue="2.5" step="0.1" readOnly />
                </div>
              </div>
              <div className="pt-3 border-t border-gray-800">
                <p className="text-sm font-medium mb-2">Auto-Sync Providers</p>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50 text-sm">
                    <input type="checkbox" defaultChecked className="accent-amber-500" />
                    Sync new games automatically
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}