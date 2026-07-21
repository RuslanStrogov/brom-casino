'use client';

import React from 'react';
import { MoreHorizontal, TrendingUp, ArrowDownRight, Play } from 'lucide-react';
import { adminApi } from '../lib/api';

interface Game {
  id: string;
  name: string;
  category: string;
  providerId: string;
  rtp: number;
  totalBets: number;
  totalSessions: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  volatility: string;
  minBet: string;
  maxBet: string;
}

const CATEGORY_BADGES: Record<string, string> = {
  SLOTS: 'bg-purple-500/10 text-purple-400',
  CRASH: 'bg-green-500/10 text-green-400',
  DICE: 'bg-blue-500/10 text-blue-400',
  LIVE: 'bg-red-500/10 text-red-400',
  TABLE: 'bg-amber-500/10 text-amber-400',
  SPORTS: 'bg-cyan-500/10 text-cyan-400',
  VIRTUAL: 'bg-pink-500/10 text-pink-400',
};

export default function GameTable() {
  const [games, setGames] = React.useState<Game[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sortBy, setSortBy] = React.useState<'name' | 'bets' | 'rtp'>('bets');

  React.useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const res = await adminApi.games.list({ limit: 50 });
        const data = res.data;
        const mapped: Game[] = (data.games || []).map((g: any) => ({
          id: g.id,
          name: g.name,
          category: g.category || 'SLOTS',
          providerId: g.providerId || 'unknown',
          rtp: Number(g.rtp || 0),
          totalBets: g._count?.bets || 0,
          totalSessions: g._count?.gameSessions || 0,
          isActive: g.isActive ?? true,
          isFeatured: g.isFeatured ?? false,
          isNew: g.isNew ?? false,
          volatility: g.volatility || 'MEDIUM',
          minBet: g.minBet || '0',
          maxBet: g.maxBet || '0',
        }));
        setGames(mapped);
      } catch (err) {
        console.error('Failed to fetch games:', err);
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const sortedGames = [...games].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'rtp') return b.rtp - a.rtp;
    return b.totalBets - a.totalBets;
  });

  const getCategoryBadge = (category: string) => {
    const cls = CATEGORY_BADGES[category] || 'bg-gray-500/10 text-gray-400';
    return <span className={`badge text-[10px] ${cls}`}>{category.toLowerCase()}</span>;
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Games</h2>
          <div className="flex items-center gap-2">
            {(['bets', 'name', 'rtp'] as const).map(sort => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === sort
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Game List */}
      <div className="divide-y divide-gray-800">
        {sortedGames.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500">No games found</div>
        ) : (
          sortedGames.map(game => (
            <div key={game.id} className="px-5 py-3 hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                    <Play className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{game.name}</p>
                      {getCategoryBadge(game.category)}
                      {game.isNew && (
                        <span className="badge text-[10px] bg-green-500/10 text-green-400">new</span>
                      )}
                      {game.isFeatured && (
                        <span className="badge text-[10px] bg-amber-500/10 text-amber-400">featured</span>
                      )}
                      {!game.isActive && (
                        <span className="badge badge-warning text-[10px]">disabled</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      RTP {game.rtp}% • {game.providerId} • {game.volatility.toLowerCase()}
                      {game.totalBets > 0 && ` • ${game.totalBets} bets`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">
                    ${game.minBet} – ${game.maxBet}
                  </p>
                  <p className="text-xs text-gray-500">
                    {game.totalSessions > 0 ? `${game.totalSessions} sessions` : 'No activity'}
                  </p>
                </div>
              </div>

              {/* Activity bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                    style={{ width: `${Math.min(game.rtp, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 w-12 text-right">RTP {game.rtp}%</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-800">
        <button className="text-sm text-amber-400 hover:text-amber-300 w-full text-center">
          Manage games →
        </button>
      </div>
    </div>
  );
}