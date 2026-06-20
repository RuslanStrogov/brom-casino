'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useBalance } from '@/hooks/useBalance';
import { BalanceWidget } from './BalanceWidget';
import { AuthModal } from './AuthModal';

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { balance } = useBalance();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <div className="flex items-center gap-4">
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
                  className="px-4 py-2 text-sm rounded-lg border border-casino-gold/50 text-casino-gold hover:bg-casino-gold/10 transition-all"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 text-sm rounded-lg bg-gradient-gold text-casino-dark font-medium hover:opacity-90 transition-all"
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
          <div className="md:hidden py-4 border-t border-casino-border">
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
                <button
                  onClick={logout}
                  className="text-sm text-left text-gray-400 hover:text-white py-2"
                >
                  Logout
                </button>
              )}
            </nav>
          </div>
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  );
}
