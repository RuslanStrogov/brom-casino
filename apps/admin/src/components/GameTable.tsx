'use client';

import React from 'react';
import { MoreHorizontal, TrendingUp, TrendingDown, Play } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  type: 'slots' | 'crash' | 'dice' | 'roulette' | 'blackjack';
  provider: string;
  rtp: number;
  totalBets: number;
  totalWagered: number;
  houseProfit: number;
  status: 'active' | 'maintenance' | 'disabled';
  popularity: number; // 1-100
}

const MOCK_GAMES: Game[] = [
  { id: 'slot-1', name: 'Lucky 7s', type: 'slots', provider: 'BROM', rtp: 96.5, totalBets: 245000, totalWagered: 680000, houseProfit: 23800, status: 'active', popularity: 92 },
  { id: 'crash-1', name: 'Moon Rocket', type: 'crash', provider: 'BROM', rtp: 97.0, totalBets: 189000, totalWagered: 520000, houseProfit: 15600, status: 'active', popularity: 88 },
  { id: 'slot-2', name: 'Diamond Rush', type: 'slots', provider: 'BROM', rtp: 97.2, totalBets:156000, totalWagered: 450000, houseProfit: 12600, status: 'active', popularity: 75 },
  { id: 'dice-1', name: 'Dice Roll', type: 'dice', provider: 'BROM', rtp: 99.0, totalBets: 98000, totalWagered: 210000, houseProfit: 2100, status: 'active', popularity: 65 },
  { id: 'blackjack-1', name: 'TON Blackjack', type: 'blackjack', provider: 'BROM', rtp: 99.5, totalBets: 45000, totalWagered: 180000, houseProfit: 900, status: 'active', popularity: 42 },
  { id: 'roulette-1', name: 'Euro Roulette', type: 'roulette', provider: 'BROM', rtp: 97.3, totalBets: 67000, totalWagered: 195000, houseProfit: 5265, status: 'active', popularity: 58 },
  { id: 'slot-3', name: 'Neon Fruits', type: 'slots', provider: 'BROM', rtp: 95.8, totalBets: 34000, totalWagered: 85000, houseProfit: 3570, status: 'maintenance', popularity: 35 },
];

const TYPE_BADGES: Record<Game['type'], string> = {
  slots: 'bg-purple-500/10 text-purple-400',
  crash: 'bg-green-500/10 text-green-400',
  dice: 'bg-blue-500/10 text-blue-400',
  roulette: 'bg-red-500/10 text-red-400',
  blackjack: 'bg-amber-500/10 text-amber-400',
};

export default function GameTable() {
  const [sortBy, setSortBy] = React.useState<'popularity' | 'wagered' | 'profit'>('popularity');

  const sortedGames = [...MOCK_GAMES].sort((a, b) => {
    if (sortBy === 'wagered') return b.totalWagered - a.totalWagered;
    if (sortBy === 'profit') return b.houseProfit - a.houseProfit;
    return b.popularity - a.popularity;
  });

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Games</h2>
          <div className="flex items-center gap-2">
            {(['popularity', 'wagered', 'profit'] as const).map(sort => (
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
        {sortedGames.map(game => (
          <div key={game.id} className="px-5 py-3 hover:bg-gray-800/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                  <Play className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{game.name}</p>
                    <span className={`badge text-[10px] ${TYPE_BADGES[game.type]}`}>
                      {game.type}
                    </span>
                    {game.status === 'maintenance' && (
                      <span className="badge badge-warning text-[10px]">maintenance</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    RTP {game.rtp}% • {game.totalBets.toLocaleString()} bets
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-400">
                  +${game.houseProfit.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {game.totalWagered.toLocaleString()} TON wagered
                </p>
              </div>
            </div>

            {/* Popularity bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                  style={{ width: `${game.popularity}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 w-8 text-right">{game.popularity}%</span>
            </div>
          </div>
        ))}
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
