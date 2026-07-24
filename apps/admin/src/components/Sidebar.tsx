'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  ArrowLeftRight,
  Gift,
  Shield,
  Wallet,
  BarChart3,
  Server,
  Webhook,
  FileText,
  Settings,
  ChevronLeft,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'nav.users', icon: Users },
  { href: '/games', label: 'nav.games', icon: Gamepad2 },
  { href: '/transactions', label: 'nav.transactions', icon: ArrowLeftRight },
  { href: '/bonuses', label: 'nav.bonuses', icon: Gift },
  { href: '/kyc', label: 'nav.kyc', icon: Shield },
  { href: '/wallet', label: 'nav.wallet', icon: Wallet },
  { href: '/analytics', label: 'nav.analytics', icon: BarChart3 },
  { href: '/providers', label: 'nav.providers', icon: Server },
  { href: '/webhooks', label: 'nav.webhooks', icon: Webhook },
  { href: '/reports', label: 'nav.reports', icon: FileText },
  { href: '/settings', label: 'nav.settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t, lang } = useI18n();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={`bg-[rgba(10,10,15,0.9)] border-r border-[rgba(255,45,149,0.08)] flex flex-col transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-[rgba(255,45,149,0.08)]">
        <div className="w-8 h-8 rounded-lg bg-gradient-miami flex items-center justify-center text-base font-bold text-white shadow-neon-pink shrink-0">
          <span>B</span>
        </div>
        {!collapsed && (
          <span className="font-heading font-bold text-lg">
            <span className="bg-gradient-miami bg-clip-text text-transparent">BROM</span>
            <span className="text-white/60"> ADMIN</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[rgba(255,45,149,0.1)] text-[#ff2d95] shadow-[0_0_10px_rgba(255,45,149,0.05)]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[rgba(255,255,255,0.03)]'
              }`}
              title={collapsed ? t(item.label) : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#ff2d95]' : ''}`} />
              {!collapsed && <span>{t(item.label)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="p-2 border-t border-[rgba(255,45,149,0.08)]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[rgba(255,255,255,0.03)] transition-all text-sm"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>{t('nav.collapse', 'Collapse')}</span>}
        </button>
      </div>
    </aside>
  );
}