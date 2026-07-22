'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAuditLogs } from '@/lib/adminApi';

// ── Types ──────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  newValue: string | null;
  createdAt: string;
  user: { username: string; email: string } | null;
}

interface AuditMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Action configuration ───────────────────────────────────────────────────

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'BALANCE_ADJUSTMENT', label: 'Balance Adjustment' },
  { value: 'WITHDRAWAL_APPROVE', label: 'Withdrawal Approve' },
  { value: 'WITHDRAWAL_REJECT', label: 'Withdrawal Reject' },
  { value: 'USER_BAN', label: 'User Ban' },
  { value: 'USER_UNBAN', label: 'User Unban' },
  { value: 'GAME_UPDATE', label: 'Game Update' },
  { value: 'GAME_CREATE', label: 'Game Create' },
  { value: 'BONUS_ISSUE', label: 'Bonus Issue' },
  { value: 'KYC_APPROVE', label: 'KYC Approve' },
  { value: 'KYC_REJECT', label: 'KYC Reject' },
  { value: 'DEPOSIT_MANUAL', label: 'Deposit Manual' },
  { value: 'SETTINGS_CHANGE', label: 'Settings Change' },
];

const ACTION_COLORS: Record<string, string> = {
  BALANCE_ADJUSTMENT: 'text-miami-cyan border-miami-cyan/30 bg-miami-cyan/5',
  WITHDRAWAL_APPROVE: 'text-green-400 border-green-400/30 bg-green-400/5',
  WITHDRAWAL_REJECT: 'text-red-400 border-red-400/30 bg-red-400/5',
  USER_BAN: 'text-red-400 border-red-400/30 bg-red-400/5',
  USER_UNBAN: 'text-green-400 border-green-400/30 bg-green-400/5',
  GAME_UPDATE: 'text-miami-purple border-miami-purple/30 bg-miami-purple/5',
  GAME_CREATE: 'text-miami-purple border-miami-purple/30 bg-miami-purple/5',
  BONUS_ISSUE: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  KYC_APPROVE: 'text-green-400 border-green-400/30 bg-green-400/5',
  KYC_REJECT: 'text-red-400 border-red-400/30 bg-red-400/5',
  DEPOSIT_MANUAL: 'text-miami-cyan border-miami-cyan/30 bg-miami-cyan/5',
  SETTINGS_CHANGE: 'text-miami-pink border-miami-pink/30 bg-miami-pink/5',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatAction(action: string): string {
  return action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function getFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tryParseJson(raw: string | null): { isJson: boolean; parsed: any; str: string } {
  if (!raw) return { isJson: false, parsed: null, str: '' };
  try {
    const parsed = JSON.parse(raw);
    return { isJson: true, parsed, str: JSON.stringify(parsed, null, 2) };
  } catch {
    return { isJson: false, parsed: null, str: raw };
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function JsonPreview({ raw }: { raw: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const { isJson, str } = tryParseJson(raw);

  if (!raw) {
    return <span className="text-gray-500 italic">—</span>;
  }

  const preview = isJson
    ? raw.length > 60
      ? raw.slice(0, 60) + '…'
      : raw
    : raw.length > 60
      ? raw.slice(0, 60) + '…'
      : raw;

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-left text-xs font-mono text-gray-300 hover:text-miami-cyan transition-colors break-all leading-relaxed max-w-[220px]"
      >
        {expanded ? (
          <pre className="whitespace-pre-wrap text-[11px] text-gray-200 bg-casino-darker/80 rounded-lg p-3 border border-white/5 max-h-48 overflow-y-auto custom-scrollbar">
            {str}
          </pre>
        ) : (
          <span className="truncate block">{preview}</span>
        )}
      </button>
      {raw && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-miami-cyan/60 hover:text-miami-cyan mt-0.5 transition-colors"
        >
          {expanded ? 'Collapse ▲' : 'Expand ▼'}
        </button>
      )}
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const colorClass = ACTION_COLORS[action] || 'text-gray-400 border-gray-400/30 bg-gray-400/5';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${colorClass}`}
    >
      {formatAction(action)}
    </span>
  );
}

function EntityBadge({ entity }: { entity: string }) {
  const colors: Record<string, string> = {
    USER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    WITHDRAWAL: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    DEPOSIT: 'bg-green-500/10 text-green-400 border-green-500/20',
    GAME: 'bg-miami-purple/10 text-miami-purple border-miami-purple/20',
    BONUS: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    KYC: 'bg-miami-cyan/10 text-miami-cyan border-miami-cyan/20',
    SETTINGS: 'bg-miami-pink/10 text-miami-pink border-miami-pink/20',
  };
  const colorClass = colors[entity] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${colorClass}`}>
      {entity}
    </span>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-casino-card/50 animate-pulse border border-white/5" />
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<AuditMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');

  const limit = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAuditLogs(page, limit, actionFilter || undefined, userIdFilter || undefined);
      setLogs(result.logs);
      setMeta(result.meta);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
      setLogs([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, userIdFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset to page 1 when filters change
  const handleFilterChange = (newAction: string) => {
    setActionFilter(newAction);
    setPage(1);
  };

  const handleUserIdChange = (value: string) => {
    setUserIdFilter(value);
    setPage(1);
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-white mb-1">Audit Logs</h1>
        <p className="text-sm text-gray-400">Track all administrative actions across the platform</p>
      </div>

      {/* Filters */}
      <div className="relative group mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
        <div className="relative p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Action filter */}
            <div className="flex-1">
              <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">
                Action Type
              </label>
              <select
                value={actionFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-casino-dark border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-miami-pink/50 focus:ring-1 focus:ring-miami-pink/20 transition-all appearance-none cursor-pointer"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* User ID filter */}
            <div className="flex-1">
              <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-1.5">
                User ID
              </label>
              <input
                type="text"
                value={userIdFilter}
                onChange={(e) => handleUserIdChange(e.target.value)}
                placeholder="Filter by user ID..."
                className="w-full px-3 py-2.5 rounded-xl bg-casino-dark border border-white/10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-miami-cyan/50 focus:ring-1 focus:ring-miami-cyan/20 transition-all"
              />
            </div>

            {/* Refresh button */}
            <div className="flex items-end">
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-gradient-miami text-white text-sm font-semibold hover:shadow-neon-pink transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      {meta && !loading && (
        <div className="mb-4 text-xs text-gray-500 font-medium">
          Showing {logs.length} of {meta.total} log entries
        </div>
      )}

      {/* ── Loading State ──────────────────────────────────────────────── */}
      {loading && <LoadingSkeleton />}

      {/* ── Error State ────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Failed to load audit logs</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-md text-center">{error}</p>
          <button
            onClick={fetchLogs}
            className="px-5 py-2.5 rounded-xl bg-gradient-miami text-white text-sm font-semibold hover:shadow-neon-pink transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Empty State ────────────────────────────────────────────────── */}
      {!loading && !error && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-miami-cyan/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-miami-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">No audit logs found</h2>
          <p className="text-sm text-gray-400 max-w-md text-center">
            {actionFilter || userIdFilter
              ? 'No logs match your current filters. Try adjusting your search criteria.'
              : 'There are no administrative actions recorded yet.'}
          </p>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {!loading && !error && logs.length > 0 && (
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md">
            {/* Table wrapper - horizontal scroll on mobile */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[900px]">
                {/* Table head */}
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                      Action
                    </th>
                    <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                      Entity
                    </th>
                    <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                      Entity ID
                    </th>
                    <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                      Admin
                    </th>
                    <th className="text-left px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                      Value Preview
                    </th>
                    <th className="text-right px-4 py-3.5 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>

                {/* Table body */}
                <tbody>
                  {logs.map((log, idx) => (
                    <tr
                      key={log.id}
                      className={`group border-b border-white/5 transition-all duration-200 hover:bg-white/[0.02] ${
                        idx === logs.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      {/* Action */}
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>

                      {/* Entity */}
                      <td className="px-4 py-3">
                        <EntityBadge entity={log.entity} />
                      </td>

                      {/* Entity ID */}
                      <td className="px-4 py-3">
                        <code className="text-xs text-gray-400 font-mono bg-casino-darker/50 px-1.5 py-0.5 rounded border border-white/5">
                          {log.entityId}
                        </code>
                      </td>

                      {/* Admin */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-200">
                            {log.user?.username || 'System'}
                          </span>
                          {log.user?.email && (
                            <span className="text-[11px] text-gray-500 truncate max-w-[140px]">
                              {log.user.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Value Preview */}
                      <td className="px-4 py-3">
                        <JsonPreview raw={log.newValue} />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-200 font-medium" title={getFullDate(log.createdAt)}>
                            {getRelativeTime(log.createdAt)}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(log.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
          <div className="text-xs text-gray-500">
            Page {meta.page} of {meta.totalPages}
          </div>
          <div className="flex items-center gap-2">
            {/* Previous */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-casino-card border border-white/10 text-gray-300 hover:text-white hover:border-miami-pink/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(meta.totalPages, 7) }).map((_, i) => {
                // Calculate the page number to show
                let pageNum: number;
                const total = meta.totalPages;
                const current = meta.page;

                if (total <= 7) {
                  pageNum = i + 1;
                } else if (current <= 4) {
                  pageNum = i + 1;
                } else if (current >= total - 3) {
                  pageNum = total - 6 + i;
                } else {
                  pageNum = current - 3 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-all ${
                      pageNum === meta.page
                        ? 'bg-gradient-miami text-white shadow-neon-pink'
                        : 'bg-casino-card border border-white/10 text-gray-400 hover:text-white hover:border-miami-cyan/30'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-casino-card border border-white/10 text-gray-300 hover:text-white hover:border-miami-pink/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}