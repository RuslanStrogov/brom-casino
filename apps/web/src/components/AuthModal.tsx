'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await register(username, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-casino-card border border-casino-border rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-casino-muted hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block">🎰</span>
          <h2 className="text-2xl font-display font-bold bg-gradient-gold bg-clip-text text-transparent">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-casino-muted mt-2">
            {mode === 'login'
              ? 'Sign in to your account to play'
              : 'Join Brom Casino and start winning'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-casino-darker rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
              ${mode === 'login'
                ? 'bg-casino-gold text-casino-dark'
                : 'text-casino-muted hover:text-white'
              }
            `}
          >
            Login
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
              ${mode === 'register'
                ? 'bg-casino-gold text-casino-dark'
                : 'text-casino-muted hover:text-white'
              }
            `}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-casino-muted mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-xl
                text-white placeholder-casino-muted/50 focus:outline-none focus:border-casino-gold/50
                transition-colors"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm text-casino-muted mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-xl
                text-white placeholder-casino-muted/50 focus:outline-none focus:border-casino-gold/50
                transition-colors"
              placeholder="Enter your password"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm text-casino-muted mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-casino-darker border border-casino-border rounded-xl
                  text-white placeholder-casino-muted/50 focus:outline-none focus:border-casino-gold/50
                  transition-colors"
                placeholder="Confirm your password"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-casino-red/10 border border-casino-red/30 rounded-xl text-casino-red text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-lg transition-all
              bg-gradient-gold text-casino-dark hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Demo hint */}
        <p className="text-xs text-casino-muted text-center mt-4">
          Demo: Use any username (3+ chars) and password (6+ chars)
        </p>
      </div>
    </div>
  );
}
