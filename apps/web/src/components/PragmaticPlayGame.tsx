'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface PragmaticPlayGameProps {
  gameId: string;
  onClose: () => void;
}

export default function PragmaticPlayGame({ gameId, onClose }: PragmaticPlayGameProps) {
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'real' | 'demo'>('demo');

  const loadGame = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Not authenticated. Please log in.');
        setLoading(false);
        return;
      }

      // Map game IDs to external IDs
      const gameMap: Record<string, string> = {
        'pp-gates': 'vs20olympgate',
        'pp-sweet': 'vs20frbonanza',
        'pp-dog': 'vs20doghouse',
        'pp-wolf': 'vs20wolfgold',
        'pp-bass': 'vs10bbbonanza',
        'pp-roulette': 'rla_megaroulette',
      };

      const externalId = gameMap[gameId] || gameId.replace('pp-', '');

      const response = await api.launchGame(token, `pp-${externalId}`);
      if (response?.game?.launchUrl) {
        setLaunchUrl(response.game.launchUrl);
      } else if (response?.url) {
        setLaunchUrl(response.url);
      } else {
        // Fallback to demo mode
        setLaunchUrl(`https://pragmaticplay.net/games/${externalId}/demo`);
      }
    } catch (err) {
      console.error('Failed to load PP game:', err);
      // Fallback to demo URL
      setLaunchUrl(`https://pragmaticplay.net/games/${gameId.replace('pp-', '')}/demo`);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadGame();
  }, [loadGame, mode]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Game Header */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-casino-card border border-casino-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎰</span>
          <div>
            <h3 className="font-bold text-white">
              {gameId.replace('pp-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h3>
            <span className="text-xs text-casino-muted">Pragmatic Play</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode(mode === 'real' ? 'demo' : 'real')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              mode === 'demo'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}
          >
            {mode === 'demo' ? 'DEMO' : 'REAL'}
          </button>
          <button
            onClick={loadGame}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-casino-darker border border-casino-border hover:border-casino-gold/50 transition-all"
          >
            🔄
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Game Container */}
      <div className="w-full max-w-4xl aspect-[16/9] bg-black rounded-xl overflow-hidden border border-casino-border">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-casino-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-casino-muted">Loading game...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadGame}
                className="px-6 py-2 rounded-lg bg-casino-gold text-casino-dark font-bold"
              >
                Retry
              </button>
            </div>
          </div>
        ) : launchUrl ? (
          <iframe
            src={launchUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            title="Pragmatic Play Game"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-casino-muted">Unable to load game</p>
          </div>
        )}
      </div>

      {/* Info Bar */}
      <div className="w-full max-w-4xl bg-casino-card border border-casino-border rounded-xl p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-casino-muted">
              Mode: <span className={mode === 'demo' ? 'text-yellow-400' : 'text-green-400'}>{mode.toUpperCase()}</span>
            </span>
            <span className="text-casino-muted">
              RTP: <span className="text-casino-gold">96.5%</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-casino-muted text-xs">
              Powered by Pragmatic Play
            </span>
            <img
              src="https://pragmaticplay.net/wp-content/uploads/2020/11/logo.png"
              alt="Pragmatic Play"
              className="h-5 opacity-50"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
