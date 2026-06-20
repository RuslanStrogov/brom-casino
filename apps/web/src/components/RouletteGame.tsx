'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

interface RouletteGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

type BetType = 'red' | 'black' | 'even' | 'odd' | '1-18' | '19-36' | 'dozen1' | 'dozen2' | 'dozen3';

interface Bet {
  type: BetType;
  amount: number;
}

const PAYOUTS: Record<BetType, number> = {
  red: 2,
  black: 2,
  even: 2,
  odd: 2,
  '1-18': 2,
  '19-36': 2,
  dozen1: 3,
  dozen2: 3,
  dozen3: 3,
};

export default function RouletteGame({ balance, onBalanceChange }: RouletteGameProps) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [rotation, setRotation] = useState(0);
  const [chipAmount, setChipAmount] = useState(1);
  const wheelRef = useRef<HTMLDivElement>(null);

  const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);

  const isRed = (n: number) => RED_NUMBERS.includes(n);

  const placeBet = (type: BetType) => {
    if (spinning || balance < chipAmount) return;
    const existing = bets.findIndex(b => b.type === type);
    if (existing >= 0) {
      const updated = [...bets];
      updated[existing] = { ...updated[existing], amount: updated[existing].amount + chipAmount };
      setBets(updated);
    } else {
      setBets([...bets, { type, amount: chipAmount }]);
    }
    onBalanceChange(balance - chipAmount);
  };

  const spin = useCallback(() => {
    if (spinning || bets.length === 0) return;
    setSpinning(true);
    setLastWin(null);
    setMessage('');
    setResult(null);

    const winningNumber = Math.floor(Math.random() * 37);
    const spins = 5 + Math.random() * 3;
    const finalRotation = rotation + spins * 360 + (winningNumber * (360 / 37));
    setRotation(finalRotation);

    setTimeout(() => {
      setResult(winningNumber);
      let totalWin = 0;
      bets.forEach(bet => {
        let won = false;
        switch (bet.type) {
          case 'red': won = isRed(winningNumber) && winningNumber !== 0; break;
          case 'black': won = !isRed(winningNumber) && winningNumber !== 0; break;
          case 'even': won = winningNumber !== 0 && winningNumber % 2 === 0; break;
          case 'odd': won = winningNumber % 2 === 1; break;
          case '1-18': won = winningNumber >= 1 && winningNumber <= 18; break;
          case '19-36': won = winningNumber >= 19 && winningNumber <= 36; break;
          case 'dozen1': won = winningNumber >= 1 && winningNumber <= 12; break;
          case 'dozen2': won = winningNumber >= 13 && winningNumber <= 24; break;
          case 'dozen3': won = winningNumber >= 25 && winningNumber <= 36; break;
        }
        if (won) {
          totalWin += bet.amount * PAYOUTS[bet.type];
        }
      });

      setSpinning(false);
      if (totalWin > 0) {
        setLastWin(totalWin);
        onBalanceChange(balance - totalBet + totalWin);
        setMessage(`🎉 ${winningNumber} — You won ${totalWin.toFixed(2)}!`);
      } else {
        setMessage(`${winningNumber} — No win. Try again!`);
      }
      setBets([]);
    }, 5000);
  }, [spinning, bets, balance, chipAmount, rotation, totalBet, onBalanceChange]);

  const clearBets = () => {
    if (spinning) return;
    onBalanceChange(balance + totalBet);
    setBets([]);
  };

  const chipOptions = [0.5, 1, 2, 5, 10, 25];

  const betButton = (type: BetType, label: string, className?: string) => (
    <button
      key={type}
      onClick={() => placeBet(type)}
      disabled={spinning || balance < chipAmount}
      className={`relative px-4 py-3 rounded-lg text-sm font-bold transition-all
        bg-casino-darker border border-casino-border hover:border-casino-gold/50 hover:bg-casino-card
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className || ''}
      `}
    >
      {label}
      {bets.find(b => b.type === type) && (
        <span className="absolute -top-2 -right-2 bg-casino-gold text-casino-dark text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {bets.find(b => b.type === type)?.amount}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <h2 className="text-3xl font-display font-bold bg-gradient-gold bg-clip-text text-transparent">
        🎡 Roulette
      </h2>

      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl">
        {/* Wheel */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              ref={wheelRef}
              className="w-48 h-48 rounded-full border-4 border-casino-gold shadow-2xl shadow-casino-gold/20 relative overflow-hidden"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              }}
            >
              {/* Simplified wheel segments */}
              {Array.from({ length: 37 }, (_, i) => {
                const angle = (i * 360) / 37;
                const isRedNum = isRed(i);
                return (
                  <div
                    key={i}
                    className="absolute w-full h-full"
                    style={{
                      transform: `rotate(${angle}deg)`,
                    }}
                  >
                    <div
                      className={`absolute top-0 left-1/2 w-[4px] h-1/2 origin-bottom ${
                        i === 0 ? 'bg-green-500' : isRedNum ? 'bg-red-500' : 'bg-gray-900'
                      }`}
                      style={{ transform: 'translateX(-50%)' }}
                    />
                  </div>
                );
              })}
              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-casino-dark border-2 border-casino-gold flex items-center justify-center">
                  <span className="text-casino-gold font-bold text-lg">{result !== null ? result : '?'}</span>
                </div>
              </div>
            </div>
            {/* Pointer */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-casino-gold" />
          </div>

          {/* Result Display */}
          <div className="h-8 text-center">
            {lastWin !== null && (
              <span className="font-bold text-xl text-casino-gold animate-bounce">🏆 +{lastWin.toFixed(2)}</span>
            )}
            {message && lastWin === null && (
              <span className="text-casino-muted">{message}</span>
            )}
          </div>

          {/* Spin Button */}
          <button
            onClick={spin}
            disabled={spinning || bets.length === 0}
            className="px-8 py-3 rounded-xl font-bold text-lg transition-all
              bg-gradient-gold text-casino-dark hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-95 shadow-lg"
          >
            {spinning ? '🎡 Spinning...' : '🎲 SPIN'}
          </button>
          {bets.length > 0 && !spinning && (
            <button onClick={clearBets} className="text-sm text-red-400 hover:text-red-300">
              Clear bets
            </button>
          )}
        </div>

        {/* Betting Board */}
        <div className="flex-1">
          {/* Chip Selection */}
          <div className="mb-4">
            <span className="text-casino-muted text-sm block mb-2">Chip:</span>
            <div className="flex gap-2 flex-wrap">
              {chipOptions.map(amount => (
                <button
                  key={amount}
                  onClick={() => setChipAmount(amount)}
                  className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${
                    chipAmount === amount
                      ? 'bg-casino-gold text-casino-dark shadow-lg'
                      : 'bg-casino-darker text-white border border-casino-border hover:border-casino-gold/50'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Zero */}
          <div className="mb-2">
            {betButton('dozen1', '0', 'w-full bg-green-700/50 border-green-600/50 hover:border-green-400')}
          </div>

          {/* Number Grid */}
          <div className="grid grid-cols-12 gap-1 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36].map(n => (
              <button
                key={n}
                onClick={() => placeBet(n <= 18 ? '1-18' : '19-36')}
                disabled={spinning || balance < chipAmount}
                className={`py-2 rounded text-xs font-bold transition-all ${
                  isRed(n) ? 'bg-red-600/80 hover:bg-red-500' : 'bg-gray-800 hover:bg-gray-700'
                } disabled:opacity-40`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Outside Bets */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {betButton('dozen1', '1st 12')}
            {betButton('dozen2', '2nd 12')}
            {betButton('dozen3', '3rd 12')}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {betButton('1-18', '1-18')}
            {betButton('even', 'EVEN')}
            {betButton('red', '🔴 RED')}
            {betButton('black', '⚫ BLACK')}
            {betButton('odd', 'ODD')}
            {betButton('19-36', '19-36')}
          </div>

          {/* Total Bet */}
          <div className="bg-casino-darker rounded-lg p-3 border border-casino-border">
            <div className="flex justify-between items-center">
              <span className="text-casino-muted text-sm">Total Bet:</span>
              <span className="text-casino-gold font-bold">{totalBet.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
