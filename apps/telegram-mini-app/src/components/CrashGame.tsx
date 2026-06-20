import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { ArrowLeft, TrendingUp, Zap } from 'lucide-react';

interface BetEntry {
  id: string;
  username: string;
  betAmount: number;
  cashoutAt?: number;
  profit?: number;
  status: 'playing' | 'cashed_out' | 'crashed';
}

export default function CrashGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hapticImpact, showAlert, showConfirm } = useTelegram();
  const game = location.state?.game;

  const [balance, setBalance] = React.useState(100);
  const [bet, setBet] = React.useState(1);
  const [autoCashout, setAutoCashout] = React.useState(2);
  const [gameState, setGameState] = React.useState<'idle' | 'betting' | 'running' | 'crashed'>('idle');
  const [multiplier, setMultiplier] = React.useState(1);
  const [crashPoint, setCrashPoint] = React.useState(0);
  const [hasBet, setHasBet] = React.useState(false);
  const [hasCashedOut, setHasCashedOut] = React.useState(false);
  const [history, setHistory] = React.useState<number[]>([1.5, 3.2, 1.0, 8.7, 2.1, 1.3, 5.4, 1.0, 12.3, 1.8]);
  const [activeBets, setActiveBets] = React.useState<BetEntry[]>([]);
  const [roundId, setRoundId] = React.useState('');

  const betSteps = [0.1, 0.5, 1, 2, 5, 10, 25, 50, 100];

  // Generate a deterministic crash point
  const generateCrashPoint = (): number => {
    const e = Math.random();
    // House edge of 3%
    const crash = Math.max(1, 0.99 / (1 - e));
    return Math.min(crash, 100);
  };

  const startRound = async () => {
    if (hasBet) {
      showAlert('Already placed a bet for this round!');
      return;
    }
    if (balance < bet) {
      showAlert('Insufficient balance!');
      return;
    }

    hapticImpact('medium');
    setHasBet(true);
    setHasCashedOut(false);
    setBalance(prev => prev - bet);

    const newRoundId = `round-${Date.now()}`;
    setRoundId(newRoundId);

    setActiveBets(prev => [
      ...prev,
      {
        id: newRoundId,
        username: 'You',
        betAmount: bet,
        status: 'playing',
      },
    ]);

    // Simulate other players
    const otherBets: BetEntry[] = Array.from({ length: Math.floor(Math.random() * 8) + 3 }, (_, i) => ({
      id: `other-${i}`,
      username: `Player${Math.floor(Math.random() * 9999)}`,
      betAmount: Math.round((Math.random() * 50 + 0.1) * 100) / 100,
      status: 'playing' as const,
    }));
    setActiveBets(prev => [...prev, ...otherBets]);

    // Start the round after a countdown
    setGameState('betting');
    let countdown = 3;
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        runGame(newRoundId);
      }
    }, 1000);
  };

  const runGame = (currentRoundId: string) => {
    setGameState('running');
    const crash = generateCrashPoint();
    setCrashPoint(crash);

    let currentMultiplier = 1;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Exponential growth: multiplier = e^(0.06 * elapsed)
      currentMultiplier = Math.pow(Math.E, 0.06 * elapsed);
      setMultiplier(currentMultiplier);

      // Auto cashout
      if (hasBet && !hasCashedOut && autoCashout > 0 && currentMultiplier >= autoCashout) {
        cashOut(currentRoundId);
      }

      if (currentMultiplier >= crash) {
        // Crash!
        setGameState('crashed');
        setMultiplier(crash);
        hapticImpact('heavy');

        setHistory(prev => [crash, ...prev].slice(0, 20));

        setActiveBets(prev =>
          prev.map(b => {
            if (b.id === currentRoundId) {
              return hasCashedOut
                ? { ...b, status: 'cashed_out' as const, cashoutAt: autoCashout, profit: bet * autoCashout - bet }
                : { ...b, status: 'crashed' as const, profit: -bet };
            }
            if (b.status === 'playing') {
              const didCashout = Math.random() > 0.4;
              const cashoutMult = didCashout ? Math.random() * (crash - 1) + 1 : undefined;
              return {
                ...b,
                status: didCashout ? ('cashed_out' as const) : ('crashed' as const),
                cashoutAt: cashoutMult,
                profit: didCashout ? b.betAmount * (cashoutMult || 1) - b.betAmount : -b.betAmount,
              };
            }
            return b;
          })
        );

        // Reset after delay
        setTimeout(() => {
          setGameState('idle');
          setMultiplier(1);
          setHasBet(false);
          setActiveBets([]);
        }, 3000);
      } else {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  const cashOut = (currentRoundId: string) => {
    if (hasCashedOut || !hasBet) return;

    hapticImpact('heavy');
    setHasCashedOut(true);
    const winAmount = bet * multiplier;
    setBalance(prev => prev + winAmount);

    setActiveBets(prev =>
      prev.map(b =>
        b.id === currentRoundId
          ? { ...b, status: 'cashed_out' as const, cashoutAt: multiplier, profit: winAmount - bet }
          : b
      )
    );
  };

  const getMultiplierColor = () => {
    if (gameState === 'crashed') return 'text-red-500';
    if (multiplier < 2) return 'text-white';
    if (multiplier < 5) return 'text-green-400';
    if (multiplier < 10) return 'text-yellow-400';
    return 'text-amber-400';
  };

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
        <h2 className="font-bold text-lg">{game?.name || 'Crash'}</h2>
        <div className="w-9" />
      </div>

      {/* Crash Graph Area */}
      <div className="bg-casino-card rounded-2xl p-6 border border-casino-border relative overflow-hidden min-h-[200px] flex items-center justify-center">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-white/20"
              style={{ top: `${(i + 1) * 10}%` }}
            />
          ))}
        </div>

        {/* Multiplier Display */}
        <div className="relative z-10 text-center">
          {gameState === 'idle' && (
            <div>
              <TrendingUp className="w-16 h-16 mx-auto text-white/30 mb-2" />
              <p className="text-white/40">Waiting for next round...</p>
            </div>
          )}

          {gameState === 'betting' && (
            <div>
              <div className="text-5xl font-bold text-amber-400 animate-pulse">3...</div>
              <p className="text-white/60 mt-2">Place your bets!</p>
            </div>
          )}

          {gameState === 'running' && (
            <div>
              <div className={`text-6xl font-bold crash-multiplier ${getMultiplierColor()}`}>
                {multiplier.toFixed(2)}x
              </div>
              <p className="text-green-400 mt-2 flex items-center justify-center gap-1">
                <Zap className="w-4 h-4" /> Rising!
              </p>
            </div>
          )}

          {gameState === 'crashed' && (
            <div>
              <div className="text-6xl font-bold text-red-500">
                {crashPoint.toFixed(2)}x
              </div>
              <p className="text-red-400 mt-2 text-xl font-bold">CRASHED!</p>
            </div>
          )}
        </div>

        {/* Rocket animation when running */}
        {gameState === 'running' && (
          <div
            className="absolute bottom-4 text-4xl transition-all duration-300"
            style={{ left: `${Math.min(80, (multiplier / 10) * 80)}%` }}
          >
            🚀
          </div>
        )}
      </div>

      {/* History */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {history.map((point, i) => (
          <span
            key={i}
            className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
              point < 2
                ? 'bg-red-500/20 text-red-400'
                : point < 5
                ? 'bg-green-500/20 text-green-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {point.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Bet Controls */}
      <div className="bg-casino-card rounded-xl p-4 border border-casino-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Bet</span>
          <div className="flex items-center gap-2">
            {[0.5, 1, 2, 5].map(factor => (
              <button
                key={factor}
                onClick={() => { hapticImpact('light'); setBet(Math.max(0.1, bet * factor)); }}
                className="px-2 py-1 rounded text-xs bg-casino-border hover:bg-amber-500/20 transition-colors"
              >
                {factor === 0.5 ? '½' : factor === 2 ? '2×' : factor === 5 ? '5×' : '1×'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { hapticImpact('light'); setBet(Math.max(0.1, bet - 0.5)); }}
            className="w-10 h-10 rounded-lg bg-casino-border flex items-center justify-center text-lg font-bold hover:bg-amber-500/20"
          >
            -
          </button>
          <input
            type="number"
            value={bet}
            onChange={e => setBet(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
            className="flex-1 bg-casino-darker rounded-lg px-4 py-2 text-center font-bold text-amber-400 border border-casino-border focus:border-amber-500 focus:outline-none"
            step="0.1"
            min="0.1"
          />
          <button
            onClick={() => { hapticImpact('light'); setBet(bet + 0.5); }}
            className="w-10 h-10 rounded-lg bg-casino-border flex items-center justify-center text-lg font-bold hover:bg-amber-500/20"
          >
            +
          </button>
        </div>

        {/* Auto Cashout */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Auto Cashout</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={autoCashout}
              onChange={e => setAutoCashout(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-20 bg-casino-darker rounded-lg px-3 py-1.5 text-center font-bold text-green-400 border border-casino-border focus:border-green-500 focus:outline-none text-sm"
              step="0.5"
              min="0"
            />
            <span className="text-xs text-white/40">0 = off</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {gameState === 'idle' || gameState === 'betting' ? (
        <button
          onClick={startRound}
          disabled={gameState === 'betting' || balance < bet}
          className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white btn-press disabled:opacity-50 hover:from-green-400 hover:to-emerald-500 transition-all"
        >
          {gameState === 'betting' ? 'Betting...' : `Place Bet (${bet.toFixed(2)} TON)`}
        </button>
      ) : (
        <button
          onClick={() => cashOut(roundId)}
          disabled={hasCashedOut || gameState === 'crashed'}
          className={`w-full py-4 rounded-xl font-bold text-lg btn-press transition-all ${
            hasCashedOut
              ? 'bg-casino-card text-green-400 border border-green-500/30'
              : gameState === 'crashed'
              ? 'bg-red-900/50 text-red-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400'
          }`}
        >
          {hasCashedOut
            ? `Cashed Out @ ${multiplier.toFixed(2)}x!`
            : gameState === 'crashed'
            ? 'Crashed!'
            : `Cash Out @ ${multiplier.toFixed(2)}x = ${(bet * multiplier).toFixed(2)} TON`}
        </button>
      )}

      {/* Active Players */}
      {activeBets.length > 0 && (
        <div className="bg-casino-card rounded-xl border border-casino-border overflow-hidden">
          <div className="px-4 py-2 border-b border-casino-border">
            <span className="text-sm font-medium text-white/60">
              Players ({activeBets.length})
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {activeBets.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between px-4 py-2 border-b border-casino-border/50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[10px] font-bold text-black">
                    {b.username[0]}
                  </div>
                  <span className="text-sm">{b.username}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/60">{b.betAmount.toFixed(2)}</span>
                  {b.status === 'cashed_out' && (
                    <span className="text-sm text-green-400 font-medium">
                      @ {b.cashoutAt?.toFixed(2)}x (+{b.profit?.toFixed(2)})
                    </span>
                  )}
                  {b.status === 'crashed' && (
                    <span className="text-sm text-red-400">
                      {b.profit?.toFixed(2)}
                    </span>
                  )}
                  {b.status === 'playing' && (
                    <span className="text-sm text-yellow-400">Playing...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
