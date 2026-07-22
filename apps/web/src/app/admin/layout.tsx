'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
    ],
  },
  {
    section: 'Management',
    items: [
      { href: '/admin/users', label: 'Users', icon: '👥' },
      { href: '/admin/payments', label: 'Payments', icon: '💳' },
      { href: '/admin/games', label: 'Games', icon: '🎮' },
      { href: '/admin/bonuses', label: 'Bonuses', icon: '🎁' },
    ],
  },
  {
    section: 'Compliance',
    items: [
      { href: '/admin/kyc', label: 'KYC', icon: '🪪' },
      { href: '/admin/audit', label: 'Audit Logs', icon: '📋' },
    ],
  },
  {
    section: 'Reports',
    items: [
      { href: '/admin/reports', label: 'Reports', icon: '📈' },
    ],
  },
];

function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-casino-dark/95 backdrop-blur-xl border-r border-white/10" />
      
      {/* Neon accent line */}
      <div className="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-miami-pink via-miami-purple to-miami-cyan opacity-50" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/5">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-miami flex items-center justify-center text-sm font-bold text-white">
              B
            </div>
            {!collapsed && (
              <span className="font-heading font-bold text-lg">
                <span className="bg-gradient-miami bg-clip-text text-transparent">Admin</span>
              </span>
            )}
          </Link>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
          >
            <svg className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
          {NAV_ITEMS.map((section) => (
            <div key={section.section}>
              {!collapsed && (
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium px-3 mb-2">
                  {section.section}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                        active
                          ? 'bg-gradient-miami/10 text-white shadow-[inset_0_0_20px_rgba(255,45,149,0.05)]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-miami" />
                      )}
                      <span className={`text-lg ${active ? '' : 'group-hover:scale-110 transition-transform'}`}>
                        {item.icon}
                      </span>
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Back to site */}
        <div className="p-3 border-t border-white/5">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all group ${collapsed ? 'justify-center' : ''}`}
          >
            <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {!collapsed && <span>Back to Site</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show sidebar on login page
  const isLoginPage = pathname === '/admin/login';

  if (!mounted) {
    return <div className="min-h-screen bg-casino-dark" />;
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-casino-dark">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-16 border-b border-white/5 bg-casino-dark/80 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-medium text-white">
              {/* Page title will be set by individual pages */}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Live</span>
            </div>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
            >
              Exit Admin
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}