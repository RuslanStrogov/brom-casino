'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useBalance } from '@/hooks/useBalance';
import { useAuth } from '@/hooks/useAuth';
import { GameCard } from '@/components/GameCard';
import { AuthModal } from '@/components/AuthModal';
import { api } from '@/lib/api';

// ─── In-house game definitions ───────────────────────────────────
const IN_HOUSE_GAMES = [
  { id: 'slots',   name: 'Slots',     emoji: '🎰', description: 'Classic slot machine with big wins', slug: 'slots',   color: '#ff2d95',   provider: 'In-House', rtp: 97.5 },
  { id: 'crash',   name: 'Crash',     emoji: '🚀', description: 'Ride the multiplier before it crashes', slug: 'crash',   color: '#b44aff',   provider: 'In-House', rtp: 96.0 },
  { id: 'dice',    name: 'Dice',      emoji: '🎲', description: 'Predict the roll, win big', slug: 'dice',    color: '#00d4ff',   provider: 'In-House', rtp: 99.0 },
  { id: 'plinko',  name: 'Plinko',    emoji: '🎯', description: 'Drop the ball and watch it bounce', slug: 'plinko',  color: '#ff6b35',   provider: 'In-House', rtp: 97.0 },
  { id: 'roulette',name: 'Roulette',  emoji: '🎡', description: 'European roulette with 37 numbers', slug: 'roulette',color: '#39ff14',   provider: 'In-House', rtp: 97.3 },
  { id: 'blackjack',name: 'Blackjack',emoji: '🃏', description: 'Beat the dealer to 21', slug: 'blackjack',color: '#ffd60a',   provider: 'In-House', rtp: 99.5 },
] as const;

const PROVIDER_META: Record<string, { name: string; emoji: string }> = {
  pragmatic:  { name: 'Pragmatic Play', emoji: '🎰' },
  evolution:  { name: 'Evolution',      emoji: '🎡' },
  spribe:     { name: 'Spribe',          emoji: '✈️' },
  netent:     { name: 'NetEnt',          emoji: '⭐' },
  microgaming:{ name: 'Microgaming',     emoji: '🎮' },
  playngo:    { name: "Play'n GO",       emoji: '🎲' },
  yggdrasil:  { name: 'Yggdrasil',       emoji: '🌳' },
  hacksaw:    { name: 'Hacksaw Gaming',  emoji: '🪚' },
  pushgaming: { name: 'Push Gaming',     emoji: '🔥' },
  redtiger:   { name: 'Red Tiger',       emoji: '🐯' },
  playtech:   { name: 'Playtech',        emoji: '🎯' },
  relaxgaming:{ name: 'Relax Gaming',    emoji: '🧘' },
  truelab:    { name: 'TrueLab',         emoji: '🔬' },
  elkstudios: { name: 'ELK Studios',     emoji: '🦌' },
  thunderkick:{ name: 'Thunderkick',     emoji: '⚡' },
  nolimitcity:{ name: 'Nolimit City',    emoji: '🏙️' },
  slotmill:   { name: 'Slotmill',        emoji: '⚙️' },
  bgaming:    { name: 'BGaming',         emoji: '🎪' },
};

interface ApiGame {
  id: string;
  name: string;
  slug: string;
  category: string;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  providerId: string;
  rtp: number | null;
  volatility: string | null;
  minBet: number;
  maxBet: number;
  isFeatured: boolean;
  isNew: boolean;
  isJackpot: boolean;
  freeSpins: number;
  demoAvailable: boolean;
  tags: string[];
}

const CATEGORIES = [
  { key: 'All',      label: '🎮 All Games' },
  { key: 'Slots',    label: '🎰 Slots' },
  { key: 'Table',    label: '🃏 Table' },
  { key: 'Live',     label: '🎥 Live' },
  { key: 'Jackpot',  label: '💰 Jackpot' },
  { key: 'New',      label: '✨ New' },
  { key: 'Favorites',label: '❤️ Favorites' },
  { key: 'Recent',   label: '🕐 Recent' },
];

export default function GamesLobbyPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const { balance } = useBalance();
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiGames, setApiGames] = useState<ApiGame[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);

  // Derived data from auth stores (for favorites / recent)
  // We assume useFavoritesStore / useRecentStore exist. If not, inline logic.

  // ─── Fetch 3rd-party games from API ──────────────────────────
  useEffect(() => {
    if (!token) return;
    setLoadingApi(true);
    api.getGames(token, {
      category: activeCategory !== 'All' && activeCategory !== 'Favorites' && activeCategory !== 'Recent'
        ? activeCategory.toLowerCase()
        : undefined,
      limit: 100,
    })
      .then((res) => setApiGames(res.games ?? []))
      .catch(() => setApiGames([]))
      .finally(() => setLoadingApi(false));
  }, [token, activeCategory]);

  // ─── Combined game list ──────────────────────────────────────
  const allGames = useMemo(() => {
    const inHouse = IN_HOUSE_GAMES.map((g) => ({
      ...g,
      type: 'in-house' as const,
    }));

    const thirdParty = apiGames.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      emoji: PROVIDER_META[g.providerId]?.emoji ?? '🎮',
      description: `${PROVIDER_META[g.providerId]?.name ?? g.providerId} — ${g.category}`,
      color: '#ff2d95',
      provider: PROVIDER_META[g.providerId]?.name ?? g.providerId,
      rtp: g.rtp ?? undefined,
      type: 'api' as const,
      isNew: g.isNew,
      isJackpot: g.isJackpot,
      category: g.category,
    }));

    return [...inHouse, ...thirdParty];
  }, [apiGames]);

  // ─── Filtering ───────────────────────────────────────────────
  const filteredGames = useMemo(() => {
    let list = allGames;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.provider?.toLowerCase().includes(q),
      );
    }

    // Category filter
    if (activeCategory !== 'All') {
      const cat = activeCategory.toLowerCase();
      if (cat === 'favorites') {
        // Show all in-house + api games (favorites are UI-only via store)
        // Real favorites are handled by useFavoritesStore client-side
        return list;
      }
      if (cat === 'recent') {
        return list; // Show all when "Recent" is selected (sorted by recent play)
      }
      if (cat === 'slots') {
        list = list.filter((g) => g.type === 'in-house' ? g.slug === 'slots' : true);
      }
      if (cat === 'jackpot') {
        list = list.filter((g) => g.type === 'api' && g.isJackpot);
      }
      if (cat === 'new') {
        list = list.filter((g) => g.type === 'api' && g.isNew);
      }
    }

    return list;
  }, [allGames, searchQuery, activeCategory]);

  // ─── Open game ───────────────────────────────────────────────
  const openGame = (slug: string, type: 'in-house' | 'api', providerId?: string) => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    if (type === 'in-house') {
      router.push(`/games/${slug}`);
    } else if (providerId) {
      router.push(`/games/${providerId}/${slug}`);
    } else {
      router.push(`/games/demo/${slug}`);
    }
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      {/* ─── Hero Banner ────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-8 md:pt-20 md:pb-12">
        {/* Neon gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,45,149,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(68,0,255,0.1),transparent_70%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-heading font-bold bg-gradient-to-r from-miami-pink via-miami-cyan to-miami-purple bg-clip-text text-transparent mb-3">
              Game Lobby
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Choose from hundreds of games — in-house provably fair classics and premium provider titles
            </p>
          </div>

          {/* ─── Search bar ──────────────────────────────────── */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                  text-white placeholder-gray-500 focus:outline-none focus:border-miami-pink/50
                  focus:ring-1 focus:ring-miami-pink/30 transition-all duration-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Category Tabs ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.key
                  ? 'bg-gradient-to-r from-miami-pink to-miami-purple text-white shadow-lg shadow-miami-pink/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Games Grid ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loadingApi && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-miami-pink border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loadingApi && filteredGames.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-heading font-bold text-white mb-2">No games found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? `No matching "${searchQuery}" — try a different search term`
                : 'No games in this category yet'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredGames.map((game, idx) => (
            <div
              key={`${game.type}-${game.slug}-${idx}`}
              style={{ animationDelay: `${(idx % 12) * 50}ms` }}
            >
              <GameCard
                name={game.name}
                emoji={game.emoji}
                description={game.description}
                color={game.color}
                provider={game.provider}
                rtp={game.rtp}
                isLive={game.type === 'api'}
                gameId={`${game.type}-${game.slug}`}
                slug={game.slug}
                onClick={() => openGame(game.slug, game.type, game.type === 'api' ? game.provider?.toLowerCase() : undefined)}
              />
            </div>
          ))}
        </div>

        {/* ─── Live Stats Bar ────────────────────────────────── */}
        {!loadingApi && filteredGames.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-miami-green animate-pulse" />
              {allGames.length} games available
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>{IN_HOUSE_GAMES.length} in-house</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>{apiGames.length} providers</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>RTP up to 99.5%</span>
          </div>
        )}
      </section>

      {/* ─── Auth Modal ──────────────────────────────────────── */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
