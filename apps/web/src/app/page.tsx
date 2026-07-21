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
import PragmaticPlayGame from '@/components/PragmaticPlayGame';
import { GameCard } from '@/components/GameCard';
import { AuthModal } from '@/components/AuthModal';
import { ProvablyFair } from '@/components/ProvablyFair';

const GAMES = [
  { id: 'slots', name: 'Slots', emoji: '🎰', description: 'Classic slot machine with big wins', component: 'slots', color: '#ff2d95' },
  { id: 'crash', name: 'Crash', emoji: '🚀', description: 'Ride the multiplier before it crashes', component: 'crash', color: '#b44aff' },
  { id: 'dice', name: 'Dice', emoji: '🎲', description: 'Predict the roll, win big', component: 'dice', color: '#00d4ff' },
  { id: 'plinko', name: 'Plinko', emoji: '🎯', description: 'Drop the ball and watch it bounce', component: 'plinko', color: '#ff6b35' },
  { id: 'roulette', name: 'Roulette', emoji: '🎡', description: 'European roulette with 37 numbers', component: 'roulette', color: '#39ff14' },
  { id: 'blackjack', name: 'Blackjack', emoji: '🃏', description: 'Beat the dealer to 21', component: 'blackjack', color: '#ffd60a' },
];

const PP_GAMES = [
  { id: 'pp-gates', name: 'Gates of Olympus', emoji: '⚡', provider: 'Pragmatic Play', rtp: 96.5 },
  { id: 'pp-sweet', name: 'Sweet Bonanza', emoji: '🍬', provider: 'Pragmatic Play', rtp: 96.48 },
  { id: 'pp-dog', name: 'The Dog House', emoji: '🐕', provider: 'Pragmatic Play', rtp: 96.51 },
  { id: 'pp-wolf', name: 'Wolf Gold', emoji: '🐺', provider: 'Pragmatic Play', rtp: 96.01 },
  { id: 'pp-bass', name: 'Big Bass Bonanza', emoji: '🎣', provider: 'Pragmatic Play', rtp: 96.71 },
  { id: 'pp-roulette', name: 'Mega Roulette Live', emoji: '🎡', provider: 'Pragmatic Play', rtp: 97.0 },
];

const CATEGORIES = ['All', 'Slots', 'Table', 'Live', 'Jackpot', 'New'];

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const { balance, setBalance } = useBalance();
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProvablyFair, setShowProvablyFair] = useState(false);
  const [ppGame, setPpGame] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

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

  const renderPpGame = () => {
    if (!ppGame) return null;
    return <PragmaticPlayGame gameId={ppGame} onClose={() => setPpGame(null)} />;
  };

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
      {!activeGame && !ppGame && (
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

          {/* Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-miami-cyan animate-neon-pulse" />
              <span className="text-xs text-miami-cyan font-medium tracking-wider uppercase">Live Casino • 24/7</span>
            </div>

            {/* Main Title */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-heading font-bold mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <span className="bg-gradient-miami bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient-shift">
                BROM
              </span>
              <span className="text-white/90 ml-3">CASINO</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <span className="text-miami-cyan">Provably fair</span> crypto casino with instant payouts, 
              <span className="text-miami-pink"> best odds</span>, and exclusive games
            </p>

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
                  🎰 Play Now
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
              <button
                onClick={() => setShowProvablyFair(true)}
                className="btn-miami-secondary group"
              >
                <span className="flex items-center gap-2">
                  🔒 Fairness
                </span>
              </button>
            </div>

            {/* Stats Bar */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '0.4s' }}>
              {[
                { value: '10+', label: 'Games', color: 'text-miami-pink' },
                { value: '97%', label: 'Max RTP', color: 'text-miami-cyan' },
                { value: '0s', label: 'Payout Time', color: 'text-miami-purple' },
                { value: '24/7', label: 'Available', color: 'text-miami-orange' },
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
              <span className="text-xs text-gray-600 uppercase tracking-widest">Scroll</span>
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
              Back to Games
            </button>
            {renderGame()}
          </div>
        </section>
      )}

      {/* ===== PRAGMATIC PLAY GAME VIEW ===== */}
      {ppGame && (
        <section className="relative z-10 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setPpGame(null)}
              className="mb-6 text-miami-cyan hover:text-miami-cyan/80 transition-colors flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Games
            </button>
            {renderPpGame()}
          </div>
        </section>
      )}

      {/* ===== PRAGMATIC PLAY SECTION ===== */}
      {!activeGame && !ppGame && (
        <section className="relative z-10 py-16 px-4" id="games">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <div className="flex-1 h-px bg-gradient-miami opacity-30" />
              <div className="flex items-center gap-3">
                <h2 className="text-3xl md:text-4xl font-heading font-bold">
                  <span className="bg-gradient-miami bg-clip-text text-transparent">Live Casino</span>
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-miami-purple/20 text-miami-purple border border-miami-purple/30 animate-neon-pulse">
                  Pragmatic Play
                </span>
              </div>
              <div className="flex-1 h-px bg-gradient-miami opacity-30" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {PP_GAMES.map((game, idx) => (
                <div
                  key={game.id}
                  onClick={() => {
                    if (isAuthenticated) setPpGame(game.id);
                    else setShowAuth(true);
                  }}
                  className="group cursor-pointer glass-card rounded-xl p-5 hover:scale-[1.03] transition-all duration-300 animate-fade-up relative overflow-hidden"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-miami opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    <div className="text-4xl mb-3 text-center group-hover:scale-110 transition-transform duration-300">{game.emoji}</div>
                    <h3 className="text-sm font-bold text-center text-white group-hover:text-miami-cyan transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-xs text-gray-500 text-center mt-1">{game.provider}</p>
                    <p className="text-xs text-gray-500 text-center">RTP {game.rtp}%</p>
                    <div className="mt-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-medium bg-miami-pink/20 text-miami-pink border border-miami-pink/30 animate-neon-pulse-fast">
                        LIVE
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURED GAMES SECTION ===== */}
      {!activeGame && !ppGame && (
        <section className="relative z-10 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex-1 h-px bg-gradient-miami opacity-20" />
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">
                <span className="bg-gradient-miami bg-clip-text text-transparent">Featured Games</span>
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Choose your game and start winning in seconds
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-gradient-miami text-white shadow-[0_0_15px_rgba(255,45,149,0.2)]'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {GAMES.map((game, idx) => (
                <div
                  key={game.id}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <GameCard
                    name={game.name}
                    emoji={game.emoji}
                    description={game.description}
                    color={game.color}
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

      {/* ===== WHY CHOOSE US ===== */}
      {!activeGame && !ppGame && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">
                <span className="text-white">Why</span>{' '}
                <span className="bg-gradient-miami bg-clip-text text-transparent">BROM</span>
              </h2>
              <p className="text-gray-500">Built for players, powered by crypto</p>
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
                  title: 'Exclusive Games',
                  desc: 'Original crypto games you won\'t find anywhere else + top providers.',
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