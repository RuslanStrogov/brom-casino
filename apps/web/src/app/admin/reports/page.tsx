'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRevenueReport, getGameReport } from '@/lib/adminApi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RevenueReport {
  period: { from: string; to: string };
  deposits: number;
  withdrawals: number;
  netDeposits: number;
  totalBets: number;
  totalWins: number;
  grossGamingRevenue: number;
  rtp: number;
}

interface GameReportRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  totalBets: number;
  totalSessions: number;
  totalWagered: number;
  totalPaidOut: number;
  rtp: number;
}

type SortField = 'rtp' | 'totalBets';
type SortDir = 'asc' | 'desc';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number | string): string {
  const num = Number(amount);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  gradient?: string;
  accent?: string;
}) {
  return (
    <div className="relative group animate-fade-up">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent transition-all duration-300 group-hover:from-white/10" />
      <div className="relative p-5 rounded-2xl border border-white/10 backdrop-blur-md hover:border-white/20 transition-all duration-300">
        {/* Accent gradient line */}
        <div
          className={`absolute top-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${gradient ?? 'from-miami-pink to-miami-purple'} opacity-60`}
        />

        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
              accent ?? 'bg-miami-pink/10'
            }`}
          >
            {icon}
          </div>
        </div>

        <p className="text-2xl font-heading font-bold text-white mb-1 font-mono tracking-tight">
          {value}
        </p>
        <p className="text-sm text-gray-400">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ─── Sortable Table Header ───────────────────────────────────────────────────

function SortHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDir;
  onSort: (f: SortField) => void;
}) {
  const active = currentField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
        active ? 'text-miami-pink' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      {label}
      <svg
        className={`w-3 h-3 transition-transform ${
          active && direction === 'desc' ? 'rotate-180' : ''
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    </button>
  );
}

// ─── Loading Spinner ─────────────────────────────────────────────────────────

function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-miami-pink/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-t-miami-pink border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
          <div className="absolute inset-2 border-2 border-t-miami-cyan border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow" />
        </div>
        <p className="text-sm text-gray-400">{message ?? 'Loading...'}</p>
      </div>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────────────

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">
          Failed to load reports
        </h2>
        <p className="text-sm text-gray-400 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-gradient-miami text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({
  title,
  message,
  icon,
}: {
  title: string;
  message: string;
  icon?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-4xl mb-4 opacity-40">{icon ?? '📭'}</div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-xs">{message}</p>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [games, setGames] = useState<GameReportRow[] | null>(null);

  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingGames, setLoadingGames] = useState(true);

  const [errorRevenue, setErrorRevenue] = useState<string | null>(null);
  const [errorGames, setErrorGames] = useState<string | null>(null);

  const [sortField, setSortField] = useState<SortField>('totalBets');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // ── Fetch revenue ───────────────────────────────────────────────────────

  const fetchRevenue = useCallback(async (f: string, t: string) => {
    setLoadingRevenue(true);
    setErrorRevenue(null);
    try {
      const result = await getRevenueReport(f, t);
      setRevenue(result);
    } catch (err: any) {
      setErrorRevenue(err.message);
    } finally {
      setLoadingRevenue(false);
    }
  }, []);

  // ── Fetch games ─────────────────────────────────────────────────────────

  const fetchGames = useCallback(async () => {
    setLoadingGames(true);
    setErrorGames(null);
    try {
      const result = await getGameReport();
      setGames(Array.isArray(result) ? result : []);
    } catch (err: any) {
      setErrorGames(err.message);
    } finally {
      setLoadingGames(false);
    }
  }, []);

  // ── Initial load ────────────────────────────────────────────────────────

  useEffect(() => {
    fetchRevenue(from, to);
    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Date range submit ───────────────────────────────────────────────────

  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRevenue(from, to);
  };

  // ── Sort toggle ─────────────────────────────────────────────────────────

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // ── Sorted games ────────────────────────────────────────────────────────

  const sortedGames = games
    ? [...games].sort((a, b) => {
        const aVal = sortField === 'rtp' ? a.rtp : a.totalBets;
        const bVal = sortField === 'rtp' ? b.rtp : b.totalBets;
        return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
      })
    : [];

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10 animate-fade-up">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Neon glow behind title */}
        <div className="absolute -top-6 -left-6 w-40 h-40 bg-gradient-radial from-miami-pink/5 to-transparent pointer-events-none" />
        <div className="relative">
          <h1 className="text-2xl font-heading font-bold text-white mb-1">
            Reports
          </h1>
          <p className="text-sm text-gray-400">
            Revenue overview and game performance metrics
          </p>
        </div>
      </div>

      {/* ================================================================== */}
      {/*  REVENUE REPORT SECTION                                            */}
      {/* ================================================================== */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-heading font-bold text-white">
            <span className="bg-gradient-miami bg-clip-text text-transparent">
              Revenue Report
            </span>
          </h2>

          {/* Date range picker */}
          <form
            onSubmit={handleDateSubmit}
            className="flex items-center gap-3 flex-wrap"
          >
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-casino-card border border-white/10 text-white text-sm focus:outline-none focus:border-miami-pink/50 focus:ring-1 focus:ring-miami-pink/20 transition-all [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-casino-card border border-white/10 text-white text-sm focus:outline-none focus:border-miami-pink/50 focus:ring-1 focus:ring-miami-pink/20 transition-all [color-scheme:dark]"
              />
            </div>
            <button
              type="submit"
              disabled={loadingRevenue}
              className="px-4 py-1.5 rounded-lg bg-gradient-miami text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-neon-pink/20"
            >
              {loadingRevenue ? 'Loading...' : 'Apply'}
            </button>
          </form>
        </div>

        {/* Revenue stat cards */}
        {loadingRevenue ? (
          <LoadingState message="Loading revenue report..." />
        ) : errorRevenue ? (
          <ErrorState
            message={errorRevenue}
            onRetry={() => fetchRevenue(from, to)}
          />
        ) : revenue ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard
              title="Deposits"
              value={`${formatCurrency(revenue.deposits)} USDT`}
              icon="💰"
              gradient="from-green-400 to-emerald-500"
              accent="bg-green-500/10"
            />
            <StatCard
              title="Withdrawals"
              value={`${formatCurrency(revenue.withdrawals)} USDT`}
              icon="💸"
              gradient="from-red-400 to-rose-500"
              accent="bg-red-500/10"
            />
            <StatCard
              title="Net Deposits"
              value={`${formatCurrency(revenue.netDeposits)} USDT`}
              subtitle={
                revenue.netDeposits >= 0 ? 'Positive flow' : 'Negative flow'
              }
              icon="📊"
              gradient="from-miami-cyan to-blue-400"
              accent="bg-cyan-500/10"
            />
            <StatCard
              title="Total Bets"
              value={formatNumber(revenue.totalBets)}
              icon="🎲"
              gradient="from-miami-purple to-violet-500"
              accent="bg-purple-500/10"
            />
            <StatCard
              title="Total Wins"
              value={formatNumber(revenue.totalWins)}
              icon="🏆"
              gradient="from-miami-orange to-amber-500"
              accent="bg-orange-500/10"
            />
            <StatCard
              title="Gross Gaming Revenue"
              value={`${formatCurrency(revenue.grossGamingRevenue)} USDT`}
              subtitle="Total revenue before expenses"
              icon="📈"
              gradient="from-miami-pink to-rose-500"
              accent="bg-miami-pink/10"
            />
            <StatCard
              title="RTP"
              value={`${revenue.rtp.toFixed(2)}%`}
              subtitle="Return to Player"
              icon="🎯"
              gradient="from-miami-neon to-green-400"
              accent="bg-miami-neon/10"
            />
            {/* Period info card */}
            <div className="relative group animate-fade-up">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent transition-all duration-300 group-hover:from-white/10" />
              <div className="relative p-5 rounded-2xl border border-white/10 backdrop-blur-md">
                <div className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r from-miami-pink to-miami-cyan opacity-60" />
                <div className="w-10 h-10 rounded-xl bg-miami-pink/10 flex items-center justify-center text-lg mb-4">
                  📅
                </div>
                <p className="text-sm font-heading font-bold text-white mb-1">
                  {revenue.period.from} — {revenue.period.to}
                </p>
                <p className="text-xs text-gray-500">Report period</p>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* ================================================================== */}
      {/*  GAME PERFORMANCE SECTION                                          */}
      {/* ================================================================== */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-heading font-bold text-white">
            <span className="bg-gradient-miami bg-clip-text text-transparent">
              Game Performance
            </span>
          </h2>
          {games && games.length > 0 && (
            <span className="text-xs text-gray-500">
              {games.length} game{games.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loadingGames ? (
          <LoadingState message="Loading game report..." />
        ) : errorGames ? (
          <ErrorState message={errorGames} onRetry={fetchGames} />
        ) : !games || games.length === 0 ? (
          <div className="rounded-2xl border border-white/10 backdrop-blur-md bg-casino-card/50">
            <EmptyState
              title="No game data"
              message="Game performance data will appear here once players start playing."
              icon="🎮"
            />
          </div>
        ) : (
          <div className="relative rounded-2xl border border-white/10 backdrop-blur-md bg-casino-card/50 overflow-hidden">
            {/* Neon accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-miami-pink/30 to-transparent" />

            {/* Table wrapper - horizontal scroll on mobile */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                {/* ── Table Head ────────────────────────────────────────── */}
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Category
                    </th>
                    <th className="text-right px-4 py-3.5">
                      <SortHeader
                        label="Total Bets"
                        field="totalBets"
                        currentField={sortField}
                        direction={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="text-right px-4 py-3.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Sessions
                    </th>
                    <th className="text-right px-4 py-3.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Wagered
                    </th>
                    <th className="text-right px-4 py-3.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Paid Out
                    </th>
                    <th className="text-right px-4 py-3.5">
                      <SortHeader
                        label="RTP"
                        field="rtp"
                        currentField={sortField}
                        direction={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                  </tr>
                </thead>

                {/* ── Table Body ────────────────────────────────────────── */}
                <tbody>
                  {sortedGames.map((game, idx) => (
                    <tr
                      key={game.id}
                      className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${
                        idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-gradient-miami" />
                          <span className="text-sm font-medium text-white">
                            {game.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white/5 text-gray-400 capitalize">
                          {game.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-white font-mono">
                          {formatNumber(game.totalBets)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-gray-300 font-mono">
                          {formatNumber(game.totalSessions)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-white font-mono">
                          {formatCurrency(game.totalWagered)}{' '}
                          <span className="text-xs text-gray-500">USDT</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-white font-mono">
                          {formatCurrency(game.totalPaidOut)}{' '}
                          <span className="text-xs text-gray-500">USDT</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`text-sm font-mono font-medium ${
                            game.rtp >= 100
                              ? 'text-miami-pink'
                              : game.rtp >= 95
                                ? 'text-green-400'
                                : 'text-gray-300'
                          }`}
                        >
                          {game.rtp.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer row counts */}
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Showing {sortedGames.length} game
                {sortedGames.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-gray-500">
                Sorted by{' '}
                <span className="text-miami-pink">
                  {sortField === 'rtp' ? 'RTP' : 'Total Bets'}{' '}
                  {sortDir === 'desc' ? '↓' : '↑'}
                </span>
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}