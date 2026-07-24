'use client';

import React from 'react';
import { Bell, Search, LogOut, User } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function Header() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAdminAuth();

  return (
    <header className="h-16 border-b border-[rgba(255,45,149,0.08)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder={t('nav.search', 'Search users, transactions, games...')}
            className="w-full bg-[#0f0f1a] border border-[rgba(255,45,149,0.1)] rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:border-[#00d4ff] focus:outline-none focus:ring-1 focus:ring-[#00d4ff]/30 transition-colors"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="bg-[#0f0f1a] border border-[rgba(255,45,149,0.1)] rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-[#00d4ff] focus:outline-none focus:ring-1 focus:ring-[#00d4ff]/30 cursor-pointer"
        >
          <option value="en">EN</option>
          <option value="ru">RU</option>
        </select>

        {/* Notifications */}
        <button className="p-2 rounded-lg bg-[#0f0f1a] border border-[rgba(255,45,149,0.1)] hover:border-[rgba(255,45,149,0.3)] transition-colors relative">
          <Bell className="w-4 h-4 text-gray-400" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#ff2d95] rounded-full border-2 border-[#0a0a0f] animate-pulse" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-3 border-l border-[rgba(255,45,149,0.08)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff2d95] to-[#b44aff] flex items-center justify-center shadow-neon-pink">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-200">{user?.email || 'Admin'}</p>
              <p className="text-xs text-gray-500">{t('header.admin', 'Administrator')}</p>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-[rgba(255,45,149,0.1)] transition-colors text-gray-500 hover:text-[#ff2d95]">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}