'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useBalance } from '@/hooks/useBalance';
import { BalanceWidget } from './BalanceWidget';
import { AuthModal } from './AuthModal';
import { isSoundEnabled, toggleSound } from '@/lib/sounds';

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { balance } = useBalance();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setSoundEnabled(isSoundEnabled());
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    toggleSound(newState);
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '#games', label: 'Games' },
    { href: '/wallet', label: 'Wallet' },
    { href: '#provably-fair', label: 'Fairness' },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-[rgba(10,10,15,0.85)] shadow-[0_4px_30px_rgba(0,0,0,0.3)]' 
        : 'bg-[rgba(10,10,15,0.5)]'
    } backdrop-blur-xl border-b border-[rgba(255,45,149,0.08)]`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo-brom-bet.png"
              alt="BROM BET"
              className="h-9 md:h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(0,208,240,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(0,208,240,0.5)] transition-all duration-300"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-all relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-miami transition-all duration-300 group-hover:w-3/4 rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-2 text-gray-400 hover:text-miami-cyan transition-colors relative"
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
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

            {isAuthenticated ? (
              <>
                <BalanceWidget balance={balance} />
                <div className="hidden md:flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-gradient-miami flex items-center justify-center text-xs font-bold text-white">
                      {(user?.username || 'P')[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-300">
                      {user?.username || 'Player'}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-sm rounded-lg border border-white/10 text-gray-400 hover:text-miami-pink hover:border-miami-pink/30 transition-all"
                  >
                    Exit
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 text-sm rounded-lg text-gray-300 hover:text-white transition-all"
                >
                  Log In
                </button>
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 text-sm rounded-lg bg-gradient-miami text-white font-medium hover:shadow-[0_0_20px_rgba(255,45,149,0.3)] transition-all"
                >
                  Sign Up
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <>
                  <div className="border-t border-white/5 pt-3 mt-2 px-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-miami flex items-center justify-center text-sm font-bold text-white">
                        {(user?.username || 'P')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-white">@{user?.username || 'Player'}</p>
                        <p className="text-xs text-gray-400">{(Number(balance) || 0).toFixed(2)} USDT</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="mx-4 px-4 py-2 text-sm text-left text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-all"
                  >
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  );
}
