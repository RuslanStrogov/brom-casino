'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBonuses } from '@/lib/adminApi';

// ─── Types ────────────────────────────────────────────────────────────

interface Bonus {
  id: string;
  name: string;
  description: string;
  type: 'WELCOME' | 'DEPOSIT' | 'FREE_SPINS' | 'CASHBACK' | 'REFERRAL' | 'VIP';
  amount: number;
  currency: string;
  minDeposit: number | null;
  maxBonus: number | null;
  wageringRequirement: number | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  usedCount: number;
  _count: {
    claims: number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  WELCOME: { label: 'Welcome', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  DEPOSIT: { label: 'Deposit', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  FREE_SPINS: { label: 'Free Spins', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  CASHBACK: { label: 'Cashback', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  REFERRAL: { label: 'Referral', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  VIP: { label: 'VIP', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
};

// ─── Loading Spinner ──────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-white/10 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-miami-pink border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm text-gray-400">Loading bonuses...</p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-miami-pink animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-miami-purple animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-miami-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      <h2 className="text-xl font-heading font-bold text-white mb-2">Failed to Load Bonuses</h2>
      <p className="text-sm text-gray-400 text-center max-w-md mb-8">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-miami text-sm font-bold text-white transition-all hover:shadow-neon-purple"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-full bg-casino-card border border-white/10 flex items-center justify-center text-4xl mb-6">
        🎁
      </div>
      <h2 className="text-xl font-heading font-bold text-white mb-2">No Bonuses Found</h2>
      <p className="text-sm text-gray-400 text-center max-w-md mb-8">
        There are no bonuses configured yet. Create a new bonus to start promoting your platform.
      </p>
    </div>
  );
}

// ─── Type Badge ───────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] || { label: type, color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}

// ─── Active Indicator ─────────────────────────────────────────────────

function ActiveIndicator({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        active
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : 'bg-red-500/10 text-red-400 border border-red-500/20'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400' : 'bg-red-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl transition-all duration-300 group-hover:from-white/10" />
      <div className="relative p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="text-lg font-heading font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Th / Td ──────────────────────────────────────────────────────────

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${className ?? ''}`}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 whitespace-nowrap ${className ?? ''}`}>
      {children}
    </td>
  );
}

// ─── Format Helpers ───────────────────────────────────────────────────

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—';
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatWagering(wagering: number | null): string {
  if (wagering == null) return '—';
  return `${wagering}x`;
}

// ─── Pagination ───────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | null)[] = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push(null);
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push(null);
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push(null);
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push(null);
    pages.push(total);
  }
  return pages;
}

function PaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-gray-500">
        Showing{' '}
        <span className="text-white font-medium">{Math.min((page - 1) * 50 + 1, total)}</span>
        {' – '}
        <span className="text-white font-medium">{Math.min(page * 50, total)}</span>
        {' of '}
        <span className="text-white font-medium">{total.toLocaleString()}</span> bonuses
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pages.map((p, i) =>
          p === null ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-600 text-sm">
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] px-2 py-1.5 rounded-lg text-sm font-medium transition-all ${
                p === page
                  ? 'bg-gradient-miami text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function AdminBonusesPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination (client-side since API returns all bonuses)
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBonuses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBonuses();
      setBonuses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBonuses();
  }, [fetchBonuses]);

  // ── Pagination logic ──────────────────────────────────────────────

  const totalItems = bonuses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedBonuses = bonuses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ── Stats ─────────────────────────────────────────────────────────

  const activeBonuses = bonuses.filter((b) => b.isActive).length;
  const totalClaims = bonuses.reduce((sum, b) => sum + b._count.claims, 0);
  const uniqueTypes = new Set(bonuses.map((b) => b.type)).size;

  // ── Render States ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        <PageHeader />
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader />
        <ErrorState message={error} onRetry={fetchBonuses} />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Bonuses" value={totalItems.toLocaleString()} icon="🎁" />
        <StatCard label="Active" value={activeBonuses.toLocaleString()} icon="✅" />
        <StatCard label="Total Claims" value={totalClaims.toLocaleString()} icon="🎯" />
        <StatCard label="Bonus Types" value={uniqueTypes.toLocaleString()} icon="🏷️" />
      </div>

      {/* Table */}
      {bonuses.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-casino-card">
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th>Amount</Th>
                  <Th>Min Deposit</Th>
                  <Th>Wagering</Th>
                  <Th className="text-center">Active</Th>
                  <Th className="text-right">Used</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedBonuses.map((bonus) => (
                  <tr
                    key={bonus.id}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Name */}
                    <Td>
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{bonus.name}</span>
                        {bonus.description && (
                          <span className="text-xs text-gray-500 truncate max-w-[200px]">
                            {bonus.description}
                          </span>
                        )}
                      </div>
                    </Td>

                    {/* Type */}
                    <Td>
                      <TypeBadge type={bonus.type} />
                    </Td>

                    {/* Amount */}
                    <Td>
                      <span className="font-mono text-sm text-miami-cyan font-medium">
                        {bonus.currency} {formatCurrency(bonus.amount)}
                      </span>
                      {bonus.maxBonus != null && (
                        <span className="text-xs text-gray-500 block">
                          max {bonus.currency} {formatCurrency(bonus.maxBonus)}
                        </span>
                      )}
                    </Td>

                    {/* Min Deposit */}
                    <Td>
                      <span className="font-mono text-sm text-gray-300">
                        {bonus.minDeposit != null
                          ? `${bonus.currency} ${formatCurrency(bonus.minDeposit)}`
                          : '—'}
                      </span>
                    </Td>

                    {/* Wagering */}
                    <Td>
                      <span className="font-mono text-sm text-gray-300">
                        {formatWagering(bonus.wageringRequirement)}
                      </span>
                    </Td>

                    {/* Active */}
                    <Td className="text-center">
                      <div className="flex justify-center">
                        <ActiveIndicator active={bonus.isActive} />
                      </div>
                    </Td>

                    {/* Used / Claims */}
                    <Td className="text-right">
                      <span className="font-mono text-sm text-gray-300">
                        {bonus._count.claims.toLocaleString()}
                      </span>
                    </Td>

                    {/* Created */}
                    <Td>
                      <span className="text-gray-400 text-xs">
                        {formatDate(bonus.createdAt)}
                      </span>
                      {bonus.expiresAt && (
                        <span className="text-xs text-gray-500 block">
                          expires {formatDate(bonus.expiresAt)}
                        </span>
                      )}
                    </Td>

                    {/* Actions */}
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit */}
                        <button
                          className="p-2 rounded-lg text-gray-500 hover:text-miami-cyan hover:bg-white/5 transition-all"
                          title="Edit bonus"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Toggle Active */}
                        <button
                          className={`p-2 rounded-lg transition-all ${
                            bonus.isActive
                              ? 'text-green-400 hover:bg-green-500/10'
                              : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                          }`}
                          title={bonus.isActive ? 'Deactivate bonus' : 'Activate bonus'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={bonus.isActive ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'} />
                          </svg>
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <PaginationBar
            page={safePage}
            totalPages={totalPages}
            total={totalItems}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-white mb-1">Bonuses</h1>
        <p className="text-sm text-gray-400">Manage promotional bonuses, welcome offers, and loyalty rewards</p>
      </div>
      <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-miami text-sm font-bold text-white transition-all hover:shadow-neon-purple">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Bonus
      </button>
    </div>
  );
}
