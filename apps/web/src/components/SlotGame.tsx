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
              onBalanceChange(balance - bet + winAmount);
              setMessage(`🎉 You won ${winAmount.toFixed(2)}!`);
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
      <h2 className="text-3xl font-display font-bold bg-gradient-gold bg-clip-text text-transparent">
        🎰 Slot Machine
      </h2>

      {/* Slot Machine */}
      <div className="bg-casino-card border border-casino-border rounded-2xl p-8 shadow-2xl">
        <div className="flex gap-3 mb-6">
          {reels.map((symbol, i) => (
            <div
              key={i}
              className={`w-24 h-24 bg-casino-darker border-2 border-casino-gold/30 rounded-xl flex items-center justify-center text-5xl
                ${reelsSpun[i] && !spinning ? 'animate-bounce' : ''}
                ${spinning && !reelsSpun[i] ? 'blur-[1px]' : ''}
              `}
            >
              {symbol}
            </div>
          ))}
        </div>

        {/* Win Display */}
        <div className="h-8 text-center mb-4">
          {lastWin !== null && (
            <span className="text-casino-gold font-bold text-xl animate-pulse">
              +{lastWin.toFixed(2)} 💰
            </span>
          )}
          {message && lastWin === null && (
            <span className="text-casino-muted">{message}</span>
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
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all
                ${bet === amount
                  ? 'bg-casino-gold text-casino-dark'
                  : 'bg-casino-darker text-white border border-casino-border hover:border-casino-gold/50'
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
            active:scale-95 shadow-lg hover:shadow-casino-gold/20"
        >
          {spinning ? '🎰 SPINNING...' : `🎲 SPIN (${bet.toFixed(2)})`}
        </button>
      </div>

      {/* Paytable */}
      <div className="bg-casino-card border border-casino-border rounded-xl p-4 w-full max-w-sm">
        <h3 className="text-casino-gold font-semibold mb-2 text-center">Paytable</h3>
        <div className="grid grid-cols-2 gap-1 text-sm text-casino-muted">
          <span>💎💎💎 = 50x</span>
          <span>⭐⭐⭐ = 20x</span>
          <span>7️⃣7️⃣7️⃣ = 30x</span>
          <span>🔔🔔🔔 = 15x</span>
          <span>🍇🍇🍇 = 10x</span>
          <span>🍊🍊🍊 = 8x</span>
          <span>🍋🍋🍋 = 5x</span>
          <span>🍒🍒🍒 = 3x</span>
        </div>
      </div>
    </div>
  );
}
