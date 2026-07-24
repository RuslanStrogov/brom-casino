'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useBalance } from '@/hooks/useBalance';
import { useAuth } from '@/hooks/useAuth';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useRecentStore } from '@/stores/favoritesStore';
import { NarrowGameCard } from '@/components/NarrowGameCard';
import { AuthModal } from '@/components/AuthModal';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n/I18nProvider';

// ─── In-house game definitions ───────────────────────────────────
const IN_HOUSE_GAMES = [
  { id: 'slots',    nameKey: 'game.slots',      slug: 'slots',    color: '#ff2d95',  provider: 'In-House' },
  { id: 'crash',    nameKey: 'game.crash',      slug: 'crash',    color: '#b44aff',  provider: 'In-House' },
  { id: 'dice',     nameKey: 'game.dice',       slug: 'dice',     color: '#00d4ff',  provider: 'In-House' },
  { id: 'plinko',   nameKey: 'game.plinko',     slug: 'plinko',   color: '#ff6b35',  provider: 'In-House' },
  { id: 'roulette', nameKey: 'game.roulette',   slug: 'roulette', color: '#39ff14',  provider: 'In-House' },
  { id: 'blackjack',nameKey: 'game.blackjack',  slug: 'blackjack',color: '#ffd60a',  provider: 'In-House' },
] as const;

const PROVIDER_META: Record<string, { name: string }> = {
  pragmatic:   { name: 'Pragmatic Play' },
  evolution:   { name: 'Evolution' },
  spribe:      { name: 'Spribe' },
  netent:      { name: 'NetEnt' },
  microgaming: { name: 'Microgaming' },
  playngo:     { name: "Play'n GO" },
  yggdrasil:   { name: 'Yggdrasil' },
  hacksaw:     { name: 'Hacksaw Gaming' },
  pushgaming:  { name: 'Push Gaming' },
  redtiger:    { name: 'Red Tiger' },
  playtech:    { name: 'Playtech' },
  relaxgaming: { name: 'Relax Gaming' },
  truelab:     { name: 'TrueLab' },
  elkstudios:  { name: 'ELK Studios' },
  thunderkick: { name: 'Thunderkick' },
  nolimitcity: { name: 'Nolimit City' },
  slotmill:    { name: 'Slotmill' },
  bgaming:     { name: 'BGaming' },
  betsoft:     { name: 'Betsoft' },
  quickspin:   { name: 'Quickspin' },
  bigtimegaming: { name: 'Big Time Gaming' },
  ironDog:     { name: 'Iron Dog Studio' },
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

// Mock playing counts: 99, 77, 55, then 5 random, rest 0
const MOCK_PLAYING = [99, 77, 55, 42, 31, 28, 18, 12];
const getMockPlayingCount = (i: number): number => MOCK_PLAYING[i] ?? 0;

const CATEGORIES = [
  { key: 'All',      labelKey: 'game.allGames' },
  { key: 'Slots',    labelKey: 'game.slotsCategory' },
  { key: 'Table',    labelKey: 'game.table' },
  { key: 'Live',     labelKey: 'game.liveCategory' },
  { key: 'Jackpot',  labelKey: 'game.jackpotCategory' },
  { key: 'New',      labelKey: 'game.newCategory' },
  { key: 'Favorites',labelKey: 'game.favoritesCategory' },
  { key: 'Recent',   labelKey: 'game.recentCategory' },
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
  const { t } = useI18n();

  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { recent } = useRecentStore();

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
    const inHouse = IN_HOUSE_GAMES.map((g, i) => ({
      ...g,
      type: 'in-house' as const,
      gameId: `in-house-${g.slug}`,
      playingCount: getMockPlayingCount(i + 100),
    }));

    const thirdParty = apiGames.map((g, i) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      color: '#ff2d95',
      provider: PROVIDER_META[g.providerId]?.name ?? g.providerId,
      providerId: g.providerId,
      type: 'api' as const,
      gameId: `api-${g.slug}`,
      isNew: g.isNew,
      isJackpot: g.isJackpot,
      category: g.category,
      playingCount: getMockPlayingCount(i),
    }));

    return [...inHouse, ...thirdParty];
  }, [apiGames]);

  // ─── Filtering ───────────────────────────────────────────────
  const filteredGames = useMemo(() => {
    let list = allGames;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g) => {
        const name = g.type === 'in-house' ? t(g.nameKey as any) : g.name;
        return name.toLowerCase().includes(q) || g.provider?.toLowerCase().includes(q);
      });
    }

    // Category filter
    if (activeCategory !== 'All') {
      const cat = activeCategory.toLowerCase();
      if (cat === 'favorites') {
        const favIds = new Set<string>();
        // We need to filter client-side via favorites store
        return list.filter((g) => isFavorite(g.gameId));
      }
      if (cat === 'recent') {
        const recentSlugs = new Set(recent.map((r) => r.slug));
        return list.filter((g) => recentSlugs.has(g.slug));
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
  }, [allGames, searchQuery, activeCategory, isFavorite, recent]);

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
      <section className="relative overflow-hidden pt-16 pb-8 md:pt-20 md:pb-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,45,149,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(68,0,255,0.1),transparent_70%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-6xl font-heading font-bold bg-gradient-to-r from-miami-pink via-miami-cyan to-miami-purple bg-clip-text text-transparent mb-3">
              {t('game.gameLobby')}
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {t('game.gameLobbySub')}
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
                placeholder={t('game.searchPlaceholder')}
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
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Games Grid - 7 columns ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loadingApi && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-miami-pink border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loadingApi && filteredGames.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-heading font-bold text-white mb-2">{t('game.noResults')}</h3>
            <p className="text-gray-500">
              {searchQuery
                ? t('game.noSearchResults').replace('{query}', searchQuery)
                : t('game.noResults')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 md:gap-3">
          {filteredGames.map((game, idx) => {
            const displayName = game.type === 'in-house' ? t(game.nameKey as any) : game.name;
            const slug = game.slug.toLowerCase().replace(/\s+/g, '-');
            return (
              <div
                key={`${game.type}-${game.slug}-${idx}`}
                style={{ animationDelay: `${(idx % 12) * 50}ms` }}
              >
                <NarrowGameCard
                  name={displayName}
                  slug={game.slug}
                  gameId={game.gameId}
                  provider={game.provider}
                  imageUrl={`/games/${slug}.svg`}
                  color={game.color}
                  onClick={() => openGame(game.slug, game.type, game.type === 'api' ? game.providerId : undefined)}
                />
              </div>
            );
          })}
        </div>

        {/* ─── Stats Bar ─────────────────────────────────────── */}
        {!loadingApi && filteredGames.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-miami-green animate-pulse" />
              {allGames.length} {t('game.gamesAvailable')}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>{IN_HOUSE_GAMES.length} in-house</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>{apiGames.length} {t('game.providers')}</span>
          </div>
        )}
      </section>

      {/* ─── Auth Modal ──────────────────────────────────────── */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}