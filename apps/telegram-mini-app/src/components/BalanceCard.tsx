import React from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface BalanceData {
  balance: number;
  currency: string;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalWagered: number;
  totalWon: number;
}

export default function BalanceCard({
  onDeposit,
  onWithdraw,
}: {
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  const { hapticImpact } = useTelegram();
  const [balance, setBalance] = React.useState<BalanceData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadBalance = async () => {
    try {
      const response = await api.get('/user/balance');
      setBalance(response.data);
    } catch {
      // Mock data
      setBalance({
        balance: 125.5,
        currency: 'TON',
        pendingDeposits: 0,
        pendingWithdrawals: 0,
        totalWagered: 1520.0,
        totalWon: 1380.5,
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadBalance();
    const interval = setInterval(loadBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    hapticImpact('light');
    setRefreshing(true);
    await loadBalance();
    setTimeout(() => setRefreshing(false), 500);
  };

  if (loading) {
    return (
      <div className="bg-casino-card rounded-2xl p-6 border border-casino-border animate-pulse">
        <div className="h-6 bg-casino-border rounded w-1/3 mb-4" />
        <div className="h-10 bg-casino-border rounded w-1/2 mb-4" />
        <div className="flex gap-3">
          <div className="h-12 bg-casino-border rounded flex-1" />
          <div className="h-12 bg-casino-border rounded flex-1" />
        </div>
      </div>
    );
  }

  const netProfit = (balance?.totalWon || 0) - (balance?.totalWagered || 0);
  const isProfit = netProfit >= 0;

  return (
    <div className="bg-gradient-to-br from-casino-card to-casino-darker rounded-2xl p-6 border border-casino-border glow-amber">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium text-white/60">Balance</span>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-white/40 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Balance */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">
            {balance?.balance.toFixed(2) || '0.00'}
          </span>
          <span className="text-lg text-amber-400 font-medium">{balance?.currency || 'TON'}</span>
        </div>

        {/* Net P&L */}
        <div className={`flex items-center gap-1 mt-1 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
          {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span className="text-sm font-medium">
            {isProfit ? '+' : ''}{netProfit.toFixed(2)} TON all time
          </span>
        </div>
      </div>

      {/* Pending */}
      {(balance?.pendingDeposits || balance?.pendingWithdrawals) ? (
        <div className="flex gap-4 mb-4 text-xs">
          {balance.pendingDeposits > 0 && (
            <span className="text-yellow-400">
              ⏳ Pending deposit: {balance.pendingDeposits} TON
            </span>
          )}
          {balance.pendingWithdrawals > 0 && (
            <span className="text-yellow-400">
              ⏳ Pending withdrawal: {balance.pendingWithdrawals} TON
            </span>
          )}
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            hapticImpact('medium');
            onDeposit();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold btn-press hover:from-green-400 hover:to-emerald-500 transition-all"
        >
          <ArrowDownCircle className="w-5 h-5" />
          Deposit
        </button>
        <button
          onClick={() => {
            hapticImpact('medium');
            onWithdraw();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold btn-press hover:from-amber-400 hover:to-orange-400 transition-all"
        >
          <ArrowUpCircle className="w-5 h-5" />
          Withdraw
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-casino-border">
        <div>
          <p className="text-xs text-white/40">Total Wagered</p>
          <p className="text-sm font-semibold">{balance?.totalWagered.toFixed(2) || '0.00'} TON</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Total Won</p>
          <p className="text-sm font-semibold text-green-400">
            {balance?.totalWon.toFixed(2) || '0.00'} TON
          </p>
        </div>
      </div>
    </div>
  );
}
