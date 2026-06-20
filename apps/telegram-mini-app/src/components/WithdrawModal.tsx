import React from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { X, ArrowUpRight, AlertCircle, CheckCircle, Loader2, Wallet } from 'lucide-react';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WithdrawModal({ open, onClose }: WithdrawModalProps) {
  const { hapticImpact, showAlert } = useTelegram();
  const [amount, setAmount] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [balance, setBalance] = React.useState(125.5);
  const [minWithdraw] = React.useState(0.5);
  const [fee] = React.useState(0.05);

  React.useEffect(() => {
    if (open) {
      loadBalance();
      setAmount('');
      setAddress('');
      setError('');
      setSuccess('');
    }
  }, [open]);

  const loadBalance = async () => {
    try {
      const response = await api.get('/user/balance');
      setBalance(response.data.balance);
    } catch {
      setBalance(125.5);
    }
  };

  const validateAddress = (addr: string): boolean => {
    // Basic TON address validation
    return /^[A-Za-z0-9_-]{48}$/.test(addr) || /^UQ[A-Za-z0-9_-]{46}$/.test(addr) || /^EQ[A-Za-z0-9_-]{46}$/.test(addr);
  };

  const handleWithdraw = async () => {
    setError('');
    setSuccess('');

    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parsedAmount < minWithdraw) {
      setError(`Minimum withdrawal is ${minWithdraw} TON`);
      return;
    }

    if (parsedAmount + fee > balance) {
      setError('Insufficient balance (including fee)');
      return;
    }

    if (!validateAddress(address)) {
      setError('Please enter a valid TON wallet address');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/wallet/withdraw', {
        amount: parsedAmount,
        address: address.trim(),
      });

      setSuccess(`Withdrawal of ${parsedAmount} TON initiated! It will arrive in 1-5 minutes.`);
      hapticImpact('heavy');
      setBalance(prev => prev - parsedAmount - fee);
      setAmount('');
      setAddress('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Withdrawal failed. Please try again.');
      hapticImpact('heavy');
    } finally {
      setLoading(false);
    }
  };

  const setMaxAmount = () => {
    hapticImpact('light');
    setAmount(Math.max(0, balance - fee).toFixed(4));
  };

  const quickPercentages = [25, 50, 75, 100];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center modal-backdrop">
      <div
        className="bg-casino-card w-full max-w-lg rounded-t-3xl border-t border-x border-casino-border p-6 space-y-5 safe-bottom max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Withdraw TON</h2>
          <button
            onClick={() => { hapticImpact('light'); onClose(); }}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Info */}
        <div className="bg-casino-darker rounded-xl p-4 border border-casino-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Available Balance</span>
            <span className="font-bold text-amber-400">{balance.toFixed(4)} TON</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-white/40">Network Fee</span>
            <span className="text-xs text-white/40">{fee} TON</span>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60">Amount</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Min ${minWithdraw} TON`}
              className="w-full bg-casino-darker rounded-xl px-4 py-3 text-white border border-casino-border focus:border-amber-500 focus:outline-none pr-20"
              min={minWithdraw}
              step="0.01"
            />
            <button
              onClick={setMaxAmount}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors"
            >
              MAX
            </button>
          </div>

          {/* Quick percentage buttons */}
          <div className="flex gap-2">
            {quickPercentages.map(pct => (
              <button
                key={pct}
                onClick={() => {
                  hapticImpact('light');
                  setAmount(Math.max(0, ((balance - fee) * pct) / 100).toFixed(4));
                }}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-casino-border text-white/60 hover:text-white hover:bg-amber-500/20 transition-all"
              >
                {pct}%
              </button>
            ))}
          </div>

          {amount && parseFloat(amount) > 0 && (
            <p className="text-xs text-white/40">
              You will receive: <span className="text-green-400">{(parseFloat(amount) - fee).toFixed(4)} TON</span>
            </p>
          )}
        </div>

        {/* Address Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60">TON Wallet Address</label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="EQ... or UQ..."
              className="w-full bg-casino-darker rounded-xl pl-11 pr-4 py-3 text-white border border-casino-border focus:border-amber-500 focus:outline-none font-mono text-sm"
            />
          </div>
          {address && !validateAddress(address) && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Invalid TON address format
            </p>
          )}
        </div>

        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <p className="text-xs text-yellow-400">
            ⚠️ Double-check the withdrawal address. Transactions cannot be reversed.
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleWithdraw}
          disabled={loading || !amount || !address}
          className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black btn-press disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ArrowUpRight className="w-5 h-5" />
              Withdraw
            </>
          )}
        </button>
      </div>
    </div>
  );
}
