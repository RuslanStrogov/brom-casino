import React from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { useTonConnect } from '../lib/ton';
import { api } from '../lib/api';
import { X, Wallet, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DepositModal({ open, onClose }: DepositModalProps) {
  const { hapticImpact } = useTelegram();
  const { connected, wallet, sendTransaction } = useTonConnect();
  const [amount, setAmount] = React.useState('');
  const [depositAddress, setDepositAddress] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  React.useEffect(() => {
    if (open) {
      loadDepositAddress();
    }
  }, [open]);

  const loadDepositAddress = async () => {
    try {
      const response = await api.get('/wallet/deposit-address');
      setDepositAddress(response.data.address || 'UQBx4bCV6eNh6D3YqqvGLB2Oq4W9xQ3Q7Z8v9X8v9X8v9X8');
    } catch {
      setDepositAddress('UQBx4bCV6eNh6D3YqqvGLB2Oq4W9xQ3Q7Z8v9X8v9X8v9X8');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      hapticImpact('light');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = depositAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTonConnectDeposit = async () => {
    if (!connected || !wallet) {
      setError('Please connect your TON wallet first');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0.1) {
      setError('Minimum deposit is 0.1 TON');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: depositAddress,
            amount: (parsedAmount * 1e9).toString(), // Convert to nanoTON
          },
        ],
      };

      await sendTransaction(transaction);
      setSuccess(`Deposit of ${parsedAmount} TON initiated! It will appear after confirmation.`);
      hapticImpact('heavy');
      setAmount('');
    } catch (err: any) {
      setError(err?.message || 'Transaction failed. Please try again.');
      hapticImpact('heavy');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [1, 5, 10, 25, 50, 100];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center modal-backdrop">
      <div
        className="bg-casino-card w-full max-w-lg rounded-t-3xl border-t border-x border-casino-border p-6 space-y-5 animate-slide-up safe-bottom max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Deposit TON</h2>
          <button
            onClick={() => { hapticImpact('light'); onClose(); }}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TON Connect Deposit */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/60">Send from Wallet</h3>

          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount in TON"
              className="flex-1 bg-casino-darker rounded-xl px-4 py-3 text-white border border-casino-border focus:border-amber-500 focus:outline-none"
              min="0.1"
              step="0.1"
            />
            <button
              onClick={handleTonConnectDeposit}
              disabled={loading || !connected}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold btn-press disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wallet className="w-5 h-5" />
              )}
              Send
            </button>
          </div>

          {!connected && (
            <p className="text-xs text-yellow-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Connect your TON wallet to deposit directly
            </p>
          )}

          {/* Quick amounts */}
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map(qa => (
              <button
                key={qa}
                onClick={() => { hapticImpact('light'); setAmount(qa.toString()); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  amount === qa.toString()
                    ? 'bg-amber-500 text-black'
                    : 'bg-casino-border text-white/60 hover:text-white'
                }`}
              >
                {qa} TON
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-casino-border" />
          <span className="text-xs text-white/40">OR</span>
          <div className="flex-1 h-px bg-casino-border" />
        </div>

        {/* Manual Deposit */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/60">Send Manually</h3>

          <div className="bg-casino-darker rounded-xl p-4 border border-casino-border">
            <p className="text-xs text-white/40 mb-2">Deposit Address</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-amber-400 break-all font-mono">
                {depositAddress}
              </code>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-2 rounded-lg bg-casino-border hover:bg-amber-500/20 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <p className="text-xs text-yellow-400">
              ⚠️ Only send TON to this address. Sending other tokens may result in permanent loss.
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}
      </div>
    </div>
  );
}
