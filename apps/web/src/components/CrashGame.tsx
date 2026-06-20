'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface CrashGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export default function CrashGame({ balance, onBalanceChange }: CrashGameProps) {
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashedAt, setCrashedAt] = useState<number | null>(null);
  const [bet, setBet] = useState(1);
  const [autoCashout, setAutoCashout] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(1.0);

  const generateCrashPoint = (): number => {
    const e = Math.random();
    const crashPoint = Math.max(1, 0.99 / (1 - e));
    return Math.min(crashPoint, 100);
  };

  const startGame = useCallback(() => {
    if (isRunning || balance < bet) return;

    onBalanceChange(balance - bet);
    setIsRunning(true);
    setHasCashedOut(false);
    setWinAmount(null);
    setMessage('');
    setMultiplier(1.0);
    setCrashedAt(null);

    const crashPoint = generateCrashPoint();
    crashPointRef.current = crashPoint;
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const currentMultiplier = Math.pow(Math.E, elapsed * 0.08);

      if (currentMultiplier >= crashPoint) {
        setMultiplier(crashPoint);
        setCrashedAt(crashPoint);
        setIsRunning(false);
        setHistory(prev => [crashPoint, ...prev.slice(0, 9)]);
        if (!hasCashedOut) {
          setMessage('💥 Crashed! You lost.');
        }
        return;
      }

      setMultiplier(currentMultiplier);

      if (autoCashout && currentMultiplier >= autoCashout && !hasCashedOut) {
        cashout(currentMultiplier);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isRunning, balance, bet, onBalanceChange, autoCashout, hasCashedOut]);

  const cashout = useCallback((currentMult?: number) => {
    if (!isRunning || hasCashedOut) return;

    const mult = currentMult || multiplier;
    const win = bet * mult;
    setHasCashedOut(true);
    setWinAmount(win);
    onBalanceChange(balance - bet + win);
    setMessage(`✅ Cashed out at ${mult.toFixed(2)}x! Won ${win.toFixed(2)}`);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsRunning(false);
  }, [isRunning, hasCashedOut, multiplier, bet, balance, onBalanceChange]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const getMultiplierColor = () => {
    if (crashedAt) return 'text-casino-red';
    if (multiplier >= 5) return 'text-casino-gold-light';
    if (multiplier >= 2) return 'text-casino-green';
    return 'text-white';
  };

  const betOptions = [0.5, 1, 2, 5, 10];
  const autoCashoutOptions = [1.5, 2, 3, 5, 10];

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <h2 className="text-3xl font-display font-bold bg-gradient-gold bg-clip-text text-transparent">
        🚀 Crash
      </h2>

      {/* Crash Display */}
      <div className="bg-casino-card border border-casino-border rounded-2xl p-8 shadow-2xl w-full max-w-md">
        {/* Multiplier */}
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold font-mono ${getMultiplierColor()} mb-2`}>
            {multiplier.toFixed(2)}x
          </div>
          {crashedAt && (
            <div className="text-casino-red text-sm">
              Crashed at {crashedAt.toFixed(2)}x
            </div>
          )}
          {winAmount !== null && (
            <div className="text-casino-green font-bold text-lg animate-pulse">
              +{winAmount.toFixed(2)} 💰
            </div>
          )}
        </div>

        {/* Graph visualization */}
        <div className="h-32 bg-casino-darker rounded-xl border border-casino-border mb-6 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {!isRunning && !crashedAt && (
              <span className="text-casino-muted text-sm">Press Start to begin</span>
            )}
            {isRunning && (
              <div className="w-full h-full relative">
                <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <path
                    d={`M 0 100 Q 100 ${100 - multiplier * 8} 200 ${Math.max(0, 100 - multiplier * 15)}`}
                    fill="none"
                    stroke={multiplier >= 2 ? '#22c55e' : '#d4a843'}
                    strokeWidth="3"
                  />
                </svg>
                <div
                  className="absolute right-2 w-3 h-3 rounded-full bg-casino-gold animate-pulse"
                  style={{ top: `${Math.max(5, 95 - multiplier * 12)}%` }}
                />
              </div>
            )}
            {crashedAt && (
              <span className="text-casino-red text-2xl">💥</span>
            )}
          </div>
        </div>

        {/* Bet Controls */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-casino-muted text-sm">Bet:</span>
          {betOptions.map((amount) => (
            <button
              key={amount}
              onClick={() => !isRunning && setBet(amount)}
              disabled={isRunning}
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

        {/* Auto Cashout */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-casino-muted text-sm">Auto:</span>
          <button
            onClick={() => setAutoCashout(null)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all
              ${autoCashout === null
                ? 'bg-casino-gold text-casino-dark'
                : 'bg-casino-darker text-white border border-casino-border hover:border-casino-gold/50'
              }
            `}
          >
            Off
          </button>
          {autoCashoutOptions.map((amount) => (
            <button
              key={amount}
              onClick={() => setAutoCashout(amount)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all
                ${autoCashout === amount
                  ? 'bg-casino-gold text-casino-dark'
                  : 'bg-casino-darker text-white border border-casino-border hover:border-casino-gold/50'
                }
              `}
            >
              {amount}x
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isRunning ? (
            <button
              onClick={startGame}
              disabled={balance < bet}
              className="flex-1 py-4 rounded-xl font-bold text-lg transition-all
                bg-gradient-gold text-casino-dark hover:opacity-90
                disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              🚀 START
            </button>
          ) : (
            <button
              onClick={() => cashout()}
              disabled={hasCashedOut}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all
                ${hasCashedOut
                  ? 'bg-casino-border text-casino-muted cursor-not-allowed'
                  : 'bg-casino-green text-white hover:opacity-90 active:scale-95 animate-pulse'
                }
              `}
            >
              {hasCashedOut ? '✅ Cashed Out' : `💰 CASH OUT (${(bet * multiplier).toFixed(2)})`}
            </button>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-casino-card border border-casino-border rounded-xl p-4 w-full max-w-md">
          <h3 className="text-casino-gold font-semibold mb-2 text-center">Recent Crashes</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {history.map((point, i) => (
              <span
                key={i}
                className={`px-3 py-1 rounded-full text-sm font-mono
                  ${point >= 2 ? 'bg-casino-green/20 text-casino-green' : 'bg-casino-red/20 text-casino-red'}
                `}
              >
                {point.toFixed(2)}x
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
