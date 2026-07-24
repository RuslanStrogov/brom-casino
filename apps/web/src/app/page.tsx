'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useBalance } from '@/hooks/useBalance';
import { useAuth } from '@/hooks/useAuth';
import SlotGame from '@/components/SlotGame';
import CrashGame from '@/components/CrashGame';
import DiceGame from '@/components/DiceGame';
import PlinkoGame from '@/components/PlinkoGame';
import RouletteGame from '@/components/RouletteGame';
import BlackjackGame from '@/components/BlackjackGame';
import ProviderGameView from '@/components/ProviderGameView';
import { GameCard } from '@/components/GameCard';
import { AuthModal } from '@/components/AuthModal';
import { ProvablyFair } from '@/components/ProvablyFair';
import { api } from '@/lib/api';
import { useFavoritesStore, useRecentStore, FavoriteGame } from '@/stores/favoritesStore';
import { useI18n } from '@/i18n/I18nProvider';

const IN_HOUSE_GAMES = [
  { id: 'slots', nameKey: 'game.slots', emoji: '🎰', descriptionKey: 'game.slotsDesc', component: 'slots', color: '#ff2d95' },
  { id: 'crash', nameKey: 'game.crash', emoji: '🚀', descriptionKey: 'game.crashDesc', component: 'crash', color: '#b44aff' },
  { id: 'dice', nameKey: 'game.dice', emoji: '🎲', descriptionKey: 'game.diceDesc', component: 'dice', color: '#00d4ff' },
  { id: 'plinko', nameKey: 'game.plinko', emoji: '🎯', descriptionKey: 'game.plinkoDesc', component: 'plinko', color: '#ff6b35' },
  { id: 'roulette', nameKey: 'game.roulette', emoji: '🎡', descriptionKey: 'game.rouletteDesc', component: 'roulette', color: '#39ff14' },
  { id: 'blackjack', nameKey: 'game.blackjack', emoji: '🃏', descriptionKey: 'game.blackjackDesc', component: 'blackjack', color: '#ffd60a' },
];

const PROVIDER_META: Record<string, { name: string; emoji: string }> = {
  pragmatic: { name: 'Pragmatic Play', emoji: '🎰' },
  evolution: { name: 'Evolution', emoji: '🎡' },
  spribe: { name: 'Spribe', emoji: '✈️' },
  netent: { name: 'NetEnt', emoji: '⭐' },
  microgaming: { name: 'Microgaming', emoji: '🎮' },
  playngo: { name: 'Play\'n GO', emoji: '🎲' },
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
  habanero: { name: 'Habanero', emoji: '🌶️' },
  wazdan: { name: 'Wazdan', emoji: '✨' },
  evoplay: { name: 'Evoplay', emoji: '🎮' },
  betsoft: { name: 'Betsoft', emoji: '🎲' },
  quickspin: { name: 'Quickspin', emoji: '💨' },
  bigtimegaming: { name: 'Big Time Gaming', emoji: '🎯' },
  irondog: { name: 'Iron Dog Studio', emoji: '🐕' },
};

const CATEGORIES = [
  { labelKey: 'game.allGames' },
  { labelKey: 'game.slotsCategory' },
  { labelKey: 'game.table' },
  { labelKey: 'game.liveCategory' },
  { labelKey: 'game.jackpotCategory' },
  { labelKey: 'game.newCategory' },
] as const;

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

export default function HomePage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuthStore();
  const { balance, setBalance } = useBalance();
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProvablyFair, setShowProvablyFair] = useState(false);
  const [providerGame, setProviderGame] = useState<{ slug: string; providerId: string; providerName: string; name: string; rtp?: number | null } | null>(null);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].labelKey);
  const [activeProviderCategory, setActiveProviderCategory] = useState('All');
  const [activeProviderTab, setActiveProviderTab] = useState<string>('pragmatic');
  const [apiGames, setApiGames] = useState<ApiGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [providers, setProviders] = useState<{ id: string; gameCount: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const { favorites, toggleFavorite, isFavorite } = useFavoritesStore();
  const { recents } = useRecentStore();

  // Fetch games from API
  useEffect(() => {
    const fetchGames = async () => {
      setLoadingGames(true);
      try {
        const token = localStorage.getItem('accessToken');
        const data = token
          ? await api.getGames(token, { limit: 50 })
          : await fetch('/api/games?limit=50').then(r => r.json());
        
        setApiGames(data?.games || data || []);
      } catch (err) {
        console.error('Failed to fetch games:', err);
      } finally {
        setLoadingGames(false);
      }
    };
    fetchGames();
  }, []);

  // Fetch providers list
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await fetch('/api/games/providers').then(r => r.json());
        if (Array.isArray(data)) {
          setProviders(data);
          if (data.length > 0 && !data.find(p => p.id === activeProviderTab)) {
            setActiveProviderTab(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch providers:', err);
      }
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
          y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const renderGame = () => {
    switch (activeGame) {
      case 'slots': return <SlotGame balance={balance} onBalanceChange={setBalance} />;
      case 'crash': return <CrashGame balance={balance} onBalanceChange={setBalance} />;
      case 'dice': return <DiceGame balance={balance} onBalanceChange={setBalance} />;
      case 'plinko': return <PlinkoGame balance={balance} onBalanceChange={setBalance} />;
      case 'roulette': return <RouletteGame balance={balance} onBalanceChange={setBalance} />;
      case 'blackjack': return <BlackjackGame balance={balance} onBalanceChange={setBalance} />;
      default: return null;
    }
  };

  const providerGames = apiGames.filter(g => g.providerId !== 'in-house');
  const filteredProviderGames = providerGames.filter(g => {
    const matchesProvider = g.providerId === activeProviderTab;
    const matchesCategory = activeProviderCategory === 'All' || g.category === activeProviderCategory;
    const matchesSearch = !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvider && matchesCategory && matchesSearch;
  });
  const inHouseGamesFromApi = apiGames.filter(g => g.providerId === 'in-house');

  const providerCategories = ['All', ...new Set(providerGames.map(g => g.category))];

  return (
    <div className="min-h-screen bg-miami-sky">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-miami-pink/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-miami-purple/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-miami-cyan/5 rounded-full blur-[80px]" />
        <div className="bg-miami-grid absolute inset-0 opacity-30" />
      </div>

      {/* ===== HERO SECTION ===== */}
      {!activeGame && !providerGame && (
        <section ref={heroRef} className="relative z-10 min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Sunset Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-miami-purple/[0.03] to-transparent" />
          
          {/* Animated Neon Orbs */}
          <div 
            className="absolute w-[300px] h-[300px] rounded-full bg-gradient-miami opacity-10 blur-[80px] animate-float"
            style={{ top: '15%', left: '10%' }}
          />
          <div 
            className="absolute w-[200px] h-[200px] rounded-full bg-gradient-sunset opacity-10 blur-[60px] animate-sunset-float"
            style={{ bottom: '20%', right: '15%', animationDelay: '2s' }}
          />

          {/* Animated Wavy Background Lines */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {/* Wave Line 1 — Pink */}
            <svg className="absolute w-[200%] h-[200px]" style={{ top: '18%', left: 0, animation: 'wave-slide 12s linear infinite' }} viewBox="0 0 1800 100" preserveAspectRatio="none">
              <path className="animate-line-morph-1" fill="none" stroke="url(#waveGrad1)" strokeWidth="1.5" strokeOpacity="0.6" />
            </svg>
            {/* Wave Line 2 — Purple */}
            <svg className="absolute w-[200%] h-[150px]" style={{ top: '35%', left: '-25%', animation: 'wave-slide 15s linear infinite reverse' }} viewBox="0 0 1440 100" preserveAspectRatio="none">
              <path className="animate-line-morph-2" fill="none" stroke="url(#waveGrad2)" strokeWidth="1.2" strokeOpacity="0.5" />
            </svg>
            {/* Wave Line 3 — Cyan */}
            <svg className="absolute w-[200%] h-[180px]" style={{ top: '55%', left: '-50%', animation: 'wave-slide 18s linear infinite' }} viewBox="0 0 1200 100" preserveAspectRatio="none">
              <path className="animate-line-morph-3" fill="none" stroke="url(#waveGrad3)" strokeWidth="1" strokeOpacity="0.4" />
            </svg>
            {/* Wave Line 4 — Pink glow */}
            <svg className="absolute w-[200%] h-[120px]" style={{ top: '72%', left: '-10%', animation: 'wave-slide 20s linear infinite reverse' }} viewBox="0 0 1800 100" preserveAspectRatio="none">
              <path className="animate-line-morph-1" fill="none" stroke="url(#waveGrad4)" strokeWidth="2" strokeOpacity="0.35" />
            </svg>
            {/* Wave Line 5 — Cyan subtle */}
            <svg className="absolute w-[200%] h-[160px]" style={{ top: '8%', left: '-40%', animation: 'wave-slide 14s linear infinite' }} viewBox="0 0 1440 100" preserveAspectRatio="none">
              <path className="animate-line-morph-2" fill="none" stroke="url(#waveGrad5)" strokeWidth="0.8" strokeOpacity="0.3" />
            </svg>
            {/* Floating light dots along waves */}
            <div className="absolute w-1.5 h-1.5 rounded-full bg-miami-pink/40 blur-[1px]" style={{ top: '22%', left: '10%', animation: 'dot-float 4s ease-in-out infinite' }} />
            <div className="absolute w-2 h-2 rounded-full bg-miami-cyan/30 blur-[1px]" style={{ top: '50%', left: '30%', animation: 'dot-float-2 5s ease-in-out infinite 1s' }} />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-miami-purple/40 blur-[1px]" style={{ top: '70%', left: '60%', animation: 'dot-float 6s ease-in-out infinite 0.5s' }} />
            <div className="absolute w-2.5 h-2.5 rounded-full bg-miami-pink/30 blur-[1px]" style={{ top: '38%', left: '80%', animation: 'dot-float-2 3.5s ease-in-out infinite 2s' }} />
            <div className="absolute w-1 h-1 rounded-full bg-miami-cyan/50 blur-[1px]" style={{ top: '15%', left: '50%', animation: 'dot-float 4.5s ease-in-out infinite 1.5s' }} />
            {/* SVG Gradients */}
            <svg className="absolute w-0 h-0">
              <defs>
                <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff2d95" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#ff2d95" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ff2d95" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#b44aff" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#b44aff" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#b44aff" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="waveGrad4" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff2d95" stopOpacity="0.05" />
                  <stop offset="50%" stopColor="#ff2d95" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ff2d95" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="waveGrad5" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.05" />
                  <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-miami-cyan animate-neon-pulse" />
              <span className="text-xs text-miami-cyan font-medium tracking-wider uppercase">
                {t('hero.badge').replace('{providers}', providers.length.toString())}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-heading font-bold mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <span className="bg-gradient-miami bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient-shift">
                BROM
              </span>
              <span className="text-white/90 ml-3">CASINO</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}
              dangerouslySetInnerHTML={{
                __html: t('hero.subtitle').replace('{games}', apiGames.length.toString())
              }}
            />

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <button
                onClick={() => {
                  if (isAuthenticated) setActiveGame('slots');
                  else setShowAuth(true);
                }}
                className="btn-miami-primary group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t('hero.playNow')}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
              <button
                onClick={() => setShowProvablyFair(true)}
                className="btn-miami-secondary group"
              >
                <span className="flex items-center gap-2">
                  {t('hero.fairness')}
                </span>
              </button>
            </div>

            {/* Stats Bar */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '0.4s' }}>
              {[
                { value: `${apiGames.length}+`, label: t('hero.statGames'), color: 'text-miami-pink' },
                { value: `${providers.length}`, label: t('hero.statProviders'), color: 'text-miami-cyan' },
                { value: '0s', label: t('hero.statPayout'), color: 'text-miami-purple' },
                { value: '24/7', label: t('hero.statAvailable'), color: 'text-miami-orange' },
              ].map((stat) => (
                <div key={stat.label} className="text-center group">
                  <div className={`text-3xl md:text-4xl font-heading font-bold ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Scroll Indicator */}
            <div className="mt-16 flex flex-col items-center gap-2 animate-bounce">
              <span className="text-xs text-gray-600 uppercase tracking-widest">{t('hero.scroll')}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>
      )}

      {/* ===== ACTIVE GAME VIEW ===== */}
      {activeGame && (
        <section className="relative z-10 py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setActiveGame(null)}
              className="mb-6 text-miami-cyan hover:text-miami-cyan/80 transition-colors flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('game.backToGames')}
            </button>
            {renderGame()}
          </div>
        </section>
      )}

      {/* ===== PROVIDER GAME VIEW ===== */}
      {providerGame && (
        <section className="relative z-10 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setProviderGame(null)}
              className="mb-6 text-miami-cyan hover:text-miami-cyan/80 transition-colors flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('game.backToGames')}
            </button>
            <ProviderGameView
              gameSlug={providerGame.slug}
              providerId={providerGame.providerId}
              providerName={providerGame.providerName}
              gameName={providerGame.name}
              rtp={providerGame.rtp}
              onClose={() => setProviderGame(null)}
            />
          </div>
        </section>
      )}

      {/* ===== FAVORITES & RECENT SECTION ===== */}
      {!activeGame && !providerGame && (favorites.length > 0 || recents.length > 0) && (
        <section className="relative z-10 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Recent Games */}
            {recents.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-gradient-miami opacity-20" />
                  <h2 className="text-2xl md:text-3xl font-heading font-bold">
                    <span className="bg-gradient-miami bg-clip-text text-transparent flex items-center gap-2">
                      {t('favorites.recent')}
                    </span>
                  </h2>
                  <div className="flex-1 h-px bg-gradient-miami opacity-20" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
                  {recents.slice(0, 6).map((game) => {
                    const apiGame = apiGames.find(g => g.id === game.id);
                    return (
                      <a
                        key={game.id}
                        href={apiGame ? `/games/${apiGame.slug}` : '#'}
                        className="group glass-card rounded-xl p-3 hover:scale-[1.03] transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-miami opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                        <div className="relative z-10 text-center">
                          <div className="text-3xl mb-2">{game.emoji || '🎮'}</div>
                          <h3 className="text-xs font-bold text-white group-hover:text-miami-cyan transition-colors truncate">
                            {game.name}
                          </h3>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </>
            )}

            {/* Favorites */}
            {favorites.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-gradient-miami opacity-20" />
                  <h2 className="text-2xl md:text-3xl font-heading font-bold">
                    <span className="bg-gradient-miami bg-clip-text text-transparent flex items-center gap-2">
                      {t('favorites.section')}
                    </span>
                  </h2>
                  <div className="flex-1 h-px bg-gradient-miami opacity-20" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-10">
                  {favorites.slice(0, 10).map((game) => {
                    const apiGame = apiGames.find(g => g.id === game.id);
                    const inHouse = IN_HOUSE_GAMES.find(g => g.id === game.id);
                    return (
                      <div key={game.id} className="relative group">
                        {apiGame ? (
                          <a
                            href={`/games/${apiGame.slug}`}
                            className="block glass-card rounded-xl p-4 hover:scale-[1.03] transition-all duration-300 relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-miami opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                            <div className="relative z-10 text-center">
                              {apiGame.thumbnailUrl ? (
                                <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden bg-black/30">
                                  <img src={apiGame.thumbnailUrl} alt={game.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="text-3xl mb-2">{game.emoji || '🎮'}</div>
                              )}
                              <h3 className="text-xs font-bold text-white group-hover:text-miami-cyan transition-colors truncate">{game.name}</h3>
                            </div>
                          </a>
                        ) : inHouse ? (
                          <button
                            onClick={() => { if (isAuthenticated) setActiveGame(inHouse.component); else setShowAuth(true); }}
                            className="w-full glass-card rounded-xl p-4 hover:scale-[1.03] transition-all duration-300 relative overflow-hidden text-center"
                          >
                            <div className="text-3xl mb-2">{inHouse.emoji}</div>
                            <h3 className="text-xs font-bold text-white group-hover:text-miami-cyan transition-colors">{t(inHouse.nameKey)}</h3>
                          </button>
                        ) : (
                          <div className="glass-card rounded-xl p-4 text-center">
                            <div className="text-3xl mb-2">{game.emoji || '🎮'}</div>
                            <h3 className="text-xs font-bold text-white truncate">{game.name}</h3>
                          </div>
                        )}
                        {/* Remove from favorites */}
                        <button
                          onClick={() => toggleFavorite(game)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-all z-10"
                          aria-label={t('game.favoriteRemove')}
                        >
                          <svg className="w-4 h-4 text-miami-pink" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ===== PROVIDER GAMES SECTION ===== */}
      {!activeGame && !providerGame && (
        <section className="relative z-10 py-16 px-4" id="games">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <div className="flex-1 h-px bg-gradient-miami opacity-30" />
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                <span className="bg-gradient-miami bg-clip-text text-transparent">{t('game.providerGames')}</span>
              </h2>
              <div className="flex-1 h-px bg-gradient-miami opacity-30" />
            </div>

            {/* Provider Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {providers.map((p) => {
                const meta = PROVIDER_META[p.id];
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveProviderTab(p.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      activeProviderTab === p.id
                        ? 'bg-gradient-miami text-white shadow-[0_0_15px_rgba(255,45,149,0.2)]'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{meta?.emoji || '🎮'}</span>
                    <span>{meta?.name || p.id}</span>
                    <span className="text-xs opacity-60">({p.gameCount})</span>
                  </button>
                );
              })}
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {providerCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveProviderCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeProviderCategory === cat
                      ? 'bg-miami-pink/30 text-miami-pink border border-miami-pink/50'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('game.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-miami-cyan/50 focus:ring-1 focus:ring-miami-cyan/30 transition-all"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Provider Games Grid */}
            {loadingGames ? (
              <div className="flex justify-center py-20">
                <div className="w-12 h-12 border-4 border-miami-pink border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredProviderGames.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProviderGames.map((game, idx) => {
                  const liked = isFavorite(game.id);
                  return (
                    <div key={game.id} className="relative group">
                      <a
                        href={`/games/${game.slug}`}
                        onClick={() => {
                          // Track recent game
                          useRecentStore.getState().addRecent({
                            id: game.id,
                            name: game.name,
                            slug: game.slug,
                            timestamp: Date.now(),
                          });
                        }}
                        className="cursor-pointer glass-card rounded-xl p-5 hover:scale-[1.03] transition-all duration-300 animate-fade-up relative overflow-hidden block"
                        style={{ animationDelay: `${idx * 0.03}s` }}
                      >
                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-miami opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                        
                        {/* Thumbnail */}
                        <div className="relative z-10">
                          {game.thumbnailUrl ? (
                            <div className="w-full aspect-[4/3] mb-3 rounded-lg overflow-hidden bg-black/30">
                              <img
                                src={game.thumbnailUrl}
                                alt={game.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </div>
                          ) : (
                            <div className="w-full aspect-[4/3] mb-3 rounded-lg overflow-hidden bg-black/30">
                              <img
                                src={`/games/${game.slug}.svg`}
                                alt={game.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('span');
                                    fallback.className = 'text-5xl opacity-30';
                                    fallback.textContent = PROVIDER_META[game.providerId]?.emoji || '🎮';
                                    parent.appendChild(fallback);
                                  }
                                }}
                              />
                            </div>
                          )}
                          <h3 className="text-sm font-bold text-center text-white group-hover:text-miami-cyan transition-colors">
                            {game.name}
                          </h3>
                          <p className="text-xs text-gray-500 text-center mt-1">
                            {PROVIDER_META[game.providerId]?.name || game.providerId}
                          </p>
                          <div className="flex flex-wrap justify-center gap-1 mt-2">
                            {game.rtp && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-miami-cyan/20 text-miami-cyan border border-miami-cyan/30">
                                {t('game.rtp').replace('{percent}', game.rtp!.toString())}
                              </span>
                            )}
                            {game.isNew && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-miami-purple/20 text-miami-purple border border-miami-purple/30">
                                {t('game.new')}
                              </span>
                            )}
                            {game.isJackpot && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-miami-pink/20 text-miami-pink border border-miami-pink/30 animate-neon-pulse-fast">
                                {t('game.jackpot')}
                              </span>
                            )}
                            {game.category === 'live' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-miami-orange/20 text-miami-orange border border-miami-orange/30">
                                {t('game.live')}
                              </span>
                            )}
                          </div>
                        </div>
                      </a>
                      {/* Heart button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite({
                            id: game.id,
                            name: game.name,
                            slug: game.slug,
                            provider: PROVIDER_META[game.providerId]?.name || game.providerId,
                          });
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full z-10 transition-all hover:scale-110"
                        aria-label={liked ? t('game.favoriteRemove') : t('game.favoriteAdd')}
                      >
                        <svg
                          className={`w-4 h-4 transition-all ${
                            liked ? 'text-miami-pink drop-shadow-[0_0_6px_rgba(255,45,149,0.6)]' : 'text-gray-500 group-hover:text-gray-300'
                          }`}
                          viewBox="0 0 24 24"
                          fill={liked ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                          />
                        </svg>
                      </button>
                    </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-10">
                {searchQuery
                  ? t('game.noSearchResults').replace('{query}', searchQuery)
                  : t('game.noResults')}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ===== IN-HOUSE GAMES SECTION ===== */}
      {!activeGame && !providerGame && (
        <section className="relative z-10 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex-1 h-px bg-gradient-miami opacity-20" />
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">
                <span className="bg-gradient-miami bg-clip-text text-transparent">{t('game.originalGames')}</span>
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                {t('game.originalSubtitle')}
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.labelKey}
                  onClick={() => setActiveCategory(cat.labelKey)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === cat.labelKey
                      ? 'bg-gradient-miami text-white shadow-[0_0_15px_rgba(255,45,149,0.2)]'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t(cat.labelKey)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {IN_HOUSE_GAMES.map((game, idx) => (
                <div
                  key={game.id}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <GameCard
                    name={t(game.nameKey)}
                    emoji={game.emoji}
                    description={t(game.descriptionKey)}
                    color={game.color}
                    gameId={game.id}
                    slug={game.id}
                    onClick={() => {
                      if (isAuthenticated) setActiveGame(game.component);
                      else setShowAuth(true);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== PROVIDER LOGOS BAR ===== */}
      {!activeGame && !providerGame && (
        <section className="relative z-10 py-12 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-6">{t('game.gameProviders')}</p>
            <div className="flex flex-wrap justify-center gap-6 items-center opacity-40">
              {providers.map((p) => {
                const meta = PROVIDER_META[p.id];
                return (
                  <div key={p.id} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-lg">{meta?.emoji || '🎮'}</span>
                    <span className="text-sm text-gray-400">{meta?.name || p.id}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== WHY CHOOSE US ===== */}
      {!activeGame && !providerGame && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">
                <span className="bg-gradient-miami bg-clip-text text-transparent">{t('footer.whyBrom')}</span>
              </h2>
              <p className="text-gray-500">{t('footer.whySubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  icon: '🔒',
                  title: 'Provably Fair',
                  desc: 'Every game outcome is verifiable on-chain. No tricks, no secrets.',
                  gradient: 'from-miami-pink/20 to-miami-purple/20',
                  border: 'border-miami-pink/20',
                },
                {
                  icon: '⚡',
                  title: 'Instant Payouts',
                  desc: 'Withdraw your winnings instantly. No delays, no minimums.',
                  gradient: 'from-miami-cyan/20 to-miami-purple/20',
                  border: 'border-miami-cyan/20',
                },
                {
                  icon: '🎮',
                  title: `${providers.length} Game Providers`,
                  desc: `Top studios including Pragmatic Play, Evolution, NetEnt and ${providers.length - 3} more.`,
                  gradient: 'from-miami-purple/20 to-miami-pink/20',
                  border: 'border-miami-purple/20',
                },
              ].map((feature, idx) => (
                <div
                  key={feature.title}
                  className={`glass-card rounded-2xl p-8 animate-fade-up hover:scale-[1.02] transition-all duration-300 ${idx === 1 ? 'md:mt-[-8px]' : ''}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl mb-5 border ${feature.border}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-heading font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== MODALS ===== */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showProvablyFair && <ProvablyFair onClose={() => setShowProvablyFair(false)} />}
    </div>
  );
}