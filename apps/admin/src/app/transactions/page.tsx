'use client';

import React from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { ArrowLeftRight, ArrowDownCircle, ArrowUpCircle, Clock } from 'lucide-react';
import StatsCard from '../../components/StatsCard';
import TransactionTable from '../../components/TransactionTable';

export default function TransactionsPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Please log in to access this page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor deposits, withdrawals, bets, and all financial activity</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-amber-500/50 transition-colors text-sm">
            <Clock className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Transactions"
          value="15,234"
          change={18.7}
          icon={<ArrowLeftRight className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Deposits (24h)"
          value="12,500 TON"
          change={22.3}
          icon={<ArrowDownCircle className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Withdrawals (24h)"
          value="8,200 TON"
          change={-5.1}
          icon={<ArrowUpCircle className="w-5 h-5" />}
          color="red"
        />
        <StatsCard
          title="Pending"
          value="3"
          change={0}
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Transaction Table */}
      <TransactionTable />
    </div>
  );
}