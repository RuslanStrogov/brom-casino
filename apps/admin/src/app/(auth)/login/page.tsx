'use client';

import React from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function LoginPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff2d95] rounded-full blur-[150px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00d4ff] rounded-full blur-[150px] opacity-10 pointer-events-none" />

      <div className="relative glass-card rounded-2xl p-8 max-w-md w-full animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-miami flex items-center justify-center shadow-neon-pink">
            <span className="text-xl font-bold text-white">B</span>
          </div>
        </div>

        <h1 className="text-2xl font-heading font-bold text-center mb-2">
          <span className="bg-gradient-miami bg-clip-text text-transparent">
            {t('login.title', 'Admin Login')}
          </span>
        </h1>
        <p className="text-gray-500 text-center mb-6">{t('login.subtitle', 'Sign in to access the admin panel')}</p>

        <LoginForm />
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { t, lang } = useI18n();
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('login.error', 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{t('login.email', 'Email')}</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-[#0f0f1a] rounded-lg px-4 py-2.5 border border-[rgba(255,45,149,0.1)] focus:border-[#00d4ff] focus:outline-none focus:ring-1 focus:ring-[#00d4ff]/30 text-white placeholder-gray-500 transition-colors"
          placeholder="admin@brom-casino.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{t('login.password', 'Password')}</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-[#0f0f1a] rounded-lg px-4 py-2.5 border border-[rgba(255,45,149,0.1)] focus:border-[#00d4ff] focus:outline-none focus:ring-1 focus:ring-[#00d4ff]/30 text-white placeholder-gray-500 transition-colors"
          placeholder="••••••••"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-gradient-miami text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-neon-pink"
      >
        {loading ? t('login.signingIn', 'Signing in...') : t('login.signIn', 'Sign In')}
      </button>
    </form>
  );
}