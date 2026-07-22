'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

type WalletTab = 'deposit' | 'withdraw' | 'history';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
  balanceBefore?: number;
  balanceAfter?: number;
}

export default function WalletPage() {
  const { isAuthenticated, token } = useAuthStore();
  const router = useRouter();

  const [wallet, setWallet] = useState<{ balance: number; bonusBalance: number; currency: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<WalletTab>('deposit');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositResult, setDepositResult] = useState<{ paymentUrl: string; amount: number; currency: string } | null>(null);
  const [depositError, setDepositError] = useState('');

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [withdrawResult, setWithdrawResult] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState('');

  // History pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

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
      const result = await api.createDeposit(token, depositAmount);
      setDepositResult(result);
    } catch (e: any) {
      setDepositError(e.message || 'Failed to create deposit');
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
      setWithdrawResult(`Withdrawal requested! Status: ${result.status}`);
    } catch (e: any) {
      setWithdrawError(e.message || 'Failed to request withdrawal');
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
      CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    const c = colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${c}`}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  const presetAmounts = [10, 25, 50, 100, 250, 500];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-miami-pink/30 border-t-miami-pink rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero */}
      <div className="relative pt-24 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-miami-purple/10 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 relative">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white text-center mb-2">
            My <span className="text-transparent bg-clip-text bg-gradient-miami">Wallet</span>
          </h1>
          <p className="text-gray-400 text-center text-sm">Manage your funds and transaction history</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-casino-card to-casino-card2 border border-casino-border rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-miami/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-gradient-miami/10 transition-all" />
            <p className="text-sm text-gray-400 mb-2">Real Balance</p>
            <p className="text-3xl font-bold text-white font-mono">
              {(wallet?.balance || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{wallet?.currency || 'USDT'}</p>
          </div>
          <div className="bg-gradient-to-br from-casino-card to-casino-card2 border border-casino-border rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-miami-pink/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-miami-pink/10 transition-all" />
            <p className="text-sm text-gray-400 mb-2">Bonus Balance</p>
            <p className="text-3xl font-bold text-casino-gold font-mono">
              {(wallet?.bonusBalance || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Wagering requirements apply</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-casino-card rounded-xl p-1 border border-casino-border">
          {(['deposit', 'withdraw', 'history'] as WalletTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all capitalize ${
                activeTab === tab
                  ? 'bg-gradient-miami text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-up">
          {/* Deposit */}
          {activeTab === 'deposit' && (
            <div className="bg-casino-card border border-casino-border rounded-2xl p-6 md:p-8">
              {depositResult ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Deposit Created</h3>
                  <p className="text-gray-400 mb-2">
                    Amount: <span className="text-white font-mono">{depositResult.amount} {depositResult.currency}</span>
                  </p>
                  <p className="text-gray-400 text-sm mb-6">Follow the payment link to complete your deposit</p>
                  <a
                    href={depositResult.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-8 py-3 bg-gradient-miami text-white rounded-xl font-medium hover:shadow-lg hover:shadow-miami-pink/20 transition-all"
                  >
                    Pay Now
                  </a>
                  <button
                    onClick={() => { setDepositResult(null); setDepositAmount(''); }}
                    className="block mx-auto mt-4 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Create another deposit
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-white mb-2">Deposit</h3>
                  <p className="text-sm text-gray-400 mb-6">Choose an amount to deposit to your wallet</p>

                  <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-2">Amount (USDT)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        min="1"
                        step="0.01"
                        className="w-full bg-casino-dark border border-casino-border rounded-xl px-4 py-3 text-white text-lg font-mono placeholder-gray-600 focus:outline-none focus:border-miami-pink/50 focus:ring-1 focus:ring-miami-pink/30 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">USDT</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {presetAmounts.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDepositAmount(String(amt))}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          depositAmount === String(amt)
                            ? 'bg-miami-pink/20 border-miami-pink/50 text-miami-pink'
                            : 'bg-casino-dark border-casino-border text-gray-400 hover:text-white hover:border-gray-500'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>

                  {depositError && (
                    <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                      {depositError}
                    </p>
                  )}

                  <button
                    onClick={handleDeposit}
                    disabled={!depositAmount || Number(depositAmount) <= 0 || actionLoading}
                    className="w-full py-3 bg-gradient-miami text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-miami-pink/20 transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Deposit'
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Withdraw */}
          {activeTab === 'withdraw' && (
            <div className="bg-casino-card border border-casino-border rounded-2xl p-6 md:p-8">
              {withdrawResult ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Withdrawal Requested</h3>
                  <p className="text-gray-400 mb-6">{withdrawResult}</p>
                  <button
                    onClick={() => { setWithdrawResult(null); setWithdrawAmount(''); setWithdrawDestination(''); }}
                    className="inline-block px-8 py-3 bg-gradient-miami text-white rounded-xl font-medium hover:shadow-lg hover:shadow-miami-pink/20 transition-all"
                  >
                    Request Another
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-white mb-2">Withdraw</h3>
                  <p className="text-sm text-gray-400 mb-6">Withdraw your funds to an external wallet</p>

                  <div className="mb-6">
                    <p className="flex items-center gap-2 mb-4 p-3 bg-casino-dark border border-casino-border rounded-xl">
                      <span className="text-sm text-gray-400">Available balance:</span>
                      <span className="text-white font-mono font-bold">{(wallet?.balance || 0).toFixed(2)} {wallet?.currency || 'USDT'}</span>
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">Amount (USDT)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
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
                      Max: {(wallet?.balance || 0).toFixed(2)} USDT
                    </button>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-2">Destination Address</label>
                    <input
                      type="text"
                      value={withdrawDestination}
                      onChange={(e) => setWithdrawDestination(e.target.value)}
                      placeholder="TRC-20, ERC-20, or BEP-20 address"
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
                        Processing...
                      </>
                    ) : (
                      'Withdraw'
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div className="bg-casino-card border border-casino-border rounded-2xl overflow-hidden">
              <div className="p-6 pb-0">
                <h3 className="text-lg font-bold text-white mb-1">Transaction History</h3>
                <p className="text-sm text-gray-400 mb-4">All your recent transactions</p>
              </div>

              {transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-casino-dark rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-400">No transactions yet</p>
                  <p className="text-sm text-gray-500 mt-1">Your deposit and withdrawal history will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-casino-border">
                        <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-3 font-medium">Type</th>
                        <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-3 font-medium">Amount</th>
                        <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-3 font-medium hidden md:table-cell">Date</th>
                        <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-casino-border/50 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                ['DEPOSIT', 'CREDIT'].includes(tx.type)
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}>
                                {['DEPOSIT', 'CREDIT'].includes(tx.type) ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm text-white capitalize">
                                {tx.type.toLowerCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-mono font-medium ${
                              ['DEPOSIT', 'CREDIT'].includes(tx.type) ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {['DEPOSIT', 'CREDIT'].includes(tx.type) ? '+' : '-'}{tx.amount.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">{tx.currency || 'USDT'}</span>
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
                    ← Prev
                  </button>
                  {Array.from({ length: historyTotalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleHistoryPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        p === historyPage
                          ? 'bg-miami-pink/20 text-miami-pink border border-miami-pink/30'
                          : 'text-gray-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => handleHistoryPage(historyPage + 1)}
                    disabled={historyPage >= historyTotalPages}
                    className="px-3 py-1.5 rounded-lg text-sm bg-casino-dark border border-casino-border text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}