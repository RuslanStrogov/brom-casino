'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import ErrorModal from './ErrorModal';
import { useI18n } from '@/i18n/I18nProvider';

interface ProviderGameViewProps {
  gameSlug: string;
  providerId: string;
  providerName: string;
  gameName: string;
  onClose: () => void;
  rtp?: number | null;
}

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
};

const PROVIDER_LOGOS: Record<string, string> = {
  pragmatic: 'https://pragmaticplay.net/wp-content/uploads/2020/11/logo.png',
  evolution: 'https://evolution.com/static/evolution-logo.png',
  netent: 'https://netent.com/static/logo.png',
  microgaming: 'https://microgaming.com/static/logo.png',
  spribe: 'https://spribe.co/static/logo.png',
  playngo: 'https://playngo.com/static/logo.png',
  yggdrasil: 'https://yggdrasil.com/static/logo.png',
  hacksaw: 'https://hacksawgaming.com/static/logo.png',
  pushgaming: 'https://pushgaming.com/static/logo.png',
  redtiger: 'https://redtiger.com/static/logo.png',
  playtech: 'https://playtech.com/static/logo.png',
  relaxgaming: 'https://relaxgaming.com/static/logo.png',
  truelab: 'https://truelab.com/static/logo.png',
  elkstudios: 'https://elkstudios.com/static/logo.png',
  thunderkick: 'https://thunderkick.com/static/logo.png',
  nolimitcity: 'https://nolimitcity.com/static/logo.png',
  slotmill: 'https://slotmill.com/static/logo.png',
  bgaming: 'https://bgaming.com/static/logo.png',
};

export default function ProviderGameView({
  gameSlug,
  providerId,
  providerName,
  gameName,
  onClose,
  rtp,
}: ProviderGameViewProps) {
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'real' | 'demo'>('demo');

  const neonColor = PROVIDER_COLORS[providerId] || '#ff2d95';
  const { t } = useI18n();

  const loadGame = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // Demo mode without auth — use public GET endpoint
        try {
          const res = await fetch(`/api/games/${gameSlug}/demo`);
          if (res.ok) {
            const data = await res.json();
            if (data?.launchUrl) {
              setLaunchUrl(data.launchUrl);
            } else {
              setError(t('game.loadingFailed'));
            }
          } else {
            setError(t('game.loadingFailed'));
          }
        } catch {
          setError(t('game.loadingFailed'));
        }
        setLoading(false);
        return;
      }

      const response = await api.launchGame(token, gameSlug);
      if (response?.launchUrl) {
        setLaunchUrl(response.launchUrl);
      } else if (response?.url) {
        setLaunchUrl(response.url);
      } else {
        // Fallback to demo iframe
        setLaunchUrl(`/api/games/play/${gameSlug}?mode=${mode}&token=${token}`);
      }
    } catch (err) {
      console.error('Failed to load game:', err);
      setError(t('game.loadingError'));
    } finally {
      setLoading(false);
    }
  }, [gameSlug, mode]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Game Header */}
      <div
        className="w-full max-w-4xl flex items-center justify-between rounded-xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          border: `1px solid rgba(255,255,255,0.1)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{
              background: `linear-gradient(135deg, ${neonColor}40, ${neonColor}20)`,
              border: `1px solid ${neonColor}40`,
            }}
          >
            🎮
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{gameName}</h3>
            <span className="text-xs" style={{ color: neonColor }}>
              {providerName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode(mode === 'real' ? 'demo' : 'real')}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: mode === 'demo'
                ? 'rgba(255, 200, 0, 0.15)'
                : 'rgba(0, 255, 100, 0.15)',
              color: mode === 'demo' ? '#ffcc00' : '#00ff64',
              border: `1px solid ${mode === 'demo' ? 'rgba(255,200,0,0.3)' : 'rgba(0,255,100,0.3)'}`,
            }}
          >
            {t(mode === 'demo' ? 'game.demo' : 'game.real')}
          </button>
          <button
            onClick={loadGame}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            🔄
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: 'rgba(255,0,50,0.15)',
              color: '#ff3355',
              border: '1px solid rgba(255,0,50,0.3)',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Game Container */}
      <div className="w-full max-w-4xl aspect-[16/9] bg-black rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-12 h-12 border-4 rounded-full animate-spin"
                style={{ borderColor: neonColor, borderTopColor: 'transparent' }}
              />
              <p className="text-gray-400">{t('common.loading')}</p>
            </div>
          </div>
        ) : error ? (
          <>
            <ErrorModal
              open={true}
              title="Ошибка загрузки"
              message={error}
              onClose={() => setError(null)}
              onRetry={loadGame}
            />
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 mb-2">Ошибка загрузки игры</p>
                <button
                  onClick={loadGame}
                  className="px-6 py-2 rounded-lg font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${neonColor}, ${neonColor}cc)`,
                    color: '#000',
                  }}
                >
                  Повторить
                </button>
              </div>
            </div>
          </>
        ) : launchUrl ? (
          <iframe
            src={launchUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            title={gameName}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Unable to load game</p>
          </div>
        )}
      </div>

      {/* Info Bar */}
      <div
        className="w-full max-w-4xl rounded-xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              Mode: <span className={mode === 'demo' ? 'text-yellow-400' : 'text-green-400'}>{mode.toUpperCase()}</span>
            </span>
            {rtp && (
              <span className="text-gray-400">
                RTP: <span style={{ color: neonColor }}>{rtp}%</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">
              Powered by {providerName}
            </span>
            {PROVIDER_LOGOS[providerId] && (
              <img
                src={PROVIDER_LOGOS[providerId]}
                alt={providerName}
                className="h-5 opacity-50"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}