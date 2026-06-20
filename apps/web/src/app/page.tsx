'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useBalance } from '@/hooks/useBalance';
import { useAuth } from '@/hooks/useAuth';
import SlotGame from '@/components/SlotGame';
import CrashGame from '@/components/CrashGame';
import DiceGame from '@/components/DiceGame';
import PlinkoGame from '@/components/PlinkoGame';
import { GameCard } from '@/components/GameCard';
import { AuthModal } from '@/components/AuthModal';
import { ProvablyFair } from '@/components/ProvablyFair';

const GAMES = [
  { id: 'slots', name: 'Slots', emoji: '🎰', description: 'Classic slot machine with big wins', component: 'slots' },
  { id: 'crash', name: 'Crash', emoji: '🚀', description: 'Ride the multiplier before it crashes', component: 'crash' },
  { id: 'dice', name: 'Dice', emoji: '🎲', description: 'Predict the roll, win big', component: 'dice' },
  { id: 'plinko', name: 'Plinko', emoji: '🎯', description: 'Drop the ball and watch it bounce', component: 'plinko' },
];

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const { balance, setBalance } = useBalance();
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProvablyFair, setShowProvablyFair] = useState(false);

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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {!activeGame && (
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

      {/* Game Grid */}
      {!activeGame && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-center mb-12">
              <span className="bg-gradient-gold bg-clip-text text-transparent">Featured Games</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      {!activeGame && (
        <section className="py-16 px-4 bg-casino-card/50">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-casino-gold">4+</div>
              <div className="text-casino-muted text-sm mt-1">Games</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-casino-gold">96%</div>
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
