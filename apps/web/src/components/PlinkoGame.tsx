'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface PlinkoGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

const ROWS = 12;
const PEG_SPACING = 32;
const BALL_RADIUS = 6;

const PAYOUT_MULTIPLIERS: Record<number, number[]> = {
  8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
  12: [8.4, 3, 1.4, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.4, 3, 8.4],
  16: [10, 4, 2, 1.5, 1, 0.7, 0.5, 0.3, 0.5, 0.7, 1, 1.5, 2, 4, 10],
};

export default function PlinkoGame({ balance, onBalanceChange }: PlinkoGameProps) {
  const [rows, setRows] = useState(12);
  const [bet, setBet] = useState(1);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [dropping, setDropping] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const ballIdRef = useRef(0);

  const multipliers = PAYOUT_MULTIPLIERS[rows] || PAYOUT_MULTIPLIERS[12];
  const slotCount = multipliers.length;
  const canvasWidth = slotCount * PEG_SPACING + 40;
  const canvasHeight = rows * PEG_SPACING + 80;

  const drawBoard = useCallback((activeBalls: Ball[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw pegs
    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3;
      const startX = (canvasWidth - (pegsInRow - 1) * PEG_SPACING) / 2;
      for (let col = 0; col < pegsInRow; col++) {
        const x = startX + col * PEG_SPACING;
        const y = 40 + row * PEG_SPACING;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#d4a843';
        ctx.fill();
      }
    }

    // Draw slots with multipliers
    const slotWidth = canvasWidth / slotCount;
    for (let i = 0; i < slotCount; i++) {
      const x = i * slotWidth;
      const y = canvasHeight - 30;

      // Slot background
      const mult = multipliers[i];
      const intensity = Math.min(mult / 10, 1);
      ctx.fillStyle = `rgba(212, 168, 67, ${0.1 + intensity * 0.3})`;
      ctx.fillRect(x + 1, y, slotWidth - 2, 25);

      // Multiplier text
      ctx.fillStyle = '#d4a843';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${mult}x`, x + slotWidth / 2, y + 16);
    }

    // Draw active balls
    activeBalls.forEach(ball => {
      if (!ball.active) return;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#f0d060';
      ctx.fill();
      ctx.strokeStyle = '#d4a843';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [rows, canvasWidth, canvasHeight, multipliers]);

  const dropBall = useCallback(() => {
    if (dropping || balance < bet) return;

    onBalanceChange(balance - bet);
    setDropping(true);
    setLastWin(null);
    setMessage('');

    const id = ballIdRef.current++;
    const startX = canvasWidth / 2 + (Math.random() - 0.5) * 20;

    const newBall: Ball = {
      id,
      x: startX,
      y: 20,
      vx: 0,
      vy: 0,
      active: true,
    };

    setBalls(prev => [...prev, newBall]);

    let currentBall = { ...newBall };
    let hitCount = 0;

    const animate = () => {
      if (!currentBall.active) return;

      // Gravity
      currentBall.vy += 0.3;
      currentBall.x += currentBall.vx;
      currentBall.y += currentBall.vy;

      // Check peg collisions
      for (let row = 0; row < rows; row++) {
        const pegsInRow = row + 3;
        const startX = (canvasWidth - (pegsInRow - 1) * PEG_SPACING) / 2;
        for (let col = 0; col < pegsInRow; col++) {
          const pegX = startX + col * PEG_SPACING;
          const pegY = 40 + row * PEG_SPACING;

          const dx = currentBall.x - pegX;
          const dy = currentBall.y - pegY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < BALL_RADIUS + 3) {
            // Bounce
            const angle = Math.atan2(dy, dx);
            currentBall.vx = Math.cos(angle) * 3 + (Math.random() - 0.5) * 2;
            currentBall.vy = Math.abs(Math.sin(angle) * 3);
            currentBall.x = pegX + Math.cos(angle) * (BALL_RADIUS + 4);
            currentBall.y = pegY + Math.sin(angle) * (BALL_RADIUS + 4);
            hitCount++;
          }
        }
      }

      // Wall bounces
      if (currentBall.x < BALL_RADIUS) {
        currentBall.x = BALL_RADIUS;
        currentBall.vx = Math.abs(currentBall.vx);
      }
      if (currentBall.x > canvasWidth - BALL_RADIUS) {
        currentBall.x = canvasWidth - BALL_RADIUS;
        currentBall.vx = -Math.abs(currentBall.vx);
      }

      // Check if ball reached bottom
      if (currentBall.y > canvasHeight - 40) {
        currentBall.active = false;
        const slotWidth = canvasWidth / slotCount;
        const slotIndex = Math.min(
          slotCount - 1,
          Math.max(0, Math.floor(currentBall.x / slotWidth))
        );
        const mult = multipliers[slotIndex];
        const winAmount = bet * mult;

        if (winAmount > 0) {
          setLastWin(winAmount);
          onBalanceChange(balance - bet + winAmount);
          setMessage(`🎉 Landed on ${mult}x! Won ${winAmount.toFixed(2)}!`);
        } else {
          setMessage('Try again!');
        }

        setDropping(false);

        // Remove ball after a moment
        setTimeout(() => {
          setBalls(prev => prev.filter(b => b.id !== id));
        }, 1000);
      }

      setBalls(prev =>
        prev.map(b => (b.id === id ? { ...currentBall } : b))
      );

      if (currentBall.active) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [dropping, balance, bet, rows, canvasWidth, slotCount, multipliers, onBalanceChange]);

  useEffect(() => {
    drawBoard(balls);
  }, [balls, drawBoard]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const betOptions = [0.5, 1, 2, 5, 10];

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <h2 className="text-3xl font-display font-bold bg-gradient-gold bg-clip-text text-transparent">
        🎯 Plinko
      </h2>

      <div className="bg-casino-card border border-casino-border rounded-2xl p-6 shadow-2xl">
        {/* Canvas */}
        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="rounded-xl bg-casino-darker border border-casino-border"
          />
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

        {/* Row Selector */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-casino-muted text-sm">Rows:</span>
          {[8, 12, 16].map((r) => (
            <button
              key={r}
              onClick={() => !dropping && setRows(r)}
              disabled={dropping}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all
                ${rows === r
                  ? 'bg-casino-gold text-casino-dark'
                  : 'bg-casino-darker text-white border border-casino-border hover:border-casino-gold/50'
                }
                disabled:opacity-50
              `}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Bet Controls */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-casino-muted text-sm">Bet:</span>
          {betOptions.map((amount) => (
            <button
              key={amount}
              onClick={() => !dropping && setBet(amount)}
              disabled={dropping}
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

        {/* Drop Button */}
        <button
          onClick={dropBall}
          disabled={dropping || balance < bet}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all
            bg-gradient-gold text-casino-dark hover:opacity-90
            disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {dropping ? '🎯 Dropping...' : `🎯 DROP BALL (${bet.toFixed(2)})`}
        </button>
      </div>
    </div>
  );
}
