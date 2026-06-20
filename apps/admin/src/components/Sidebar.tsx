'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  ArrowLeftRight,
  Gift,
  Shield,
  Settings,
  BarChart3,
  Wallet,
  FileText,
  Server,
  Webhook,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/users', icon: Users, label: 'Users' },
  { href: '/games', icon: Gamepad2, label: 'Games' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/bonuses', icon: Gift, label: 'Bonuses' },
  { href: '/kyc', icon: Shield, label: 'KYC Queue' },
  { href: '/wallet', icon: Wallet, label: 'Wallets' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/providers', icon: Server, label: 'Providers' },
  { href: '/webhooks', icon: Webhook, label: 'Webhooks' },
  { href: '/reports', icon: FileText, label: 'Reports' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={`bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 relative ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
          B
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm whitespace-nowrap">BROM Casino</h1>
            <p className="text-[10px] text-gray-500 whitespace-nowrap">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Bottom Section */}
      <div className="p-2 border-t border-gray-800">
        <button
          className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
