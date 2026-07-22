'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAdminGames, syncGames, updateGame } from '@/lib/adminApi';

interface Game {
  id: string;
  name: string;
  slug: string;
  category: string;
  providerId: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  rtp: number | null;
  minBet: number | null;
  maxBet: number | null;
  tags: string[];
  _count: {
    bets: number;
    gameSessions: number;
  };
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EditModalState {
  game: Game;
  field: 'minBet' | 'maxBet';
  value: string;
}

// ─── Loading Skeleton ────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="grid grid-cols-12 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-10 bg-casino-card2 rounded-lg" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-4">
          {Array.from({ length: 12 }).map((_, j) => (
            <div key={j} className="h-8 bg-casino-card rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Toggle Switch ───────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      title={label}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-miami-purple/50 ${
        checked ? 'bg-miami-purple' : 'bg-casino-border'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
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

// ─── Edit Modal ──────────────────────────────────────────────────────

function EditModal({
  state,
  onSave,
  onClose,
  saving,
}: {
  state: EditModalState;
  onSave: (value: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [localValue, setLocalValue] = useState(state.value);

  useEffect(() => {
    setLocalValue(state.value);
  }, [state.value]);

  const label = state.field === 'minBet' ? 'Minimum Bet' : 'Maximum Bet';
  const placeholder = state.field === 'minBet' ? '0.00' : '10000.00';

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && !saving) onSave(localValue);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [localValue, saving, onClose, onSave]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-casino-dark p-6 shadow-card-miami animate-scale-in">
        {/* Neon accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-miami-purple to-transparent" />

        <h3 className="text-lg font-heading font-bold text-white mb-1">
          Edit {label}
        </h3>
        <p className="text-sm text-gray-400 mb-5">
          Game: <span className="text-white font-medium">{state.game.name}</span>
        </p>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            $
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-casino-card border border-casino-border text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-miami-purple/50 focus:ring-1 focus:ring-miami-purple/20 transition-all"
          />
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(localValue)}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-miami text-sm font-bold text-white transition-all hover:shadow-neon-purple disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Toggle saving
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Edit modal
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const fetchGames = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminGames(page, 50);
      setGames(res.games);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames(currentPage);
  }, [currentPage, fetchGames]);

  // ── Sync Handler ─────────────────────────────────────────────────

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncGames();
      setSyncMessage({ type: 'success', text: `Synced ${res.synced} games successfully!` });
      await fetchGames(currentPage);
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: err.message });
    } finally {
      setSyncing(false);
    }
  };

  // ── Toggle Handler ───────────────────────────────────────────────

  const handleToggle = async (game: Game, field: 'isActive' | 'isFeatured' | 'isNew') => {
    setTogglingId(`${game.id}-${field}`);
    try {
      await updateGame(game.id, { [field]: !game[field] });
      setGames((prev) =>
        prev.map((g) => (g.id === game.id ? { ...g, [field]: !g[field] } : g))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  // ── Edit Save Handler ────────────────────────────────────────────

  const handleEditSave = async (value: string) => {
    if (!editModal) return;
    setEditSaving(true);
    try {
      const numValue = value === '' ? null : parseFloat(value);
      await updateGame(editModal.game.id, { [editModal.field]: numValue });
      setGames((prev) =>
        prev.map((g) =>
          g.id === editModal.game.id ? { ...g, [editModal.field]: numValue } : g
        )
      );
      setEditModal(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const openEdit = (game: Game, field: 'minBet' | 'maxBet') => {
    setEditModal({
      game,
      field,
      value: game[field]?.toString() ?? '',
    });
  };

  // ── Pagination ───────────────────────────────────────────────────

  const handlePageChange = (page: number) => {
    if (page < 1 || page > meta.totalPages) return;
    setCurrentPage(page);
  };

  // ── Render States ────────────────────────────────────────────────

  if (loading && games.length === 0) {
    return (
      <div>
        <PageHeader syncing={syncing} onSync={handleSync} />
        <div className="mt-8">
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (error && games.length === 0) {
    return (
      <div>
        <PageHeader syncing={syncing} onSync={handleSync} />
        <div className="mt-8">
          <ErrorState message={error} onRetry={() => fetchGames(currentPage)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader syncing={syncing} onSync={handleSync} />

      {/* Sync Banner */}
      {syncMessage && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl border text-sm flex items-center gap-3 ${
            syncMessage.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {syncMessage.type === 'success' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <span>{syncMessage.text}</span>
          <button
            onClick={() => setSyncMessage(null)}
            className="ml-auto text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Games" value={meta.total.toLocaleString()} icon="🎮" />
        <StatCard
          label="Active"
          value={games.filter((g) => g.isActive).length.toLocaleString()}
          icon="✅"
        />
        <StatCard
          label="Featured"
          value={games.filter((g) => g.isFeatured).length.toLocaleString()}
          icon="⭐"
        />
        <StatCard
          label="New"
          value={games.filter((g) => g.isNew).length.toLocaleString()}
          icon="🆕"
        />
      </div>

      {/* Games Table */}
      {games.length === 0 ? (
        <EmptyState onSync={handleSync} syncing={syncing} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              {/* Table Head */}
              <thead>
                <tr className="border-b border-white/5 bg-casino-card">
                  <Th>Name</Th>
                  <Th>Slug</Th>
                  <Th>Category</Th>
                  <Th>Provider</Th>
                  <Th>RTP</Th>
                  <Th>Status</Th>
                  <Th className="text-center">Featured</Th>
                  <Th className="text-center">New</Th>
                  <Th className="text-right">Bets</Th>
                  <Th className="text-right">Sessions</Th>
                  <Th>Min Bet</Th>
                  <Th>Max Bet</Th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-white/5">
                {games.map((game) => (
                  <tr
                    key={game.id}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Name */}
                    <Td>
                      <span className="text-white font-medium">{game.name}</span>
                    </Td>

                    {/* Slug */}
                    <Td>
                      <code className="text-xs text-gray-500">{game.slug}</code>
                    </Td>

                    {/* Category */}
                    <Td>
                      <CategoryBadge category={game.category} />
                    </Td>

                    {/* Provider */}
                    <Td>
                      <span className="text-gray-400">{game.providerId || '—'}</span>
                    </Td>

                    {/* RTP */}
                    <Td>
                      <span className="font-mono text-sm text-gray-300">
                        {game.rtp != null ? `${game.rtp.toFixed(1)}%` : '—'}
                      </span>
                    </Td>

                    {/* Status (Active toggle) */}
                    <Td>
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          checked={game.isActive}
                          onChange={() => handleToggle(game, 'isActive')}
                          label="Toggle active status"
                        />
                        <StatusBadge active={game.isActive} />
                      </div>
                    </Td>

                    {/* Featured toggle */}
                    <Td className="text-center">
                      <div className="flex justify-center">
                        <ToggleSwitch
                          checked={game.isFeatured}
                          onChange={() => handleToggle(game, 'isFeatured')}
                          label="Toggle featured"
                        />
                      </div>
                    </Td>

                    {/* New toggle */}
                    <Td className="text-center">
                      <div className="flex justify-center">
                        <ToggleSwitch
                          checked={game.isNew}
                          onChange={() => handleToggle(game, 'isNew')}
                          label="Toggle new game badge"
                        />
                      </div>
                    </Td>

                    {/* Bets count */}
                    <Td className="text-right">
                      <span className="font-mono text-sm text-gray-300">
                        {game._count.bets.toLocaleString()}
                      </span>
                    </Td>

                    {/* Sessions count */}
                    <Td className="text-right">
                      <span className="font-mono text-sm text-gray-300">
                        {game._count.gameSessions.toLocaleString()}
                      </span>
                    </Td>

                    {/* Min Bet (editable) */}
                    <Td>
                      <button
                        onClick={() => openEdit(game, 'minBet')}
                        className="font-mono text-sm text-miami-cyan hover:text-miami-cyan/80 transition-colors group/edit cursor-pointer"
                        title="Click to edit min bet"
                      >
                        <span className="flex items-center gap-1">
                          {game.minBet != null ? `$${game.minBet.toFixed(2)}` : '—'}
                          <svg
                            className="w-3 h-3 text-gray-600 group-hover/edit:text-miami-cyan transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </span>
                      </button>
                    </Td>

                    {/* Max Bet (editable) */}
                    <Td>
                      <button
                        onClick={() => openEdit(game, 'maxBet')}
                        className="font-mono text-sm text-miami-cyan hover:text-miami-cyan/80 transition-colors group/edit cursor-pointer"
                        title="Click to edit max bet"
                      >
                        <span className="flex items-center gap-1">
                          {game.maxBet != null ? `$${game.maxBet.toFixed(2)}` : '—'}
                          <svg
                            className="w-3 h-3 text-gray-600 group-hover/edit:text-miami-cyan transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </span>
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <PaginationBar
              page={currentPage}
              totalPages={meta.totalPages}
              total={meta.total}
              onPageChange={handlePageChange}
            />
          )}

          {/* Inline error for toggle/edit failures */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editModal && (
        <EditModal
          state={editModal}
          onSave={handleEditSave}
          onClose={() => setEditModal(null)}
          saving={editSaving}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function PageHeader({
  syncing,
  onSync,
}: {
  syncing: boolean;
  onSync: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-white mb-1">Games</h1>
        <p className="text-sm text-gray-400">Manage game catalog, sync providers, and toggle game visibility</p>
      </div>
      <button
        onClick={onSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-miami text-sm font-bold text-white transition-all hover:shadow-neon-purple disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {syncing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Sync Games
          </>
        )}
      </button>
    </div>
  );
}

// ─── Th / Td ─────────────────────────────────────────────────────────

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${className ?? ''}`}
    >
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

// ─── Category Badge ──────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  slots: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  table: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  live: 'bg-green-500/10 text-green-400 border-green-500/20',
  crash: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  lottery: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  fishing: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  sports: 'bg-red-500/10 text-red-400 border-red-500/20',
  poker: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function CategoryBadge({ category }: { category: string }) {
  const colorClass = CATEGORY_COLORS[category.toLowerCase()] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {category}
    </span>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────

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

// ─── Empty State ─────────────────────────────────────────────────────

function EmptyState({ onSync, syncing }: { onSync: () => void; syncing: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-full bg-casino-card border border-white/10 flex items-center justify-center text-4xl mb-6">
        🎮
      </div>
      <h2 className="text-xl font-heading font-bold text-white mb-2">No Games Found</h2>
      <p className="text-sm text-gray-400 text-center max-w-md mb-8">
        There are no games in the catalog yet. Sync with game providers to populate the game list.
      </p>
      <button
        onClick={onSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-miami text-sm font-bold text-white transition-all hover:shadow-neon-purple disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {syncing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Sync Games
          </>
        )}
      </button>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl mb-6">
        ⚠️
      </div>
      <h2 className="text-xl font-heading font-bold text-white mb-2">Failed to Load Games</h2>
      <p className="text-sm text-gray-400 text-center max-w-md mb-8">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-sm font-medium text-white hover:bg-white/5 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Try Again
      </button>
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────

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
  const pages = getPageNumbers(page, totalPages);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-gray-500">
        Showing <span className="text-white font-medium">{Math.min((page - 1) * 50 + 1, total)}</span>
        {' '}&ndash;{' '}
        <span className="text-white font-medium">{Math.min(page * 50, total)}</span>
        {' '}of <span className="text-white font-medium">{total.toLocaleString()}</span> games
      </p>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
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

        {/* Next */}
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

function getPageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [];

  if (current <= 4) {
    // Show first 5 + ellipsis + last
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push(null);
    pages.push(total);
  } else if (current >= total - 3) {
    // Show first + ellipsis + last 5
    pages.push(1);
    pages.push(null);
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    // Show first + ellipsis + current-1, current, current+1 + ellipsis + last
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
