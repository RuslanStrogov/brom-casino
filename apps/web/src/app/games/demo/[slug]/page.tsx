'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

interface GameConfig {
  name: string;
  emoji: string;
  color: string;
  description: string;
  type: 'slot' | 'dice' | 'crash' | 'plinko';
}

const GAME_CONFIGS: Record<string, GameConfig> = {
  'starburst': { name: 'Starburst', emoji: '💎', color: '#00d4ff', description: '7-reel cosmic slot with expanding wilds', type: 'slot' },
  'book-of-dead': { name: 'Book of Dead', emoji: '📖', color: '#ffd60a', description: 'Egyptian-themed slot with free spins', type: 'slot' },
  'sweet-bonanza': { name: 'Sweet Bonanza', emoji: '🍬', color: '#ff2d95', description: 'Candy-themed tumbling slots', type: 'slot' },
  'crazy-time': { name: 'Crazy Time', emoji: '🎡', color: '#39ff14', description: 'Live game show with multipliers', type: 'slot' },
  'lightning-roulette': { name: 'Lightning Roulette', emoji: '⚡', color: '#b44aff', description: 'RNG roulette with lightning multipliers', type: 'slot' },
  'monopoly-live': { name: 'Monopoly Live', emoji: '🎲', color: '#ff6b35', description: 'Board game meets live casino', type: 'slot' },
  'mega-moolah': { name: 'Mega Moolah', emoji: '🦁', color: '#39ff14', description: 'Progressive jackpot African safari slot', type: 'slot' },
  'gonzos-quest': { name: "Gonzo's Quest", emoji: '🗿', color: '#00d4ff', description: 'Avalanche slot with increasing multipliers', type: 'slot' },
  'dead-or-alive': { name: 'Dead or Alive', emoji: '🤠', color: '#ff6b35', description: 'Western-themed high volatility slot', type: 'slot' },
  'twin-spin': { name: 'Twin Spin', emoji: '🔄', color: '#b44aff', description: 'Twin reel slot with synced reels', type: 'slot' },
  'jumanji': { name: 'Jumanji', emoji: '🌴', color: '#39ff14', description: 'Board game adventure slot', type: 'slot' },
  'hall-of-gods': { name: 'Hall of Gods', emoji: '⚡', color: '#ffd60a', description: 'Norse mythology jackpot slot', type: 'slot' },
  'reactoonz': { name: 'Reactoonz', emoji: '👾', color: '#00d4ff', description: 'Cluster pays alien slot', type: 'slot' },
  'jammin-jars': { name: "Jammin' Jars", emoji: '🍓', color: '#ff2d95', description: 'Cluster pays fruit slot', type: 'slot' },
  'razor-sharp': { name: 'Razor Sharp', emoji: '🪒', color: '#b44aff', description: 'High-volatility fishing slot', type: 'slot' },
  'mystery-reels': { name: 'Mystery Reels', emoji: '🎭', color: '#ff6b35', description: 'Mystery symbol slot', type: 'slot' },
  'age-of-the-gods': { name: 'Age of the Gods', emoji: '🏛️', color: '#ffd60a', description: 'Greek mythology progressive slot', type: 'slot' },
  'pirates-plenty': { name: "Pirate's Plenty", emoji: '🏴‍☠️', color: '#00d4ff', description: 'Pirate-themed slot with treasure', type: 'slot' },
  'vikings-go-berzerk': { name: "Vikings Go Berzerk", emoji: '🛡️', color: '#ff6b35', description: 'Viking raid slot with rage mode', type: 'slot' },
  'hacksaw-gaming': { name: 'Hacksaw Gaming', emoji: '🪚', color: '#b44aff', description: 'Premium slot game', type: 'slot' },
  'relax-gaming': { name: 'Relax Gaming', emoji: '🧘', color: '#a8e6cf', description: 'Premium slot game', type: 'slot' },
  'truelab': { name: 'TrueLab', emoji: '🔬', color: '#ff8b94', description: 'Premium slot game', type: 'slot' },
  'elk-studios': { name: 'ELK Studios', emoji: '🦌', color: '#d4a5a5', description: 'Premium slot game', type: 'slot' },
  'thunderkick': { name: 'Thunderkick', emoji: '⚡', color: '#ffd93d', description: 'Premium slot game', type: 'slot' },
  'nolimit-city': { name: 'Nolimit City', emoji: '🏙️', color: '#6c5ce7', description: 'Premium slot game', type: 'slot' },
  'slotmill': { name: 'Slotmill', emoji: '⚙️', color: '#a29bfe', description: 'Premium slot game', type: 'slot' },
  'bgaming': { name: 'BGaming', emoji: '🎪', color: '#fd79a8', description: 'Premium slot game', type: 'slot' },
  'push-gaming': { name: 'Push Gaming', emoji: '🔥', color: '#00d4ff', description: 'Premium slot game', type: 'slot' },
  'red-tiger': { name: 'Red Tiger', emoji: '🐯', color: '#b44aff', description: 'Premium slot game', type: 'slot' },
  'playtech': { name: 'Playtech', emoji: '🎯', color: '#39ff14', description: 'Premium slot game', type: 'slot' },
};

// Fallback for unknown games
const FALLBACK_CONFIG: GameConfig = {
  name: 'Casino Game',
  emoji: '🎰',
  color: '#ff2d95',
  description: 'Premium casino game experience',
  type: 'slot',
};

// Slot symbols
const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣', '⭐', '👑'];
const WIN_LINES = [
  [0, 1, 2],      // Top row
  [3, 4, 5],      // Middle row
  [6, 7, 8],      // Bottom row
  [0, 4, 8],      // Diagonal top-left to bottom-right
  [6, 4, 2],      // Diagonal bottom-left to top-right
];

function getRandomSymbol(): string {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function getReels(): string[][] {
  return Array.from({ length: 3 }, () => 
    Array.from({ length: 3 }, () => getRandomSymbol())
  );
}

function checkWin(reels: string[][]): { winAmount: number; winLines: { line: number[]; symbol: string }[] } {
  const wins: { line: number[]; symbol: string }[] = [];
  
  for (const line of WIN_LINES) {
    const symbols = line.map(idx => {
      const row = Math.floor(idx / 3);
      const col = idx % 3;
      return reels[row][col];
    });
    
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      wins.push({ line, symbol: symbols[0] });
    }
  }
  
  // Payout: 3 matching = 10x, 2 matching = 2x, 1 line = 1x
  const winMultiplier = wins.length > 0 ? wins.length * 10 : 0;
  return { winAmount: winMultiplier, winLines: wins };
}

export default function DemoGamePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [isIframe, setIsIframe] = useState(false);
  
  useEffect(() => {
    setIsIframe(window !== window.top);
  }, []);
  
  const config = GAME_CONFIGS[slug] || FALLBACK_CONFIG;
  const [reels, setReels] = useState<string[][]>(getReels());
  const [spinning, setSpinning] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [lastWin, setLastWin] = useState(0);
  const [message, setMessage] = useState('');
  const [spinCount, setSpinCount] = useState(0);
  const [showAnim, setShowAnim] = useState(false);

  const spin = useCallback(() => {
    if (spinning || balance < bet) return;
    
    setSpinning(true);
    setShowAnim(false);
    setLastWin(0);
    setMessage('');
    setBalance(prev => prev - bet);
    
    // Animate reels
    let ticks = 0;
    const interval = setInterval(() => {
      setReels(getReels());
      ticks++;
      if (ticks >= 8) {
        clearInterval(interval);
        
        const finalReels = getReels();
        setReels(finalReels);
        
        const result = checkWin(finalReels);
        if (result.winAmount > 0) {
          const winAmount = result.winAmount * bet;
          setBalance(prev => prev + winAmount);
          setLastWin(winAmount);
          setMessage(`🎉 WIN! ${winAmount} coins!`);
          setShowAnim(true);
        } else {
          setMessage('No win. Try again!');
        }
        
        setSpinCount(prev => prev + 1);
        setSpinning(false);
      }
    }, 100);
  }, [spinning, balance, bet]);

  // Iframe mode: minimal layout without full-page backgrounds
  if (isIframe) {
    return (
      <div className="w-full h-full min-h-[300px] bg-miami-sky flex items-center justify-center p-2">
        <div className="w-full max-w-md">
          {/* Slot Machine */}
          <div
            className="rounded-xl p-3 mb-2"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Reels */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {reels.map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1">
                  {col.map((symbol, rowIdx) => (
                    <div
                      key={`${colIdx}-${rowIdx}`}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xl md:text-2xl transition-all duration-150 ${
                        spinning ? 'scale-95' : 'scale-100'
                      }`}
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {symbol}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Win Animation */}
            {showAnim && (
              <div className="text-center mb-2 animate-bounce">
                <span
                  className="inline-block px-4 py-1 rounded-lg font-bold text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${config.color}40, ${config.color}20)`,
                    border: `1px solid ${config.color}60`,
                    color: config.color,
                  }}
                >
                  {message}
                </span>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setBet(prev => Math.max(1, prev - 5))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ff2d95' }}
                >
                  -
                </button>
                <span className="px-2 py-1 rounded-lg text-xs font-bold text-white">{bet}</span>
                <button
                  onClick={() => setBet(prev => Math.min(100, prev + 5))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#39ff14' }}
                >
                  +
                </button>
              </div>
              <button
                onClick={spin}
                disabled={spinning || balance < bet}
                className="px-6 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
                  color: '#000',
                  boxShadow: spinning ? 'none' : `0 0 15px ${config.color}40`,
                }}
              >
                {spinning ? '🎰 SPINNING...' : '🎰 SPIN'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-lg p-2 flex justify-around text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-gray-500">Balance: <span className="text-miami-cyan font-bold">{balance}</span></span>
            <span className="text-gray-500">Last: <span className="font-bold" style={{ color: lastWin > 0 ? config.color : '#666' }}>{lastWin > 0 ? `+${lastWin}` : '0'}</span></span>
            <span className="text-gray-500">Spins: <span className="text-gray-400">{spinCount}</span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-miami-sky flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-miami-pink/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-miami-purple/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-miami-cyan/5 rounded-full blur-[80px]" />
        <div className="bg-miami-grid absolute inset-0 opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Game Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <span className="w-2 h-2 rounded-full bg-miami-cyan animate-neon-pulse" />
            <span className="text-xs font-medium tracking-wider uppercase text-gray-400">DEMO MODE</span>
          </div>
          <h1 className="text-4xl font-heading font-bold">
            <span className="bg-gradient-miami bg-clip-text text-transparent">{config.emoji}</span>
            <span className="text-white ml-3">{config.name}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2">{config.description}</p>
        </div>

        {/* Slot Machine */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `0 0 30px ${config.color}15`,
          }}
        >
          {/* Reels */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {reels.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-2">
                {col.map((symbol, rowIdx) => (
                  <div
                    key={`${colIdx}-${rowIdx}`}
                    className={`aspect-square rounded-xl flex items-center justify-center text-3xl md:text-4xl transition-all duration-150 ${
                      spinning ? 'scale-95' : 'scale-100'
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                      border: '1px solid rgba(255,255,255,0.1)',
                      animation: spinning ? 'none' : '',
                    }}
                  >
                    {symbol}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Win Animation */}
          {showAnim && (
            <div className="text-center mb-4 animate-bounce">
              <div
                className="inline-block px-6 py-2 rounded-xl font-bold text-lg"
                style={{
                  background: `linear-gradient(135deg, ${config.color}40, ${config.color}20)`,
                  border: `1px solid ${config.color}60`,
                  color: config.color,
                  boxShadow: `0 0 20px ${config.color}30`,
                }}
              >
                {message}
              </div>
            </div>
          )}

          {!showAnim && message && (
            <div className="text-center mb-4">
              <span className="text-gray-500 text-sm">{message}</span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            {/* Bet Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBet(prev => Math.max(1, prev - 5))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ff2d95',
                }}
              >
                -
              </button>
              <div
                className="px-3 py-1.5 rounded-lg text-sm font-bold"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {bet}
              </div>
              <button
                onClick={() => setBet(prev => Math.min(100, prev + 5))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#39ff14',
                }}
              >
                +
              </button>
            </div>

            {/* SPIN Button */}
            <button
              onClick={spin}
              disabled={spinning || balance < bet}
              className="px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
                color: '#000',
                boxShadow: spinning ? 'none' : `0 0 20px ${config.color}40`,
                transform: spinning ? 'scale(0.95)' : 'scale(1)',
              }}
            >
              {spinning ? '🎰 SPINNING...' : '🎰 SPIN'}
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Balance</p>
              <p className="text-lg font-bold text-miami-cyan">{balance}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Win</p>
              <p className="text-lg font-bold" style={{ color: lastWin > 0 ? config.color : '#666' }}>
                {lastWin > 0 ? `+${lastWin}` : '0'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Spins</p>
              <p className="text-lg font-bold text-gray-400">{spinCount}</p>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-600">
            🎮 Demo Mode — Play for fun. No real money involved.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            This is a simulation of {config.name} for preview purposes.
          </p>
        </div>
      </div>
    </div>
  );
}