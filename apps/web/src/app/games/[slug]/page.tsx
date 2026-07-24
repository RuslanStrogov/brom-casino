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

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
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
  const hasWorkingDemo = game.demoAvailable && !isOwnGame;

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
            ) : hasWorkingDemo ? (
              /* Working iframe provider game (Pragmatic / Spribe) */
              <ProviderGameView
                gameSlug={game.slug}
                providerId={game.providerId}
                providerName={providerName}
                gameName={game.name}
                rtp={game.rtp}
                onClose={() => router.push('/games')}
              />
            ) : (
              /* Broken / restricted provider — Coming Soon */
              <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="text-7xl">{PROVIDER_META[game.providerId]?.emoji || '🎮'}</div>
                <h2 className="text-2xl font-bold text-white text-center">{game.name}</h2>
                <p className="text-gray-400 text-center max-w-md">
                  {t('game.demoNotAvailable') || 'Демо-режим для этой игры временно недоступен.'}
                  <br />
                  <span className="text-sm text-gray-500">
                    Игры {providerName} требуют агрегатора (SoftSwiss / EveryMatrix) для работы.
                  </span>
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