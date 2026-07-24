'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProviderGameView from '@/components/ProviderGameView';
import SlotGame from '@/components/SlotGame';
import CrashGame from '@/components/CrashGame';
import DiceGame from '@/components/DiceGame';
import PlinkoGame from '@/components/PlinkoGame';
import RouletteGame from '@/components/RouletteGame';
import BlackjackGame from '@/components/BlackjackGame';
import { useBalance } from '@/hooks/useBalance';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';

const PROVIDER_META: Record<string, { name: string; emoji: string }> = {
  own: { name: 'BROM Casino', emoji: '🏠' },
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
  habanero: { name: 'Habanero', emoji: '🌶️' },
};

interface ApiGame {
  id: string;
  name: string;
  slug: string;
  providerId: string;
  rtp: number | null;
  category: string;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  volatility: string | null;
  minBet: number;
  maxBet: number;
  isFeatured: boolean;
  isNew: boolean;
  isJackpot: boolean;
  demoAvailable: boolean;
  tags: string[];
}

/** Map slug → native component for in-house games */
const OWN_GAME_COMPONENTS: Record<string, React.FC<{ balance: number; onBalanceChange: (v: number) => void }>> = {
  crash: CrashGame,
  dice: DiceGame,
  plinko: PlinkoGame,
  roulette: RouletteGame,
  blackjack: BlackjackGame,
  slots: SlotGame,
};

/** Providers whose demos can be embedded in iframe */
const IFRAME_PROVIDERS = ['pragmatic', 'spribe', 'bgaming', 'habanero', 'netent'];

/** Providers whose demos work but block iframe — open in new tab */
const REDIRECT_PROVIDERS = [
  'wazdan', 'evoplay', 'yggdrasil', 'redtiger', 'hacksaw', 'pushgaming',
  'nolimitcity', 'thunderkick', 'playngo', 'microgaming', 'playtech',
  'relaxgaming', 'truelab', 'elkstudios', 'slotmill',
];

/** Provider accent colors for Miami-neon theme */
const PROVIDER_COLORS: Record<string, string> = {
  pragmatic: '#ff2d95',
  evolution: '#39ff14',
  spribe: '#ff6b35',
  netent: '#00d4ff',
  microgaming: '#b44aff',
  playngo: '#ffd60a',
  yggdrasil: '#ff2d95',
  hacksaw: '#ff6b35',
  pushgaming: '#00d4ff',
  redtiger: '#b44aff',
  playtech: '#39ff14',
  relaxgaming: '#a8e6cf',
  truelab: '#ff8b94',
  elkstudios: '#d4a5a5',
  thunderkick: '#ffd93d',
  nolimitcity: '#6c5ce7',
  slotmill: '#a29bfe',
  bgaming: '#fd79a8',
  habanero: '#e17055',
  wazdan: '#00cec9',
  evoplay: '#6c5ce7',
};

// ── Redirect Game View (for providers that block iframe) ──

function RedirectGameView({
  gameSlug,
  providerName,
  gameName,
  neonColor,
}: {
  gameSlug: string;
  providerName: string;
  gameName: string;
  neonColor: string;
}) {
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUrl = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/games/${gameSlug}/demo`);
        if (res.ok) {
          const data = await res.json();
          if (data?.launchUrl) {
            setLaunchUrl(data.launchUrl);
          }
        }
      } catch (e) {
        console.error('Failed to get launch URL:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUrl();
  }, [gameSlug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div
          className="w-12 h-12 border-4 rounded-full animate-spin"
          style={{ borderColor: neonColor, borderTopColor: 'transparent' }}
        />
        <p className="text-gray-400">Loading game...</p>
      </div>
    );
  }

  if (!launchUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <p className="text-gray-400">Unable to load game URL</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center max-w-lg">
        <div className="text-7xl mb-4">🎮</div>
        <h2 className="text-3xl font-bold text-white mb-2">{gameName}</h2>
        <p className="text-gray-400 mb-2">
          Эта игра не поддерживает встраивание в iframe
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Нажмите кнопку ниже, чтобы открыть в новой вкладке
        </p>
      </div>

      <a
        href={launchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${neonColor}, ${neonColor}cc)`,
          color: '#000',
          boxShadow: `0 0 30px ${neonColor}40`,
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        Play {gameName}
      </a>

      <p className="text-xs text-gray-600">
        Powered by {providerName}
      </p>
    </div>
  );
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params?.slug as string | string[];
  const [providerId, gameSlug] = Array.isArray(slugParam) ? slugParam : [undefined, slugParam];
  const slug = gameSlug || slugParam as string;
  const [game, setGame] = useState<ApiGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const { balance: apiBalance } = useBalance();
  const { t } = useI18n();

  useEffect(() => {
    if (apiBalance !== undefined) {
      setBalance(Number(apiBalance));
    }
  }, [apiBalance]);

  useEffect(() => {
    if (!slug) return;

    const fetchGame = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/games?limit=50`);
        const data = await res.json();
        const games: ApiGame[] = data?.games || data || [];
        const found = games.find((g: ApiGame) => g.slug === slug);
        if (found) {
          setGame(found);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Failed to fetch game:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-miami-sky flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-miami-pink border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">{t('game.loadingGame')}</p>
        </div>
      </div>
    );
  }

  if (notFound || !game) {
    return (
      <div className="min-h-screen bg-miami-sky flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎰</div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('game.notFound')}</h1>
          <p className="text-gray-400 mb-6">{t('game.notFoundDesc')?.replace?.('{slug}', slug ?? '')}</p>
          <a
            href="/"
            className="px-6 py-3 rounded-lg font-bold bg-gradient-miami text-white inline-block"
          >
            ← {t('game.backToGames')}
          </a>
        </div>
      </div>
    );
  }

  const providerName = PROVIDER_META[game.providerId]?.name || game.providerId;
  const NativeComponent = OWN_GAME_COMPONENTS[game.slug];
  const isOwnGame = game.providerId === 'own' && !!NativeComponent;
  const canIframe = game.demoAvailable && IFRAME_PROVIDERS.includes(game.providerId);
  const canRedirect = game.demoAvailable && REDIRECT_PROVIDERS.includes(game.providerId);
  const hasAnyDemo = isOwnGame || canIframe || canRedirect;

  return (
    <div className="min-h-screen bg-miami-sky">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-miami-pink/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-miami-purple/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Top bar with back button */}
        <div className="py-4 px-4 border-b border-white/5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.push('/games')}
              className="text-miami-cyan hover:text-miami-cyan/80 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('game.backToGames')}
            </button>

            <div className="flex items-center gap-3">
              <span className="text-white font-bold">{game.name}</span>
              <span className="text-xs text-gray-500 px-2 py-0.5 rounded bg-white/5">
                {providerName}
              </span>
            </div>

            <div className="w-20" /> {/* spacer */}
          </div>
        </div>

        {/* Game content */}
        <div className="py-4 px-4">
          <div className="max-w-6xl mx-auto">
            {isOwnGame && NativeComponent ? (
              /* Native in-house game component */
              <NativeComponent balance={balance} onBalanceChange={setBalance} />
            ) : canIframe ? (
              /* Working iframe provider game (Pragmatic / Spribe / BGaming / Habanero) */
              <ProviderGameView
                gameSlug={game.slug}
                providerId={game.providerId}
                providerName={providerName}
                gameName={game.name}
                rtp={game.rtp}
                onClose={() => router.push('/games')}
              />
            ) : canRedirect ? (
              /* Working demo URL — but blocks iframe, open in new tab (NetEnt / Wazdan / Evoplay) */
              <RedirectGameView
                gameSlug={game.slug}
                providerName={providerName}
                gameName={game.name}
                neonColor={PROVIDER_COLORS[game.providerId] || '#ff2d95'}
              />
            ) : (
              /* Все провайдеры с demoAvailable=true имеют iframe или redirect */
              <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="text-7xl">{PROVIDER_META[game.providerId]?.emoji || '🎮'}</div>
                <h2 className="text-2xl font-bold text-white text-center">{game.name}</h2>
                <p className="text-gray-400 text-center max-w-md">
                  {t('game.demoNotAvailable') || 'Демо-режим для этой игры временно недоступен.'}
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => router.push('/games')}
                    className="px-6 py-3 rounded-lg font-bold bg-gradient-miami text-white"
                  >
                    ← {t('game.backToGames')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}