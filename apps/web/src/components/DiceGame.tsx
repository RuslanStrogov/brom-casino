'use client';

import { useState, useCallback } from 'react';

interface DiceGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export default function DiceGame({ balance, onBalanceChange }: DiceGameProps) {
  const [target, setTarget] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [bet, setBet] = useState(1);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ result: number; won: boolean }[]>([]);

  const roll = useCallback(() => {
    if (rolling || balance < bet) return;

    onBalanceChange(balance - bet);
    setRolling(true);
    setWinAmount(null);
    setMessage('');
    setResult(null);

    // Animate rolling
    let count = 0;
    const interval = setInterval(() => {
      setResult(Math.floor(Math.random() * 100) + 1);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const finalResult = Math.floor(Math.random() * 100) + 1;
        setResult(finalResult);
        setRolling(false);

        const won = isOver ? finalResult > target : finalResult < target;
        const payout = isOver
          ? (99 / (99 - target)) * bet
          : (99 / target) * bet;

        if (won) {
          const win = payout;
          setWinAmount(win);
          onBalanceChange(balance - bet + win);
          setMessage(`🎉 Rolled ${finalResult}! You won ${win.toFixed(2)}!`);
        } else {
          setMessage(`Rolled ${finalResult}. Try again!`);
        }

        setHistory(prev => [{ result: finalResult, won }, ...prev.slice(0, 9)]);
      }
    }, 80);
  }, [rolling, balance, bet, target, isOver, onBalanceChange]);

  const winChance = isOver ? 99 - target : target;
  const payoutMultiplier = isOver ? 99 / (99 - target) : 99 / target;

  const betOptions = [0.5, 1, 2, 5, 10];

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <h2 className="text-3xl font-display font-bold bg-gradient-gold bg-clip-text text-transparent">
        🎲 Dice
      </h2>

      <div className="bg-casino-card border border-casino-border rounded-2xl p-8 shadow-2xl w-full max-w-md">
        {/* Result Display */}
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold font-mono mb-2
            ${result === null ? 'text-casino-muted' : ''}
            ${result !== null && !rolling && result > target && isOver ? 'text-casino-green' : ''}
            ${result !== null && !rolling && result < target && !isOver ? 'text-casino-green' : ''}
            ${result !== null && !rolling && ((isOver && result <= target) || (!isOver && result >= target)) ? 'text-casino-red' : ''}
          `}>
            {result === null ? '--' : result}
          </div>
          {winAmount !== null && (
            <div className="text-casino-green font-bold text-lg animate-pulse">
              +{winAmount.toFixed(2)} 💰
            </div>
          )}
          {message && !winAmount && (
            <span className="text-casino-muted text-sm">{message}</span>
          )}
        </div>

        {/* Target Slider */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-casino-muted mb-2">
            <span>Target: {target}</span>
            <span>Win Chance: {winChance.toFixed(1)}%</span>
            <span>Payout: {payoutMultiplier.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min={1}
            max={98}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            disabled={rolling}
            className="w-full h-2 bg-casino-darker rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:bg-casino-gold [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-lg"
          />
          <div className="flex justify-between mt-2">
            <button
              onClick={() => setIsOver(false)}
              disabled={rolling}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 mr-2
                ${!isOver
                  ? 'bg-casino-gold text-casino-dark'
                  : 'bg-casino-darker text-white border border-casino-border hover:border-casino-gold/50'
                }
                disabled:opacity-50
              `}
            >
              📉 Roll Under {target}
            </button>
            <button
              onClick={() => setIsOver(true)}
              disabled={rolling}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ml-2
                ${isOver
                  ? 'bg-casino-gold text-casino-dark'
                  : 'bg-casino-darker text-white border border-casino-border hover:border-casino-gold/50'
                }
                disabled:opacity-50
              `}
            >
              📈 Roll Over {target}
            </button>
          </div>
        </div>

        {/* Bet Controls */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-casino-muted text-sm">Bet:</span>
          {betOptions.map((amount) => (
            <button
              key={amount}
              onClick={() => !rolling && setBet(amount)}
              disabled={rolling}
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

        {/* Roll Button */}
        <button
          onClick={roll}
          disabled={rolling || balance < bet}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all
            bg-gradient-gold text-casino-dark hover:opacity-90
            disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {rolling ? '🎲 Rolling...' : `🎲 ROLL DICE (${bet.toFixed(2)})`}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-casino-card border border-casino-border rounded-xl p-4 w-full max-w-md">
          <h3 className="text-casino-gold font-semibold mb-2 text-center">Roll History</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {history.map((item, i) => (
              <span
                key={i}
                className={`px-3 py-1 rounded-full text-sm font-mono
                  ${item.won ? 'bg-casino-green/20 text-casino-green' : 'bg-casino-red/20 text-casino-red'}
                `}
              >
                {item.result}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
