import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { ArrowLeft, Minus, Plus, RotateCcw, Volume2, VolumeX } from 'lucide-react';

const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐', '🔔'];
const REEL_COUNT = 3;
const VISIBLE_ROWS = 3;

export default function SlotGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hapticImpact, showAlert } = useTelegram();
  const game = location.state?.game;

  const [balance, setBalance] = React.useState(100);
  const [bet, setBet] = React.useState(1);
  const [spinning, setSpinning] = React.useState(false);
  const [reels, setReels] = React.useState<string[][]>(
    Array.from({ length: REEL_COUNT }, () => SLOT_SYMBOLS.slice(0, VISIBLE_ROWS))
  );
  const [lastWin, setLastWin] = React.useState(0);
  const [autoPlay, setAutoPlay] = React.useState(false);
  const [soundOn, setSoundOn] = React.useState(true);
  const [totalWins, setTotalWins] = React.useState(0);
  const [totalSpins, setTotalSpins] = React.useState(0);

  const betSteps = [0.1, 0.5, 1, 2, 5, 10, 25, 50, 100];

  const spin = async () => {
    if (spinning || balance < bet) {
      if (balance < bet) showAlert('Insufficient balance!');
      return;
    }

    hapticImpact('medium');
    setSpinning(true);
    setLastWin(0);
    setTotalSpins(prev => prev + 1);

    try {
      const response = await api.post('/games/slot/spin', { gameId: game?.id, bet });
      const result = response.data;
      animateReels(result.symbols || generateRandomReels(), result.winAmount || 0);
    } catch {
      const symbols = generateRandomReels();
      const winAmount = calculateWin(symbols);
      animateReels(symbols, winAmount);
    }
  };

  const generateRandomReels = (): string[][] => {
    return Array.from({ length: REEL_COUNT }, () =>
      Array.from({ length: VISIBLE_ROWS }, () =>
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
      )
    );
  };

  const calculateWin = (finalReels: string[][]): number => {
    const middleRow = finalReels.map(reel => reel[1]);
    const unique = new Set(middleRow);

    if (unique.size === 1) {
      const symbol = middleRow[0];
      const multipliers: Record<string, number> = {
        '7️⃣': 50, '💎': 25, '⭐': 15, '🔔': 10, '🍇': 8, '🍊': 5, '🍋': 3, '🍒': 2,
      };
      return bet * (multipliers[symbol] || 5);
    }

    if (unique.size === 2) {
      return bet * 1.5;
    }

    return 0;
  };

  const animateReels = (finalSymbols: string[][], winAmount: number) => {
    const spinDuration = 2000;
    const reelDelay = 400;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 50;
      setReels(
        Array.from({ length: REEL_COUNT }, (_, i) => {
          const reelStart = i * reelDelay;
          const reelEnd = reelStart + spinDuration * 0.6;
          if (elapsed < reelStart) return reels[i];
          if (elapsed > reelEnd) return finalSymbols[i];
          return Array.from({ length: VISIBLE_ROWS }, () =>
            SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
          );
        })
      );

      if (elapsed > spinDuration + REEL_COUNT * reelDelay) {
        clearInterval(interval);
        setReels(finalSymbols);
        setSpinning(false);

        if (winAmount > 0) {
          hapticImpact('heavy');
          setLastWin(winAmount);
          setTotalWins(prev => prev + winAmount);
          setBalance(prev => prev + winAmount);
        } else {
          setBalance(prev => prev - bet);
        }
      }
    }, 50);
  };

  const adjustBet = (direction: 'up' | 'down') => {
    hapticImpact('light');
    const currentIndex = betSteps.indexOf(bet);
    if (direction === 'up' && currentIndex < betSteps.length - 1) {
      setBet(betSteps[currentIndex + 1]);
    } else if (direction === 'down' && currentIndex > 0) {
      setBet(betSteps[currentIndex - 1]);
    }
  };

  React.useEffect(() => {
    if (autoPlay && !spinning) {
      const timeout = setTimeout(spin, 500);
      return () => clearTimeout(timeout);
    }
  }, [autoPlay, spinning]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg bg-casino-card hover:bg-casino-border transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">{game?.name || 'Slots'}</h2>
        <button
          onClick={() => setSoundOn(!soundOn)}
          className="p-2 rounded-lg bg-casino-card hover:bg-casino-border transition-colors"
        >
          {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-casino-card rounded-lg p-2">
          <p className="text-xs text-white/50">Spins</p>
          <p className="font-bold text-sm">{totalSpins}</p>
        </div>
        <div className="bg-casino-card rounded-lg p-2">
          <p className="text-xs text-white/50">Wins</p>
          <p className="font-bold text-sm text-green-400">{totalWins.toFixed(2)}</p>
        </div>
        <div className="bg-casino-card rounded-lg p-2">
          <p className="text-xs text-white/50">Balance</p>
          <p className="font-bold text-sm text-amber-400">{balance.toFixed(2)}</p>
        </div>
      </div>

      {/* Slot Machine */}
      <div className="bg-casino-card rounded-2xl p-6 border border-casino-border glow-amber">
        {/* Win Display */}
        {lastWin > 0 && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-green-400 animate-bounce">
              +{lastWin.toFixed(2)} TON!
            </p>
          </div>
        )}

        {/* Reels */}
        <div className="bg-casino-darker rounded-xl p-4 flex justify-center gap-2">
          {reels.map((reel, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 transition-all ${
                spinning ? 'blur-[1px]' : ''
              }`}
            >
              {reel.map((symbol, j) => (
                <div
                  key={j}
                  className={`w-16 h-16 bg-casino-card rounded-lg flex items-center justify-center text-3xl ${
                    j === 1 ? 'border-2 border-amber-500/50' : ''
                  }`}
                >
                  {symbol}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Payline indicator */}
        <div className="flex justify-center mt-2">
          <div className="h-0.5 w-4/5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        </div>
      </div>

      {/* Bet Controls */}
      <div className="bg-casino-card rounded-xl p-4 border border-casino-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/60">Bet Amount</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustBet('down')}
              disabled={spinning}
              className="w-8 h-8 rounded-lg bg-casino-border flex items-center justify-center hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-bold text-amber-400 w-16 text-center">
              {bet.toFixed(1)}
            </span>
            <button
              onClick={() => adjustBet('up')}
              disabled={spinning}
              className="w-8 h-8 rounded-lg bg-casino-border flex items-center justify-center hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Bet */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {betSteps.slice(0, 6).map(step => (
            <button
              key={step}
              onClick={() => { hapticImpact('light'); setBet(step); }}
              className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                bet === step
                  ? 'bg-amber-500 text-black'
                  : 'bg-casino-border text-white/60 hover:text-white'
              }`}
            >
              {step}
            </button>
          ))}
        </div>
      </div>

      {/* Spin Button */}
      <div className="flex gap-3">
        <button
          onClick={spin}
          disabled={spinning || balance < bet}
          className="flex-1 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black btn-press disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-400 hover:to-amber-500 transition-all"
        >
          {spinning ? (
            <span className="flex items-center justify-center gap-2">
              <RotateCcw className="w-5 h-5 animate-spin" /> Spinning...
            </span>
          ) : (
            'SPIN'
          )}
        </button>
        <button
          onClick={() => { hapticImpact('light'); setAutoPlay(!autoPlay); }}
          className={`px-4 rounded-xl font-medium text-sm transition-all ${
            autoPlay
              ? 'bg-green-600 text-white'
              : 'bg-casino-card text-white/60 hover:text-white'
          }`}
        >
          Auto
        </button>
      </div>

      {/* Paytable */}
      <details className="bg-casino-card rounded-xl border border-casino-border">
        <summary className="p-4 cursor-pointer text-sm font-medium text-white/60 hover:text-white transition-colors">
          Paytable
        </summary>
        <div className="px-4 pb-4 space-y-2">
          {[
            { symbol: '7️⃣', label: 'Three 7s', multiplier: '50x' },
            { symbol: '💎', label: 'Three Diamonds', multiplier: '25x' },
            { symbol: '⭐', label: 'Three Stars', multiplier: '15x' },
            { symbol: '🔔', label: 'Three Bells', multiplier: '10x' },
            { symbol: '🍇', label: 'Three Grapes', multiplier: '8x' },
            { symbol: 'Any', label: 'Two Matching', multiplier: '1.5x' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-white/70">
                {row.symbol} {row.label}
              </span>
              <span className="text-amber-400 font-medium">{row.multiplier}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
