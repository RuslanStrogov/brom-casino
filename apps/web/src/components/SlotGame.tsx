'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐', '🔔'];
const REEL_COUNT = 3;
const SPIN_DURATION = 2000;
const STAGGER_DELAY = 300;

interface SlotGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export default function SlotGame({ balance, onBalanceChange }: SlotGameProps) {
  const [reels, setReels] = useState<string[]>(['🍒', '🍒', '🍒']);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(1);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [reelsSpun, setReelsSpun] = useState([false, false, false]);
  const [glowWin, setGlowWin] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);

  const cleanupIntervals = useCallback(() => {
    intervalRefs.current.forEach(clearTimeout);
    intervalRefs.current = [];
  }, []);

  useEffect(() => {
    return cleanupIntervals;
  }, [cleanupIntervals]);

  const getRandomSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  const calculateWin = (results: string[]): number => {
    if (results[0] === results[1] && results[1] === results[2]) {
      const symbolValues: Record<string, number> = {
        '💎': 50, '7️⃣': 30, '⭐': 20, '🔔': 15, '🍇': 10, '🍊': 8, '🍋': 5, '🍒': 3,
      };
      return bet * (symbolValues[results[0]] || 10);
    }
    if (results[0] === results[1] || results[1] === results[2]) {
      return bet * 2;
    }
    return 0;
  };

  const spin = useCallback(() => {
    if (spinning || balance < bet) return;

    onBalanceChange(balance - bet);
    setSpinning(true);
    setLastWin(null);
    setMessage('');
    setGlowWin(false);
    setReelsSpun([false, false, false]);
    cleanupIntervals();

    const finalReels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];

    for (let i = 0; i < REEL_COUNT; i++) {
      const interval = setInterval(() => {
        setReels(prev => {
          const newReels = [...prev];
          newReels[i] = getRandomSymbol();
          return newReels;
        });
      }, 80);

      const stopTimeout = setTimeout(() => {
        clearInterval(interval);
        setReels(prev => {
          const newReels = [...prev];
          newReels[i] = finalReels[i];
          return newReels;
        });

        const newSpun = [...reelsSpun];
        newSpun[i] = true;
        setReelsSpun(newSpun);

        if (i === REEL_COUNT - 1) {
          const winAmount = calculateWin(finalReels);
          setTimeout(() => {
            setSpinning(false);
            if (winAmount > 0) {
              setLastWin(winAmount);
              setGlowWin(true);
              onBalanceChange(balance - bet + winAmount);
              setMessage(`🎉 You won ${winAmount.toFixed(2)}!`);
              setTimeout(() => setGlowWin(false), 2000);
            } else {
              setMessage('Try again!');
            }
          }, 200);
        }
      }, SPIN_DURATION + i * STAGGER_DELAY);

      intervalRefs.current.push(interval as unknown as NodeJS.Timeout, stopTimeout);
    }
  }, [spinning, balance, bet, onBalanceChange, cleanupIntervals, reelsSpun]);

  const betOptions = [0.5, 1, 2, 5, 10];

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-3xl font-display font-bold bg-gradient-gold bg-clip-text text-transparent">
          🎰 Slot Machine
        </h2>
        <button
          onClick={() => setIsDemo(!isDemo)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            isDemo
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}
        >
          {isDemo ? 'DEMO' : 'REAL'}
        </button>
      </div>

      {/* Slot Machine Frame */}
      <div className={`bg-casino-card border-2 rounded-2xl p-8 shadow-2xl transition-all duration-500 ${
        glowWin ? 'border-casino-gold shadow-casino-gold/30' : 'border-casino-border'
      }`}>
        {/* Top Light Bar */}
        <div className="flex justify-center gap-2 mb-4">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${
              spinning ? 'bg-casino-gold animate-pulse' : glowWin ? 'bg-green-400' : 'bg-casino-border'
            }`} />
          ))}
        </div>

        {/* Reels */}
        <div className="flex gap-3 mb-6 bg-casino-darker rounded-xl p-4 border border-casino-border">
          {reels.map((symbol, i) => (
            <div
              key={i}
              className={`w-24 h-24 bg-gradient-to-b from-casino-card to-casino-darker border-2 rounded-xl flex items-center justify-center text-5xl
                transition-all duration-200
                ${reelsSpun[i] && !spinning ? 'scale-110 border-casino-gold' : 'border-casino-gold/20'}
                ${spinning && !reelsSpun[i] ? 'blur-[2px] scale-95' : ''}
              `}
              style={{
                animation: spinning && !reelsSpun[i] ? 'spinReel 0.1s linear infinite' : 'none',
              }}
            >
              {symbol}
            </div>
          ))}
        </div>

        {/* Win Display */}
        <div className="h-10 text-center mb-4">
          {lastWin !== null && (
            <span className={`font-bold text-2xl animate-bounce ${glowWin ? 'text-casino-gold' : 'text-green-400'}`}>
              🏆 +{lastWin.toFixed(2)} 🏆
            </span>
          )}
          {message && lastWin === null && (
            <span className="text-casino-muted text-lg">{message}</span>
          )}
        </div>

        {/* Bet Controls */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-casino-muted text-sm">Bet:</span>
          {betOptions.map((amount) => (
            <button
              key={amount}
              onClick={() => setBet(amount)}
              disabled={spinning}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
                ${bet === amount
                  ? 'bg-gradient-gold text-casino-dark shadow-lg shadow-casino-gold/20'
                  : 'bg-casino-darker text-white border border-casino-border hover:border-casino-gold/50 hover:bg-casino-card'
                }
                disabled:opacity-50
              `}
            >
              {amount}
            </button>
          ))}
        </div>

        {/* Spin Button */}
        <button
          onClick={spin}
          disabled={spinning || balance < bet}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all
            bg-gradient-gold text-casino-dark hover:opacity-90
            disabled:opacity-50 disabled:cursor-not-allowed
            active:scale-95 shadow-lg hover:shadow-casino-gold/30
            relative overflow-hidden"
        >
          {spinning ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">🎰</span> SPINNING...
            </span>
          ) : (
            `🎲 SPIN (${bet.toFixed(2)})`
          )}
        </button>
      </div>

      {/* Paytable */}
      <div className="bg-casino-card border border-casino-border rounded-xl p-5 w-full max-w-md">
        <h3 className="text-casino-gold font-bold mb-3 text-center text-lg">💎 Paytable</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ['💎💎💎', '50x'], ['7️⃣7️⃣7️⃣', '30x'], ['⭐⭐⭐', '20x'], ['🔔🔔🔔', '15x'],
            ['🍇🍇🍇', '10x'], ['🍊🍊🍊', '8x'], ['🍋🍋🍋', '5x'], ['🍒🍒🍒', '3x'],
          ].map(([combo, mult]) => (
            <div key={combo} className="flex justify-between items-center bg-casino-darker rounded-lg px-3 py-2">
              <span>{combo}</span>
              <span className="text-casino-gold font-bold">{mult}</span>
            </div>
          ))}
          <div className="col-span-2 text-center text-casino-muted text-xs mt-2">
            Any 2 matching = 2x • RTP: 96%
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spinReel {
          0% { transform: translateY(-8px); opacity: 0.7; }
          50% { transform: translateY(8px); opacity: 0.7; }
          100% { transform: translateY(-8px); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
