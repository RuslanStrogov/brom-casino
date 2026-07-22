'use client';

import { useFavoritesStore, useRecentStore } from '@/stores/favoritesStore';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

const PROVIDER_META: Record<string, { name: string; emoji: string }> = {
  pragmatic: { name: 'Pragmatic Play', emoji: '🎰' },
  evolution: { name: 'Evolution', emoji: '🎡' },
  spribe: { name: 'Spribe', emoji: '✈️' },
  netent: { name: 'NetEnt', emoji: '⭐' },
  microgaming: { name: 'Microgaming', emoji: '🎮' },
  playngo: { name: "Play'n GO", emoji: '🎲' },
  yggdrasil: { name: 'Yggdrasil', emoji: '🌳' },
  hacksaw: { name: 'Hacksaw Gaming', emoji: '🪚' },
  pushgaming: { name: 'Push Gaming', emoji: '🔥' },
  redtiger: { name: 'Red Tiger', emoji: '🐯' },
  playtech: { name: 'Playtech', emoji: '🎯' },
  relaxgaming: { name: 'Relax Gaming', emoji: '🧘' },
  truelab: { name: 'TrueLab', emoji: '🔬' },
  elkstudios: { name: 'ELK Studios', emoji: '🦌' },
  thunderkick: { name: 'Thunderkick', emoji: '⚡' },
  nolimitcity: { name: 'Nolimit City', emoji: '🏙️' },
  slotmill: { name: 'Slotmill', emoji: '⚙️' },
  bgaming: { name: 'BGaming', emoji: '🎪' },
};

interface ApiGame {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  providerId: string;
  rtp: number | null;
}

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useFavoritesStore();
  const { recents } = useRecentStore();
  const [apiGames, setApiGames] = useState<ApiGame[]>([]);
  const [activeTab, setActiveTab] = useState<'favorites' | 'recents'>('favorites');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const data = token
          ? await api.getGames(token, { limit: 50 })
          : await fetch('/api/games?limit=50').then(r => r.json());
        setApiGames(data?.games || data || []);
      } catch (err) {
        console.error('Failed to fetch games:', err);
      }
    };
    fetchGames();
  }, []);

  const getGame = (id: string) => apiGames.find(g => g.id === id);

  return (
    <div className="min-h-screen bg-miami-sky py-20 px-4">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-miami-pink/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-miami-purple/5 rounded-full blur-[100px]" />
        <div className="bg-miami-grid absolute inset-0 opacity-30" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gradient-miami opacity-30" />
          <h1 className="text-3xl md:text-4xl font-heading font-bold">
            <span className="bg-gradient-miami bg-clip-text text-transparent flex items-center gap-2">
              ❤️ My Library
            </span>
          </h1>
          <div className="flex-1 h-px bg-gradient-miami opacity-30" />
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-10">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'favorites'
                ? 'bg-gradient-miami text-white shadow-[0_0_15px_rgba(255,45,149,0.2)]'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            ❤️ Favorites ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab('recents')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'recents'
                ? 'bg-gradient-miami text-white shadow-[0_0_15px_rgba(255,45,149,0.2)]'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🕐 Recent ({recents.length})
          </button>
        </div>

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <>
            {favorites.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">💔</div>
                <h2 className="text-2xl font-heading font-bold text-white mb-3">No favorites yet</h2>
                <p className="text-gray-400 mb-8">Click the heart icon on any game to add it here</p>
                <Link
                  href="/#games"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-miami text-white font-medium hover:shadow-[0_0_20px_rgba(255,45,149,0.3)] transition-all"
                >
                  🎮 Browse Games
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {favorites.map((game) => {
                  const apiGame = getGame(game.id);
                  return (
                    <div key={game.id} className="relative group">
                      <Link
                        href={apiGame ? `/games/${apiGame.slug}` : '#'}
                        className="block glass-card rounded-xl p-4 hover:scale-[1.03] transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-miami opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                        <div className="relative z-10 text-center">
                          {apiGame?.thumbnailUrl ? (
                            <div className="w-full aspect-[4/3] mb-3 rounded-lg overflow-hidden bg-black/30">
                              <img src={apiGame.thumbnailUrl} alt={game.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="text-4xl mb-3">{game.emoji || '🎮'}</div>
                          )}
                          <h3 className="text-sm font-bold text-white group-hover:text-miami-cyan transition-colors truncate">
                            {game.name}
                          </h3>
                          {game.provider && (
                            <p className="text-xs text-gray-500 mt-1 truncate">{game.provider}</p>
                          )}
                        </div>
                      </Link>
                      <button
                        onClick={() => toggleFavorite(game)}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-all z-10"
                        aria-label="Remove from favorites"
                      >
                        <svg className="w-4 h-4 text-miami-pink" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Recent Tab */}
        {activeTab === 'recents' && (
          <>
            {recents.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">🎮</div>
                <h2 className="text-2xl font-heading font-bold text-white mb-3">No games played yet</h2>
                <p className="text-gray-400 mb-8">Your recently played games will appear here</p>
                <Link
                  href="/#games"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-miami text-white font-medium hover:shadow-[0_0_20px_rgba(255,45,149,0.3)] transition-all"
                >
                  🎮 Start Playing
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recents.map((game, idx) => {
                  const apiGame = getGame(game.id);
                  const timeAgo = getTimeAgo(game.timestamp);
                  return (
                    <Link
                      key={game.id}
                      href={apiGame ? `/games/${apiGame.slug}` : '#'}
                      className="flex items-center gap-4 glass-card rounded-xl p-4 hover:scale-[1.01] transition-all duration-300 group"
                    >
                      <span className="text-gray-500 text-sm w-6 text-right font-mono">#{idx + 1}</span>
                      <div className="text-3xl">{game.emoji || '🎮'}</div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-white group-hover:text-miami-cyan transition-colors">
                          {game.name}
                        </h3>
                        <p className="text-xs text-gray-500">{timeAgo}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-500 group-hover:text-miami-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}