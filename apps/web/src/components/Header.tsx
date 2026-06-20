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

  useEffect(() => {
    setSoundEnabled(isSoundEnabled());
  }, []);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    toggleSound(newState);
  };

  return (
    <header className="sticky top-0 z-50 bg-casino-darker/95 backdrop-blur-md border-b border-casino-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎰</span>
            <span className="text-xl font-display font-bold bg-gradient-gold bg-clip-text text-transparent">
              Brom Casino
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-300 hover:text-casino-gold transition-colors">
              Home
            </Link>
            <Link href="#games" className="text-sm text-gray-300 hover:text-casino-gold transition-colors">
              Games
            </Link>
            <Link href="#provably-fair" className="text-sm text-gray-300 hover:text-casino-gold transition-colors">
              Provably Fair
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-2 text-gray-400 hover:text-casino-gold transition-colors"
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
                <div className="hidden md:flex items-center gap-3">
                  <span className="text-sm text-gray-400">
                    Hi, <span className="text-casino-gold">{user?.username || 'Player'}</span>
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-sm rounded-lg border border-casino-border text-gray-400 hover:text-white hover:border-casino-gold/50 transition-all"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-casino-gold/50 text-casino-gold hover:bg-casino-gold/10 transition-all"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gradient-gold text-casino-dark font-medium hover:opacity-90 transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
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
          <div className="md:hidden py-4 border-t border-casino-border animate-fade-in">
            <nav className="flex flex-col gap-3">
              <Link href="/" className="text-sm text-gray-300 hover:text-casino-gold transition-colors py-2">
                Home
              </Link>
              <Link href="#games" className="text-sm text-gray-300 hover:text-casino-gold transition-colors py-2">
                Games
              </Link>
              <Link href="#provably-fair" className="text-sm text-gray-300 hover:text-casino-gold transition-colors py-2">
                Provably Fair
              </Link>
              {isAuthenticated && (
                <>
                  <div className="border-t border-casino-border pt-3 mt-2">
                    <p className="text-xs text-gray-500 mb-2">Balance: <span className="text-casino-gold font-bold">{balance.toFixed(2)}</span></p>
                    <p className="text-sm text-gray-400 mb-2">
                      @{user?.username || 'Player'}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm text-left text-red-400 hover:text-red-300 py-2"
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
