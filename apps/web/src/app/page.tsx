'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useBalance } from '@/hooks/useBalance';
import { useAuth } from '@/hooks/useAuth';
import SlotGame from '@/components/SlotGame';
import CrashGame from '@/components/CrashGame';
import DiceGame from '@/components/DiceGame';
import PlinkoGame from '@/components/PlinkoGame';
import RouletteGame from '@/components/RouletteGame';
import BlackjackGame from '@/components/BlackjackGame';
import PragmaticPlayGame from '@/components/PragmaticPlayGame';
import { GameCard } from '@/components/GameCard';
import { AuthModal } from '@/components/AuthModal';
import { ProvablyFair } from '@/components/ProvablyFair';

const GAMES = [
  { id: 'slots', name: 'Slots', emoji: '🎰', description: 'Classic slot machine with big wins', component: 'slots' },
  { id: 'crash', name: 'Crash', emoji: '🚀', description: 'Ride the multiplier before it crashes', component: 'crash' },
  { id: 'dice', name: 'Dice', emoji: '🎲', description: 'Predict the roll, win big', component: 'dice' },
  { id: 'plinko', name: 'Plinko', emoji: '🎯', description: 'Drop the ball and watch it bounce', component: 'plinko' },
  { id: 'roulette', name: 'Roulette', emoji: '🎡', description: 'European roulette with 37 numbers', component: 'roulette' },
  { id: 'blackjack', name: 'Blackjack', emoji: '🃏', description: 'Beat the dealer to 21', component: 'blackjack' },
];

const PP_GAMES = [
  { id: 'pp-gates', name: 'Gates of Olympus', emoji: '⚡', provider: 'Pragmatic Play', rtp: 96.5 },
  { id: 'pp-sweet', name: 'Sweet Bonanza', emoji: '🍬', provider: 'Pragmatic Play', rtp: 96.48 },
  { id: 'pp-dog', name: 'The Dog House', emoji: '🐕', provider: 'Pragmatic Play', rtp: 96.51 },
  { id: 'pp-wolf', name: 'Wolf Gold', emoji: '🐺', provider: 'Pragmatic Play', rtp: 96.01 },
  { id: 'pp-bass', name: 'Big Bass Bonanza', emoji: '🎣', provider: 'Pragmatic Play', rtp: 96.71 },
  { id: 'pp-roulette', name: 'Mega Roulette Live', emoji: '🎡', provider: 'Pragmatic Play', rtp: 97.0 },
];

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const { balance, setBalance } = useBalance();
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProvablyFair, setShowProvablyFair] = useState(false);
  const [ppGame, setPpGame] = useState<string | null>(null);

  const renderGame = () => {
    switch (activeGame) {
      case 'slots':
        return <SlotGame balance={balance} onBalanceChange={setBalance} />;
      case 'crash':
        return <CrashGame balance={balance} onBalanceChange={setBalance} />;
      case 'dice':
        return <DiceGame balance={balance} onBalanceChange={setBalance} />;
      case 'plinko':
        return <PlinkoGame balance={balance} onBalanceChange={setBalance} />;
      case 'roulette':
        return <RouletteGame balance={balance} onBalanceChange={setBalance} />;
      case 'blackjack':
        return <BlackjackGame balance={balance} onBalanceChange={setBalance} />;
      default:
        return null;
    }
  };

  const renderPpGame = () => {
    if (!ppGame) return null;
    return <PragmaticPlayGame gameId={ppGame} onClose={() => setPpGame(null)} />;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {!activeGame && !ppGame && (
        <section className="relative py-20 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-casino-gold/5 to-transparent" />
          <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
              <span className="bg-gradient-gold bg-clip-text text-transparent">Brom Casino</span>
            </h1>
            <p className="text-xl text-casino-muted mb-8 max-w-2xl mx-auto">
              Crypto casino with provably fair games. Instant payouts, best odds, 24/7 available.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    setActiveGame('slots');
                  } else {
                    setShowAuth(true);
                  }
                }}
                className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-gold text-casino-dark hover:opacity-90 transition-all shadow-lg hover:shadow-casino-gold/20"
              >
                🎰 Play Now
              </button>
              <button
                onClick={() => setShowProvablyFair(true)}
                className="px-8 py-4 rounded-xl font-bold text-lg border border-casino-gold/50 text-casino-gold hover:bg-casino-gold/10 transition-all"
              >
                🔒 Provably Fair
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Active Game View */}
      {activeGame && (
        <section className="py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setActiveGame(null)}
              className="mb-6 text-casino-gold hover:text-casino-gold-light transition-colors flex items-center gap-2"
            >
              ← Back to Games
            </button>
            {renderGame()}
          </div>
        </section>
      )}

      {/* Pragmatic Play Game View */}
      {ppGame && (
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setPpGame(null)}
              className="mb-6 text-casino-gold hover:text-casino-gold-light transition-colors flex items-center gap-2"
            >
              ← Back to Games
            </button>
            {renderPpGame()}
          </div>
        </section>
      )}

      {/* Pragmatic Play Section */}
      {!activeGame && !ppGame && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-3xl font-display font-bold">
                <span className="bg-gradient-gold bg-clip-text text-transparent">Live Casino</span>
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Pragmatic Play
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {PP_GAMES.map((game) => (
                <div
                  key={game.id}
                  onClick={() => {
                    if (isAuthenticated) {
                      setPpGame(game.id);
                    } else {
                      setShowAuth(true);
                    }
                  }}
                  className="group cursor-pointer bg-casino-card border border-casino-border rounded-xl p-4 hover:border-casino-gold/50 transition-all hover:scale-105"
                >
                  <div className="text-4xl mb-2 text-center">{game.emoji}</div>
                  <h3 className="text-sm font-bold text-center text-white group-hover:text-casino-gold transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-xs text-casino-muted text-center mt-1">RTP {game.rtp}%</p>
                  <div className="mt-2 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-casino-gold/20 text-casino-gold font-medium">
                      LIVE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Game Grid */}
      {!activeGame && !ppGame && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-center mb-12">
              <span className="bg-gradient-gold bg-clip-text text-transparent">Featured Games</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {GAMES.map((game) => (
                <GameCard
                  key={game.id}
                  name={game.name}
                  emoji={game.emoji}
                  description={game.description}
                  onClick={() => {
                    if (isAuthenticated) {
                      setActiveGame(game.component);
                    } else {
                      setShowAuth(true);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      {!activeGame && !ppGame && (
        <section className="py-16 px-4 bg-casino-card/50">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-casino-gold">10+</div>
              <div className="text-casino-muted text-sm mt-1">Games</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-casino-gold">97%</div>
              <div className="text-casino-muted text-sm mt-1">Max RTP</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-casino-gold">0s</div>
              <div className="text-casino-muted text-sm mt-1">Payout Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-casino-gold">24/7</div>
              <div className="text-casino-muted text-sm mt-1">Available</div>
            </div>
          </div>
        </section>
      )}

      {/* Modals */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showProvablyFair && <ProvablyFair onClose={() => setShowProvablyFair(false)} />}
    </div>
  );
}
