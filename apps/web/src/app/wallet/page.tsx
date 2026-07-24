'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

type FiatCurrency = 'RUB' | 'USD' | 'EUR' | 'KZT' | 'UAH' | 'INR' | 'TJS' | 'KGS' | 'UZS' | 'AZN' | 'AMD' | 'BRL' | 'TRY' | 'MXN' | 'CNY' | 'CAD' | 'AUD' | 'DKK' | 'NOK' | 'SEK' | 'JPY' | 'KRW';
type CryptoCurrency = 'USDT' | 'BTC' | 'TON' | 'ETH';
type MoneyType = 'fiat' | 'crypto';
type WalletTab = 'deposit' | 'withdraw' | 'history';

interface BankInfo {
  id: string;
  name: string;
  icon: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  fee: number;
  currency: string;
  status: string;
  paymentMethod: string;
  bankName?: string;
  providerRef?: string;
  createdAt: string;
  confirmedAt?: string;
}

const FIAT_CURRENCIES: { code: FiatCurrency; symbol: string; flag: string }[] = [
  { code: 'RUB', symbol: '₽', flag: '🇷🇺' },
  { code: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'KZT', symbol: '₸', flag: '🇰🇿' },
  { code: 'UAH', symbol: '₴', flag: '🇺🇦' },
  { code: 'INR', symbol: '₹', flag: '🇮🇳' },
  { code: 'TJS', symbol: '₸', flag: '🇹🇯' },
  { code: 'KGS', symbol: 'с', flag: '🇰🇬' },
  { code: 'UZS', symbol: 'с', flag: '🇺🇿' },
  { code: 'AZN', symbol: '₼', flag: '🇦🇿' },
  { code: 'AMD', symbol: '֏', flag: '🇦🇲' },
  { code: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  { code: 'TRY', symbol: '₺', flag: '🇹🇷' },
  { code: 'MXN', symbol: '$', flag: '🇲🇽' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳' },
  { code: 'CAD', symbol: '$', flag: '🇨🇦' },
  { code: 'AUD', symbol: '$', flag: '🇦🇺' },
  { code: 'DKK', symbol: 'kr', flag: '🇩🇰' },
  { code: 'NOK', symbol: 'kr', flag: '🇳🇴' },
  { code: 'SEK', symbol: 'kr', flag: '🇸🇪' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵' },
  { code: 'KRW', symbol: '₩', flag: '🇰🇷' },
];

const CRYPTO_CURRENCIES: { code: CryptoCurrency; icon: string }[] = [
  { code: 'USDT', icon: '💵' },
  { code: 'BTC', icon: '₿' },
  { code: 'TON', icon: '💎' },
  { code: 'ETH', icon: '🔷' },
];

const CRYPTO_PRESETS = [10, 25, 50, 100, 250, 500];

const FiatPaymentMethod = {
  CARD: 'card',
  SB_PAYMENT: 'sbp',
  ECORPAY: 'ecorpay',
  YOUMONEY: 'yoomoney',
  FK_WALLET: 'fkwallet',
  APPLE_PAY: 'applepay',
  GOOGLE_PAY: 'googlepay',
  OPEN_BANKING: 'openbanking',
} as const;

const FIAT_PAYMENT_METHODS = [
  { id: FiatPaymentMethod.CARD, name: 'Карта', icon: '💳', desc: 'Visa, Mastercard, МИР' },
  { id: FiatPaymentMethod.SB_PAYMENT, name: 'СБП', icon: '🏦', desc: 'Система быстрых платежей' },
  { id: FiatPaymentMethod.ECORPAY, name: 'Ecorpay', icon: '💼', desc: 'Электронный кошелек' },
  { id: FiatPaymentMethod.YOUMONEY, name: 'ЮMoney', icon: '💰', desc: 'Яндекс.Деньги' },
  { id: FiatPaymentMethod.FK_WALLET, name: 'FK Wallet', icon: '👛', desc: 'Freekassa' },
  { id: FiatPaymentMethod.APPLE_PAY, name: 'Apple Pay', icon: '📱', desc: 'Оплата через iPhone' },
  { id: FiatPaymentMethod.GOOGLE_PAY, name: 'Google Pay', icon: '📱', desc: 'Оплата через Android' },
  { id: FiatPaymentMethod.OPEN_BANKING, name: 'Open Banking', icon: '🏛️', desc: 'Прямой банковский перевод' },
];

const SBP_BANKS = [
  { id: 'tbank', name: 'Т-Банк', icon: '🅱️' },
  { id: 'sberbank', name: 'Сбербанк', icon: '💚' },
  { id: 'vtb', name: 'ВТБ', icon: '💙' },
  { id: 'psb', name: 'ПСБ', icon: '🔵' },
  { id: 'alfa', name: 'Альфа-Банк', icon: '❤️' },
  { id: 'gazprom', name: 'Газпромбанк', icon: '💙' },
  { id: 'ozon', name: 'Ozon Банк', icon: '📦' },
  { id: 'otp', name: 'ОТП Банк', icon: '🔴' },
  { id: 'yandex', name: 'Yandex Bank', icon: '🟡' },
  { id: 'sovcombank', name: 'Sovcombank', icon: '🔴' },
  { id: 'other_sbp', name: 'Другой банк СБП', icon: '🏦' },
  { id: 'other_p2p', name: 'Другой банк P2P', icon: '🏧' },
];

const FIAT_PRESETS = [500, 1000, 2500, 5000, 10000];

export default function WalletPage() {
  const { t } = useI18n();
  const { isAuthenticated, token } = useAuthStore();
  const router = useRouter();

  const [wallet, setWallet] = useState<{ balance: number; bonusBalance: number; currency: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<WalletTab>('deposit');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Money type selector
  const [moneyType, setMoneyType] = useState<MoneyType>('fiat');
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useState<FiatCurrency>('RUB');
  const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState<CryptoCurrency>('USDT');
  const [showFiatCurrencyPicker, setShowFiatCurrencyPicker] = useState(false);
  const [showCryptoCurrencyPicker, setShowCryptoCurrencyPicker] = useState(false);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('sbp');
  const [selectedBank, setSelectedBank] = useState('tbank');
  const [depositResult, setDepositResult] = useState<any>(null);
  const [depositError, setDepositError] = useState('');

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [withdrawResult, setWithdrawResult] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState('');

  // History pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyMeta, setHistoryMeta] = useState<{ total: number }>({ total: 0 });

  const fetchWallet = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getWallet(token);
      setWallet(data);
    } catch (e) {
      console.error('Failed to fetch wallet', e);
    }
  }, [token]);

  const fetchTransactions = useCallback(async (page: number = 1) => {
    if (!token) return;
    try {
      const data = await api.getTransactions(token, { page, limit: 10 });
      setTransactions(data.transactions);
      setHistoryTotalPages(data.meta.totalPages);
      setHistoryMeta(data.meta);
    } catch (e) {
      console.error('Failed to fetch transactions', e);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    setLoading(true);
    Promise.all([fetchWallet(), fetchTransactions()]).finally(() => setLoading(false));
  }, [isAuthenticated, fetchWallet, fetchTransactions, router]);

  const handleDeposit = async () => {
    if (!token || !depositAmount || Number(depositAmount) <= 0) return;
    setActionLoading(true);
    setDepositError('');
    setDepositResult(null);
    try {
      const extra: Record<string, any> = {};
      if (moneyType === 'fiat') {
        extra.fiatCurrency = selectedFiatCurrency;
        extra.bankName = SBP_BANKS.find(b => b.id === selectedBank)?.name || 'Т-Банк';
        extra.bankId = selectedBank;
      }
      const result = await api.createDeposit(
        token,
        depositAmount,
        moneyType === 'fiat' ? selectedFiatCurrency : selectedCryptoCurrency,
        moneyType === 'fiat' ? selectedPaymentMethod : 'cryptomus',
        extra,
      );
      // Attach fiat provider data for display
      setDepositResult({ ...result, ...extra, bankName: extra.bankName });
    } catch (e: any) {
      setDepositError(e.message || t('wallet.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!token || !withdrawAmount || !withdrawDestination) return;
    setActionLoading(true);
    setWithdrawError('');
    setWithdrawResult(null);
    try {
      const result = await api.requestWithdrawal(token, withdrawAmount, withdrawDestination);
      setWithdrawResult(`${t('wallet.success')} Статус: ${result.status}`);
    } catch (e: any) {
      setWithdrawError(e.message || t('wallet.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleHistoryPage = (page: number) => {
    setHistoryPage(page);
    fetchTransactions(page);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatAmount = (amount: number | string | null | undefined, currency: string) => {
    const num = Number(amount) || 0;
    if (['RUB', 'USD', 'EUR', 'KZT', 'UAH', 'INR', 'TJS', 'KGS', 'UZS', 'AZN', 'AMD', 'BRL', 'TRY', 'MXN', 'CNY', 'CAD', 'AUD', 'DKK', 'NOK', 'SEK', 'JPY', 'KRW'].includes(currency)) {
      return num.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
    return num.toFixed(2);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      PROCESSING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
      CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    const c = colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    const labels: Record<string, string> = {
      COMPLETED: 'Завершено',
      PENDING: 'Ожидание',
      PROCESSING: 'В обработке',
      FAILED: 'Ошибка',
      CANCELLED: 'Отменено',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${c}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getCurrencySymbol = (code: string) => {
    const fiat = FIAT_CURRENCIES.find(c => c.code === code);
    if (fiat) return fiat.symbol;
    return code;
  };

  const getFiatFlag = (code: string) => {
    const fiat = FIAT_CURRENCIES.find(c => c.code === code);
    return fiat?.flag || '🌐';
  };

  // ================================================
  // Loading state
  // ================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-miami-pink/30 border-t-miami-pink rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // ================================================
  // Main render
  // ================================================
  const currentSymbol = moneyType === 'fiat'
    ? getCurrencySymbol(selectedFiatCurrency)
    : selectedCryptoCurrency;
  const currentPresets = moneyType === 'fiat' ? FIAT_PRESETS : CRYPTO_PRESETS;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero */}
      <div className="relative pt-24 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-miami-purple/10 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 relative">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white text-center mb-2">
            {t('wallet.title')}
          </h1>
          <p className="text-gray-400 text-center text-sm">Пополнение и вывод средств</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-casino-card to-casino-card2 border border-casino-border rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-miami/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-gradient-miami/10 transition-all" />
            <p className="text-sm text-gray-400 mb-2">Реальный баланс</p>
            <p className="text-3xl font-bold text-white font-mono">
              {(Number(wallet?.balance) || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">USDT</p>
          </div>
          <div className="bg-gradient-to-br from-casino-card to-casino-card2 border border-casino-border rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-miami-pink/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-miami-pink/10 transition-all" />
            <p className="text-sm text-gray-400 mb-2">Бонусный баланс</p>
            <p className="text-3xl font-bold text-casino-gold font-mono">
              {(Number(wallet?.bonusBalance) || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Требуется отыгрыш</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-casino-card rounded-xl p-1 border border-casino-border">
          {([
            { key: 'deposit' as WalletTab, label: t('wallet.deposit') },
            { key: 'withdraw' as WalletTab, label: t('wallet.withdraw') },
            { key: 'history' as WalletTab, label: t('wallet.history') },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-miami text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ======================================================================== */}
        {/* DEPOSIT TAB */}
        {/* ======================================================================== */}
        {activeTab === 'deposit' && (
          <div className="animate-fade-up">
            {depositResult ? (
              <div className="bg-casino-card border border-casino-border rounded-2xl p-6 md:p-8">
                {depositResult.fiatCurrency ? (
                  /* SBP payment details */
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🏦</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Счёт для оплаты</h3>
                    <p className="text-gray-400 text-sm mb-6">
                      Переведите {depositResult.amount} {depositResult.fiatCurrency} по реквизитам ниже
                    </p>

                    <div className="bg-casino-dark rounded-xl p-5 mb-6 text-left border border-casino-border">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Банк получателя:</span>
                          <span className="text-white font-medium">{depositResult.bankName || 'Т-Банк'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Получатель:</span>
                          <span className="text-white font-medium">ИП Строгов Р.А.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">ИНН:</span>
                          <span className="text-white font-mono">770012345678</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Сумма:</span>
                          <span className="text-white font-mono font-bold text-lg">{depositResult.amount} {depositResult.fiatCurrency}</span>
                        </div>
                        <div className="border-t border-casino-border pt-3 mt-3">
                          <p className="text-gray-500 text-xs text-center">
                            Средства зачислятся автоматически после подтверждения платежа
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-casino-dark rounded-xl p-4 mb-6 border border-casino-border text-left">
                      <p className="text-sm text-gray-300 font-medium mb-3">Инструкция:</p>
                      <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                        <li>Откройте приложение банка «{depositResult.bankName || 'Т-Банк'}»</li>
                        <li>Выберите «Оплата по СБП» или P2P-перевод</li>
                        <li>Введите сумму <strong className="text-white">{depositResult.amount} {depositResult.fiatCurrency}</strong></li>
                        <li>Подтвердите платеж</li>
                      </ol>
                    </div>

                    <button
                      onClick={() => { setDepositResult(null); setDepositAmount(''); }}
                      className="px-8 py-3 bg-gradient-miami text-white rounded-xl font-medium hover:shadow-lg hover:shadow-miami-pink/20 transition-all"
                    >
                      Новый депозит
                    </button>
                  </div>
                ) : (
                  /* Crypto payment */
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Депозит создан</h3>
                    <p className="text-gray-400 mb-2">
                      Сумма: <span className="text-white font-mono">{depositResult.amount} {depositResult.currency}</span>
                    </p>
                    <p className="text-gray-400 text-sm mb-6">Перейдите по ссылке для оплаты</p>
                    <a
                      href={depositResult.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-8 py-3 bg-gradient-miami text-white rounded-xl font-medium hover:shadow-lg hover:shadow-miami-pink/20 transition-all"
                    >
                      Оплатить
                    </a>
                    <button
                      onClick={() => { setDepositResult(null); setDepositAmount(''); }}
                      className="block mx-auto mt-4 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Новый депозит
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-casino-card border border-casino-border rounded-2xl p-6 md:p-8">
                <h3 className="text-lg font-bold text-white mb-2">{t('wallet.depositTitle')}</h3>

                {/* Money Type Selector — Деньги / Криптовалюта */}
                <div className="flex gap-1 mb-6 bg-casino-dark rounded-xl p-1 border border-casino-border">
                  <button
                    onClick={() => setMoneyType('fiat')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      moneyType === 'fiat'
                        ? 'bg-gradient-miami text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    💵 Деньги
                  </button>
                  <button
                    onClick={() => setMoneyType('crypto')}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      moneyType === 'crypto'
                        ? 'bg-gradient-miami text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🪙 Криптовалюта
                  </button>
                </div>

                {/* Currency Selector */}
                {moneyType === 'fiat' ? (
                  <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-2">{t('wallet.currency')}</label>
                    <div className="relative">
                      <button
                        onClick={() => setShowFiatCurrencyPicker(!showFiatCurrencyPicker)}
                        className="w-full bg-casino-dark border border-casino-border rounded-xl px-4 py-3 text-white flex items-center gap-3 hover:border-miami-pink/50 transition-all"
                      >
                        <span className="text-xl">{getFiatFlag(selectedFiatCurrency)}</span>
                        <span className="font-medium">{selectedFiatCurrency}</span>
                        <span className="text-gray-400">{getCurrencySymbol(selectedFiatCurrency)}</span>
                        <svg className={`ml-auto w-4 h-4 text-gray-400 transition-transform ${showFiatCurrencyPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showFiatCurrencyPicker && (
                        <div className="absolute z-10 mt-1 w-full bg-casino-card2 border border-casino-border rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                          <div className="grid grid-cols-2 gap-1 p-2">
                            {FIAT_CURRENCIES.map((cur) => (
                              <button
                                key={cur.code}
                                onClick={() => { setSelectedFiatCurrency(cur.code); setShowFiatCurrencyPicker(false); }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                  selectedFiatCurrency === cur.code
                                    ? 'bg-miami-pink/20 text-miami-pink border border-miami-pink/30'
                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <span>{cur.flag}</span>
                                <span className="font-medium">{cur.code}</span>
                                <span className="text-gray-500">{cur.symbol}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-2">Криптовалюта</label>
                    <div className="flex gap-2">
                      {CRYPTO_CURRENCIES.map((cur) => (
                        <button
                          key={cur.code}
                          onClick={() => setSelectedCryptoCurrency(cur.code)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                            selectedCryptoCurrency === cur.code
                              ? 'bg-miami-pink/20 border-miami-pink/50 text-miami-pink'
                              : 'bg-casino-dark border-casino-border text-gray-400 hover:text-white hover:border-gray-500'
                          }`}
                        >
                          {cur.icon} {cur.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fiat Payment Method */}
                {moneyType === 'fiat' && (
                  <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-2">Способ оплаты</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FIAT_PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-all ${
                            selectedPaymentMethod === method.id
                              ? 'bg-miami-pink/20 border-miami-pink/50 text-white'
                              : 'bg-casino-dark border-casino-border text-gray-400 hover:text-white hover:border-gray-500'
                          }`}
                        >
                          <span>{method.icon}</span>
                          <div className="text-left">
                            <p className="font-medium">{method.name}</p>
                            <p className="text-[10px] text-gray-500">{method.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SBP Bank Selector */}
                {moneyType === 'fiat' && selectedPaymentMethod === 'sbp' && (
                  <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-2">Ваш банк</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SBP_BANKS.map((bank) => (
                        <button
                          key={bank.id}
                          onClick={() => setSelectedBank(bank.id)}
                          className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-sm border transition-all ${
                            selectedBank === bank.id
                              ? 'bg-miami-pink/20 border-miami-pink/50 text-white'
                              : 'bg-casino-dark border-casino-border text-gray-400 hover:text-white hover:border-gray-500'
                          }`}
                        >
                          <span className="text-lg">{bank.icon}</span>
                          <span className="text-[10px] leading-tight text-center">{bank.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amount input */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2">
                    {t('wallet.amount')} {moneyType === 'fiat' ? `(${getCurrencySymbol(selectedFiatCurrency)})` : `(${selectedCryptoCurrency})`}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={t('wallet.amountPlaceholder')}
                      min={moneyType === 'fiat' ? 100 : 1}
                      step={moneyType === 'fiat' ? '1' : '0.01'}
                      className="w-full bg-casino-dark border border-casino-border rounded-xl px-4 py-3 text-white text-lg font-mono placeholder-gray-600 focus:outline-none focus:border-miami-pink/50 focus:ring-1 focus:ring-miami-pink/30 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      {moneyType === 'fiat' ? getCurrencySymbol(selectedFiatCurrency) : selectedCryptoCurrency}
                    </span>
                  </div>
                </div>

                {/* Preset amounts */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {currentPresets.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDepositAmount(String(amt))}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        Number(depositAmount) === amt
                          ? 'bg-miami-pink/20 border-miami-pink/50 text-miami-pink'
                          : 'bg-casino-dark border-casino-border text-gray-400 hover:text-white hover:border-gray-500'
                      }`}
                    >
                      {moneyType === 'fiat' ? formatAmount(amt, selectedFiatCurrency) : amt}
                      {moneyType === 'fiat' ? ` ${getCurrencySymbol(selectedFiatCurrency)}` : ` ${selectedCryptoCurrency}`}
                    </button>
                  ))}
                </div>

                {/* Commission info */}
                <div className="mb-6 p-3 bg-casino-dark rounded-xl border border-casino-border text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Комиссия</span>
                    <span className="text-green-400 font-medium">0%</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-400">Лимит</span>
                    <span className="text-gray-300">
                      {moneyType === 'fiat'
                        ? `100 — 300 000 ${getCurrencySymbol(selectedFiatCurrency)}`
                        : `1 — 50 000 ${selectedCryptoCurrency}`}
                    </span>
                  </div>
                </div>

                {depositError && (
                  <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                    {depositError}
                  </p>
                )}

                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || Number(depositAmount) <= 0 || actionLoading}
                  className="w-full py-3 bg-gradient-miami text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-miami-pink/20 transition-all flex items-center justify-center gap-2 text-base"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('wallet.processing')}
                    </>
                  ) : (
                    t('wallet.submitDeposit')
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================== */}
        {/* WITHDRAW TAB */}
        {/* ======================================================================== */}
        {activeTab === 'withdraw' && (
          <div className="animate-fade-up">
            <div className="bg-casino-card border border-casino-border rounded-2xl p-6 md:p-8">
              {withdrawResult ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Вывод запрошен</h3>
                  <p className="text-gray-400 mb-6">{withdrawResult}</p>
                  <button
                    onClick={() => { setWithdrawResult(null); setWithdrawAmount(''); setWithdrawDestination(''); }}
                    className="inline-block px-8 py-3 bg-gradient-miami text-white rounded-xl font-medium hover:shadow-lg hover:shadow-miami-pink/20 transition-all"
                  >
                    Новый вывод
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-white mb-2">{t('wallet.withdrawTitle')}</h3>
                  <p className="text-sm text-gray-400 mb-6">Выведите средства на внешний кошелек</p>

                  <div className="mb-6">
                    <p className="flex items-center gap-2 mb-4 p-3 bg-casino-dark border border-casino-border rounded-xl">
                      <span className="text-sm text-gray-400">{t('wallet.available')}</span>
                      <span className="text-white font-mono font-bold">{(Number(wallet?.balance) || 0).toFixed(2)} USDT</span>
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">{t('wallet.amount')} (USDT)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder={t('wallet.amountPlaceholder')}
                        min="1"
                        max={wallet?.balance || 0}
                        step="0.01"
                        className="w-full bg-casino-dark border border-casino-border rounded-xl px-4 py-3 text-white text-lg font-mono placeholder-gray-600 focus:outline-none focus:border-miami-pink/50 focus:ring-1 focus:ring-miami-pink/30 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">USDT</span>
                    </div>
                    <button
                      onClick={() => setWithdrawAmount(String(wallet?.balance || 0))}
                      className="text-xs text-miami-cyan hover:text-miami-cyan/80 mt-1 transition-colors"
                    >
                      {t('wallet.maxWithdraw').replace('{max}', `${(Number(wallet?.balance) || 0).toFixed(2)} USDT`)}
                    </button>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-2">{t('wallet.address')}</label>
                    <input
                      type="text"
                      value={withdrawDestination}
                      onChange={(e) => setWithdrawDestination(e.target.value)}
                      placeholder="TRC-20, ERC-20 или BEP-20 адрес"
                      className="w-full bg-casino-dark border border-casino-border rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-miami-pink/50 focus:ring-1 focus:ring-miami-pink/30 transition-all"
                    />
                  </div>

                  {withdrawError && (
                    <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                      {withdrawError}
                    </p>
                  )}

                  <button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || !withdrawDestination || Number(withdrawAmount) <= 0 || actionLoading}
                    className="w-full py-3 bg-gradient-miami text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-miami-pink/20 transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('wallet.processing')}
                      </>
                    ) : (
                      t('wallet.submitWithdraw')
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ======================================================================== */}
        {/* HISTORY TAB */}
        {/* ======================================================================== */}
        {activeTab === 'history' && (
          <div className="animate-fade-up">
            <div className="bg-casino-card border border-casino-border rounded-2xl overflow-hidden">
              <div className="p-6 pb-0">
                <h3 className="text-lg font-bold text-white mb-1">{t('wallet.transactionHistory')}</h3>
                <p className="text-sm text-gray-400 mb-4">
                  {historyMeta.total > 0
                    ? `Всего ${historyMeta.total} транзакций`
                    : 'Все ваши депозиты и выводы'}
                </p>
              </div>

              {transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-casino-dark rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-400">{t('wallet.noTransactions')}</p>
                  <p className="text-sm text-gray-500 mt-1">История пополнений и выводов появится здесь</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-casino-border">
                        <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-3 font-medium">{t('wallet.type')}</th>
                        <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-3 font-medium">{t('wallet.amount')}</th>
                        <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-3 font-medium hidden md:table-cell">Метод</th>
                        <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-3 font-medium hidden md:table-cell">{t('wallet.date')}</th>
                        <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-6 py-3 font-medium">{t('wallet.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-casino-border/50 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                tx.type === 'DEPOSIT'
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}>
                                {tx.type === 'DEPOSIT' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm">
                                <span className="text-white">
                                  {tx.type === 'DEPOSIT' ? t('wallet.deposit') : t('wallet.withdraw')}
                                </span>
                                {tx.bankName && (
                                  <span className="text-gray-500 text-xs block">
                                    {tx.bankName}
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-mono font-medium ${
                              tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {tx.type === 'DEPOSIT' ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">{tx.currency}</span>
                            {tx.fee > 0 && (
                              <p className="text-[10px] text-gray-600 mt-0.5">Комиссия: {tx.fee}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400 hidden md:table-cell">
                            <span className="capitalize">{tx.paymentMethod === 'cryptomus' ? 'Крипто' : tx.paymentMethod === 'sbp' ? 'СБП' : tx.paymentMethod || '—'}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400 hidden md:table-cell">
                            {formatDate(tx.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {statusBadge(tx.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-casino-border">
                  <button
                    onClick={() => handleHistoryPage(historyPage - 1)}
                    disabled={historyPage <= 1}
                    className="px-3 py-1.5 rounded-lg text-sm bg-casino-dark border border-casino-border text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    {t('common.back')}
                  </button>
                  {Array.from({ length: Math.min(historyTotalPages, 5) }, (_, i) => {
                    // Show pages around current
                    let pageNum: number;
                    if (historyTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (historyPage <= 3) {
                      pageNum = i + 1;
                    } else if (historyPage >= historyTotalPages - 2) {
                      pageNum = historyTotalPages - 4 + i;
                    } else {
                      pageNum = historyPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handleHistoryPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                          pageNum === historyPage
                            ? 'bg-miami-pink/20 text-miami-pink border border-miami-pink/30'
                            : 'text-gray-400 hover:text-white border border-transparent'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {historyTotalPages > 5 && historyPage < historyTotalPages - 2 && (
                    <span className="text-gray-500">...</span>
                  )}
                  {historyTotalPages > 5 && historyPage < historyTotalPages - 2 && (
                    <button
                      onClick={() => handleHistoryPage(historyTotalPages)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        historyTotalPages === historyPage
                          ? 'bg-miami-pink/20 text-miami-pink border border-miami-pink/30'
                          : 'text-gray-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {historyTotalPages}
                    </button>
                  )}
                  <button
                    onClick={() => handleHistoryPage(historyPage + 1)}
                    disabled={historyPage >= historyTotalPages}
                    className="px-3 py-1.5 rounded-lg text-sm bg-casino-dark border border-casino-border text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    {t('common.next')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}