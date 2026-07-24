'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useBalance } from '@/hooks/useBalance';
import { BalanceWidget } from './BalanceWidget';
import { AuthModal } from './AuthModal';
import { isSoundEnabled, toggleSound } from '@/lib/sounds';
import { useI18n } from '@/i18n/I18nProvider';
import { useChatStore } from '@/stores/chatStore';

/** Real-time clock component — ЧЧ:ММ:СС */
function RealtimeClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-xs font-mono text-gray-400 tabular-nums tracking-wider min-w-[4.5rem] text-right">
      {time}
    </span>
  );
}

/** Mini divider icon between groups */
function MiniDivider() {
  return (
    <svg className="w-3.5 h-3.5 text-white/15 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { balance } = useBalance();
  const { t, lang, setLang } = useI18n();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navMenuRef = useRef<HTMLDivElement>(null);

  const { isOpen: chatOpen, toggle: toggleChat, setOpen: setChatOpen, actionFeedback, setActionFeedback } = useChatStore();

  useEffect(() => {
    setSoundEnabled(isSoundEnabled());
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Close nav menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navMenuRef.current && !navMenuRef.current.contains(e.target as Node)) {
        setNavMenuOpen(false);
      }
    };
    if (navMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navMenuOpen]);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    toggleSound(newState);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const toggleLang = () => {
    setLang(lang === 'en' ? 'ru' : 'en');
  };

  const navLinks = [
    { href: '/', label: t('nav.home', 'Home'), icon: '🏠' },
    { href: '/games', label: t('nav.games', 'Games'), icon: '🎮' },
    { href: '/favorites', label: t('nav.favorites', 'Favorites'), icon: '⭐' },
    { href: '/wallet', label: t('nav.wallet', 'Wallet'), icon: '💳' },
    { href: '#provably-fair', label: t('nav.fairness', 'Fairness'), icon: '🔒' },
  ];

  // Auto-clear action feedback after timeout
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback, setActionFeedback]);

  // Close chat when clicking outside the chat panel
  useEffect(() => {
    if (!chatOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-chat-toggle]') || target.closest('[data-chat-panel]')) return;
      setChatOpen(false);
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [chatOpen, setChatOpen]);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-[rgba(10,10,15,0.85)] shadow-[0_4px_30px_rgba(0,0,0,0.3)]' 
        : 'bg-[rgba(10,10,15,0.5)]'
    } backdrop-blur-xl border-b border-[rgba(255,45,149,0.08)]`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* ===== LEFT GROUP: Logo + Balance + Username ===== */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <img
                src="/logo-brom-bet.png"
                alt="BROM BET"
                className="h-9 md:h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(0,208,240,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(0,208,240,0.5)] transition-all duration-300"
              />
            </Link>

            {isAuthenticated && (
              <>
                <BalanceWidget balance={balance} />

                {/* User Menu Dropdown — same height as BalanceWidget */}
                <div className="relative hidden md:inline-block" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-miami-pink/20 transition-all cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-miami flex items-center justify-center text-xs font-bold text-white">
                      {(user?.username || 'P')[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-300">
                      {user?.username || 'Player'}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute left-0 mt-2 w-52 rounded-2xl border border-white/10 bg-[rgba(15,15,25,0.98)] backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm font-medium text-white">{user?.username || 'Player'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{(Number(balance) || 0).toFixed(2)} USDT</p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/wallet"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <svg className="w-4 h-4 text-miami-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          {t('header.walletLabel', 'Wallet')}
                        </Link>

                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                          >
                            <svg className="w-4 h-4 text-miami-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 012 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            {t('header.adminPanel', 'Admin Panel')}
                          </Link>
                        )}

                        <div className="border-t border-white/5 my-1" />

                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-all text-left"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          {t('auth.logout', 'Logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ===== RIGHT GROUP: Nav → AI | Lang + Sound + Clock ===== */}
          <div className="flex items-center gap-1 md:gap-2">

            {/* 1. Navigation Menu — desktop only */}
            <div className="relative hidden md:inline-block" ref={navMenuRef}>
              <button
                onClick={() => setNavMenuOpen(!navMenuOpen)}
                className="p-2 text-gray-400 hover:text-miami-cyan hover:bg-white/5 rounded-lg transition-all"
                title="Меню навигации"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>

              {navMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-gradient-to-b from-[rgba(20,20,30,0.98)] to-[rgba(10,10,20,0.98)] backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">
                  <div className="py-2 px-2 space-y-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setNavMenuOpen(false)}
                        className="flex items-center gap-4 px-4 py-4 text-base text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        <span className="text-xl">{link.icon}</span>
                        <span className="font-medium">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. AI Assistant — cosmic sparkle icon */}
            <div className="relative">
              <button
                data-chat-toggle
                onClick={() => toggleChat()}
                className={`p-2 rounded-lg transition-all ${
                  chatOpen
                    ? 'bg-miami-cyan/20 text-miami-cyan border border-miami-cyan/30'
                    : 'text-gray-400 hover:text-miami-cyan hover:bg-white/5 border border-transparent'
                }`}
                title="ИИ Ассистент"
              >
                {/* Cosmic / sparkle icon */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </button>

              {actionFeedback && (
                <div className="absolute right-0 top-full mt-2 z-[60] animate-fade-in rounded-xl bg-gradient-to-r from-pink-600/90 to-purple-700/90 backdrop-blur-md px-4 py-2.5 shadow-lg shadow-pink-500/20 border border-white/10 text-sm text-white whitespace-nowrap pointer-events-none transition-all duration-300">
                  {actionFeedback}
                </div>
              )}
            </div>

            {/* === Group separator (AI → Lang/Sound/Clock) === */}
            <MiniDivider />

            {/* 3. Language Switcher — flag icon, smaller */}
            <button
              onClick={toggleLang}
              className="p-1.5 text-base rounded-md border border-white/10 hover:border-miami-cyan/40 hover:bg-white/5 transition-all leading-none"
              title={lang === 'en' ? 'Switch to Russian' : 'Switch to English'}
            >
              {lang === 'en' ? '🇷🇺' : '🇬🇧'}
            </button>

            {/* 4. Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-2 text-gray-400 hover:text-miami-cyan transition-colors relative"
              title={soundEnabled ? t('header.soundOn', 'Mute sounds') : t('header.soundOff', 'Enable sounds')}
            >
              {soundEnabled ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>

            {/* 5. Clock — hidden on mobile */}
            <div className="hidden md:flex items-center gap-1.5">
              <RealtimeClock />
            </div>

            {/* Not authenticated: Login/Signup buttons — hidden on mobile (in hamburger menu) */}
            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 text-sm rounded-lg text-gray-300 hover:text-white transition-all"
                >
                  {t('auth.login', 'Log In')}
                </button>
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 text-sm rounded-lg bg-gradient-miami text-white font-medium hover:shadow-[0_0_20px_rgba(255,45,149,0.3)] transition-all"
                >
                  {t('auth.signup', 'Sign Up')}
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu — как у чата: крупные пункты, иконки, тёмный градиент */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5 animate-fade-in">
            <nav className="flex flex-col gap-1 px-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-4 py-4 text-base text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              {isAuthenticated && (
                <>
                  <div className="border-t border-white/10 pt-4 mt-2 px-2">
                    <div className="flex items-center gap-3 mb-3 px-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-miami flex items-center justify-center text-base font-bold text-white">
                        {(user?.username || 'P')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">@{user?.username || 'Player'}</p>
                        <p className="text-xs text-gray-400">{(Number(balance) || 0).toFixed(2)} USDT</p>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-4 py-4 text-base text-gray-200 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                      <svg className="w-5 h-5 text-miami-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 012 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="font-medium">{t('header.adminPanel', 'Admin Panel')}</span>
                    </Link>
                  )}

                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-4 px-4 py-4 text-base text-left text-red-400 hover:text-red-300 hover:bg-white/5 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">{t('auth.logout', 'Logout')}</span>
                  </button>
                </>
              )}

              {/* Login/Signup for mobile — неавторизованные */}
              {!isAuthenticated && (
                <div className="border-t border-white/10 pt-4 mt-2 px-2 space-y-2">
                  <button
                    onClick={() => { setShowAuth(true); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-4 text-base rounded-xl text-gray-200 hover:text-white hover:bg-white/5 transition-all text-left"
                  >
                    {t('auth.login', 'Log In')}
                  </button>
                  <button
                    onClick={() => { setShowAuth(true); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-4 text-base rounded-xl bg-gradient-miami text-white font-medium hover:shadow-[0_0_20px_rgba(255,45,149,0.3)] transition-all text-left"
                  >
                    {t('auth.signup', 'Sign Up')}
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  );
}