'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { HiPhone, HiEnvelope, HiPaperAirplane } from 'react-icons/hi2';
import { useI18n } from '@/i18n/I18nProvider';

interface AuthModalProps {
  onClose: () => void;
}

type AuthTab = 'email' | 'phone' | 'telegram';
type AuthMode = 'login' | 'register';

const COUNTRY_CODES = [
  { code: '+7', country: 'RU', label: '🇷🇺 Россия' },
  { code: '+1', country: 'US', label: '🇺🇸 США' },
  { code: '+44', country: 'GB', label: '🇬🇧 UK' },
  { code: '+49', country: 'DE', label: '🇩🇪 Германия' },
  { code: '+380', country: 'UA', label: '🇺🇦 Украина' },
  { code: '+375', country: 'BY', label: '🇧🇾 Беларусь' },
  { code: '+7', country: 'KZ', label: '🇰🇿 Казахстан' },
  { code: '+91', country: 'IN', label: '🇮🇳 Индия' },
  { code: '+86', country: 'CN', label: '🇨🇳 Китай' },
  { code: '+55', country: 'BR', label: '🇧🇷 Бразилия' },
  { code: '+90', country: 'TR', label: '🇹🇷 Турция' },
  { code: '+972', country: 'IL', label: '🇮🇱 Израиль' },
  { code: '+33', country: 'FR', label: '🇫🇷 Франция' },
  { code: '+34', country: 'ES', label: '🇪🇸 Испания' },
  { code: '+39', country: 'IT', label: '🇮🇹 Италия' },
  { code: '+81', country: 'JP', label: '🇯🇵 Япония' },
  { code: '+82', country: 'KR', label: '🇰🇷 Корея' },
  { code: '+65', country: 'SG', label: '🇸🇬 Сингапур' },
  { code: '+971', country: 'AE', label: '🇦🇪 ОАЭ' },
  { code: '+998', country: 'UZ', label: '🇺🇿 Узбекистан' },
  { code: '+995', country: 'GE', label: '🇬🇪 Грузия' },
  { code: '+994', country: 'AZ', label: '🇦🇿 Азербайджан' },
  { code: '+374', country: 'AM', label: '🇦🇲 Армения' },
  { code: '+996', country: 'KG', label: '🇰🇬 Кыргызстан' },
  { code: '+992', country: 'TJ', label: '🇹🇯 Таджикистан' },
  { code: '+993', country: 'TM', label: '🇹🇲 Туркменистан' },
];

export function AuthModal({ onClose }: AuthModalProps) {
  const { login, loginByPhone, register, telegramAuth, loading } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<AuthTab>('email');
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');

  // Email fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  // Phone fields
  const [countryIndex, setCountryIndex] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Common
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const countryPickerRef = useRef<HTMLDivElement>(null);

  // Close country picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (countryPickerRef.current && !countryPickerRef.current.contains(e.target as Node)) {
        setShowCountryPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Telegram Login Widget callback
  const handleTelegramAuth = useCallback((user: any) => {
    telegramAuth({
      telegramId: String(user.id),
      username: user.username,
      firstName: user.first_name,
    }).then(() => onClose()).catch((err) => {
      setError(err.message || t('auth.telegramAuthFailed'));
    });
  }, [telegramAuth, onClose]);

  // Initialize Telegram widget
  useEffect(() => {
    if (tab !== 'telegram') return;
    // Check if script is already loaded
    if ((window as any).TelegramLoginWidget) return;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', 'BromBetBot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuthCallback');
    script.setAttribute('data-request-access', 'write');
    script.onerror = () => setError(t('auth.telegramLoadFailed'));
    document.getElementById('telegram-widget-container')?.appendChild(script);

    // Set global callback
    (window as any).onTelegramAuthCallback = handleTelegramAuth;

    return () => {
      // Cleanup
      delete (window as any).onTelegramAuthCallback;
    };
  }, [tab, handleTelegramAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (tab === 'email') {
        if (mode === 'login') {
          await login(email, password);
        } else {
          await register(email, password, username || undefined);
        }
      } else if (tab === 'phone') {
        const fullPhone = `${COUNTRY_CODES[countryIndex].code}${phoneNumber}`;
        if (mode === 'login') {
          await loginByPhone(fullPhone, password);
        } else {
          const data = await api.registerByPhone(fullPhone, password, username || undefined);
          const { setTokens, setUser } = await import('@/stores/authStore').then(m => m.useAuthStore.getState());
          setTokens(data.accessToken, data.refreshToken);
          setUser(data.user);
          const { connectSocket } = await import('@/lib/socket');
          connectSocket(data.accessToken);
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || t('auth.errorOccurred'));
    }
  };

  const getFullPhone = () => `${COUNTRY_CODES[countryIndex].code}${phoneNumber}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900/95 border border-rose-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-rose-500/10 backdrop-blur-md">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl mb-4 block">🎰</span>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-cyan-400">
            {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {mode === 'login'
              ? t('auth.signInSubtitle')
              : t('auth.joinSubtitle')}
          </p>
        </div>

        {/* Auth Method Tabs */}
        <div className="flex bg-gray-800/50 rounded-xl p-1 mb-4">
          <button
            onClick={() => { setTab('email'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5
              ${tab === 'email'
                ? 'bg-rose-500/20 text-rose-300 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <HiEnvelope className="w-4 h-4" />
            {t('auth.email')}
          </button>
          <button
            onClick={() => { setTab('phone'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5
              ${tab === 'phone'
                ? 'bg-rose-500/20 text-rose-300 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <HiPhone className="w-4 h-4" />
            {t('auth.phone')}
          </button>
          <button
            onClick={() => { setTab('telegram'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5
              ${tab === 'telegram'
                ? 'bg-rose-500/20 text-rose-300 shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            {t('auth.telegram')}
          </button>
        </div>

        {/* Login/Register Tabs (for email & phone) */}
        {tab !== 'telegram' && (
          <div className="flex bg-gray-800/50 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                ${mode === 'login'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
                }
              `}
            >
              {t('auth.login')}
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                ${mode === 'register'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
                }
              `}
            >
              {t('auth.register')}
            </button>
          </div>
        )}

        {/* Telegram Tab */}
        {tab === 'telegram' && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm mb-6">
                {t('auth.telegramSubtitle')}
              </p>
              <div id="telegram-widget-container" className="flex justify-center" />
              {loading && (
                <div className="flex items-center justify-center gap-2 text-cyan-400 mt-4">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.connecting')}
                </div>
              )}
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm mt-4">
                  {error}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-4">
                {t('auth.termsAgree')}
              </p>
            </div>
          </div>
        )}

        {/* Email Tab */}
        {tab === 'email' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{t('auth.emailLabel')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl
                  text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50
                  transition-colors"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">{t('auth.usernameOptional')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl
                    text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50
                    transition-colors"
                  placeholder={t('auth.usernamePlaceholder')}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl
                  text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50
                  transition-colors"
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl
                    text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50
                    transition-colors"
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-lg transition-all
                bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-400 hover:to-rose-500
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.processing')}
                </span>
              ) : (
                mode === 'login' ? t('auth.signIn') : t('auth.createAccount')
              )}
            </button>
          </form>
        )}

        {/* Phone Tab */}
        {tab === 'phone' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{t('auth.phoneNumber')}</label>
              <div className="flex gap-2">
                {/* Country Code Selector */}
                <div className="relative" ref={countryPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowCountryPicker(!showCountryPicker)}
                    className="h-full px-3 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl
                      text-white hover:border-cyan-500/30 transition-colors flex items-center gap-1.5 min-w-[80px]"
                  >
                    <span>{COUNTRY_CODES[countryIndex].label.split(' ')[0]}</span>
                    <span className="text-cyan-400">{COUNTRY_CODES[countryIndex].code}</span>
                    <svg className={`w-3 h-3 text-gray-400 transition-transform ${showCountryPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showCountryPicker && (
                    <div className="absolute bottom-full mb-2 left-0 bg-gray-800 border border-gray-700/50 rounded-xl shadow-xl shadow-black/50 max-h-48 overflow-y-auto w-56 z-10">
                      {COUNTRY_CODES.map((cc, i) => (
                        <button
                          key={`${cc.code}-${cc.country}`}
                          type="button"
                          onClick={() => { setCountryIndex(i); setShowCountryPicker(false); }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700/50 transition-colors flex items-center gap-2
                            ${i === countryIndex ? 'bg-cyan-500/10 text-cyan-300' : 'text-gray-300'}
                          `}
                        >
                          <span>{cc.label}</span>
                          <span className="text-gray-500 ml-auto">{cc.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPhoneNumber(val);
                  }}
                  required
                  className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl
                    text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50
                    transition-colors"
                  placeholder={t('auth.phonePlaceholder')}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {t('auth.fullNumber')} <span className="text-cyan-400">{getFullPhone()}</span>
              </p>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">{t('auth.usernameOptional')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl
                    text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50
                    transition-colors"
                  placeholder={t('auth.usernamePlaceholder')}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl
                  text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50
                  transition-colors"
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl
                    text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50
                    transition-colors"
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-lg transition-all
                bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-400 hover:to-rose-500
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('auth.processing')}
                </span>
              ) : (
                mode === 'login' ? t('auth.signIn') : t('auth.createAccount')
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Phone registration also creates an account with the same credentials
            </p>
          </form>
        )}

        {/* Demo hint */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Demo: Use any username (3+ chars) and password (6+ chars)
        </p>
      </div>
    </div>
  );
}