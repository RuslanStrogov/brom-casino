'use client';

import { useState, useCallback } from 'react';

interface BlackjackGameProps {
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

type CardSuit = '♠' | '♥' | '♦' | '♣';
type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: CardSuit;
  rank: CardRank;
  hidden?: boolean;
}

const SUITS: CardSuit[] = ['♠', '♥', '♦', '♣'];
const RANKS: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function getCardValue(card: Card): number {
  if (card.rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

function calculateScore(cards: Card[]): number {
  let score = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.hidden) continue;
    score += getCardValue(card);
    if (card.rank === 'A') aces++;
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

function drawCard(): Card {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  return { suit, rank };
}

export default function BlackjackGame({ balance, onBalanceChange }: BlackjackGameProps) {
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [bet, setBet] = useState(5);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealer' | 'finished'>('betting');
  const [result, setResult] = useState<string | null>(null);
  const [lastWin, setLastWin] = useState<number | null>(null);

  const playerScore = calculateScore(playerCards);
  const dealerScore = calculateScore(dealerCards);

  const startGame = useCallback(() => {
    if (balance < bet) return;
    onBalanceChange(balance - bet);

    const pCards = [drawCard(), drawCard()];
    const dCards = [drawCard(), drawCard()];
    dCards[1].hidden = true;

    setPlayerCards(pCards);
    setDealerCards(dCards);
    setGameState('playing');
    setResult(null);
    setLastWin(null);

    // Check for natural blackjack
    const pScore = calculateScore(pCards);
    if (pScore === 21) {
      dCards[1].hidden = false;
      setDealerCards(dCards);
      if (calculateScore(dCards) === 21) {
        setGameState('finished');
        setResult('Push — both blackjack!');
        onBalanceChange(balance - bet + bet); // return bet
      } else {
        setGameState('finished');
        const win = bet * 2.5;
        setLastWin(win);
        setResult('Blackjack! 3:2 payout!');
        onBalanceChange(balance - bet + win);
      }
    }
  }, [balance, bet, onBalanceChange]);

  const hit = useCallback(() => {
    if (gameState !== 'playing') return;
    const newCard = drawCard();
    const newCards = [...playerCards, newCard];
    setPlayerCards(newCards);
    const score = calculateScore(newCards);
    if (score > 21) {
      setGameState('finished');
      setResult('Bust! You lose.');
    } else if (score === 21) {
      stand(newCards, dealerCards);
    }
  }, [gameState, playerCards, dealerCards]);

  const stand = useCallback((pCards = playerCards, dCards = dealerCards) => {
    if (gameState !== 'playing' && gameState !== 'dealer') return;
    setGameState('dealer');
    const revealed = dCards.map(c => ({ ...c, hidden: false }));
    setDealerCards(revealed);

    const dealerPlay = (cards: Card[], pScore: number): Card[] => {
      let current = [...cards];
      let score = calculateScore(current);
      while (score < 17) {
        current.push(drawCard());
        score = calculateScore(current);
      }
      return current;
    };

    const finalDealer = dealerPlay(revealed, calculateScore(pCards));
    setDealerCards(finalDealer);

    const finalPlayerScore = calculateScore(pCards);
    const finalDealerScore = calculateScore(finalDealer);

    setTimeout(() => {
      setGameState('finished');
      if (finalDealerScore > 21) {
        const win = bet * 2;
        setLastWin(win);
        setResult('Dealer busts! You win!');
        onBalanceChange(balance - bet + win);
      } else if (finalPlayerScore > finalDealerScore) {
        const win = bet * 2;
        setLastWin(win);
        setResult('You win!');
        onBalanceChange(balance - bet + win);
      } else if (finalPlayerScore < finalDealerScore) {
        setResult('Dealer wins.');
      } else {
        setResult('Push!');
        onBalanceChange(balance - bet + bet);
      }
    }, 500);
  }, [gameState, playerCards, dealerCards, bet, balance, onBalanceChange]);

  const doubleDown = useCallback(() => {
    if (gameState !== 'playing' || playerCards.length !== 2 || balance < bet) return;
    onBalanceChange(balance - bet);
    setBet(bet * 2);
    const newCard = drawCard();
    const newCards = [...playerCards, newCard];
    setPlayerCards(newCards);
    const score = calculateScore(newCards);
    if (score > 21) {
      setGameState('finished');
      setResult('Bust! You lose.');
    } else {
      setTimeout(() => stand(newCards, dealerCards), 300);
    }
  }, [gameState, playerCards, balance, bet, dealerCards, onBalanceChange, stand]);

  const newRound = () => {
    setPlayerCards([]);
    setDealerCards([]);
    setGameState('betting');
    setResult(null);
    setLastWin(null);
    setBet(5);
  };

  const betOptions = [1, 5, 10, 25, 50];

  const renderCard = (card: Card, index: number) => (
    <div
      key={index}
      className={`w-16 h-24 rounded-lg border-2 flex flex-col items-center justify-center text-xl font-bold transition-all
        ${card.hidden ? 'bg-casino-gold/20 border-casino-gold/40' : 'bg-white border-gray-300'}
      `}
      style={{
        animation: gameState === 'playing' ? `dealCard 0.3s ease-out ${index * 0.1}s both` : 'none',
      }}
    >
      {card.hidden ? (
        <span className="text-casino-gold text-2xl">?</span>
      ) : (
        <>
          <span className={['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-gray-900'}>
            {card.rank}
          </span>
          <span className={['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-gray-900'}>
            {card.suit}
          </span>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <h2 className="text-3xl font-display font-bold bg-gradient-gold bg-clip-text text-transparent">
        🃏 Blackjack
      </h2>

      <div className="bg-green-900/30 border-2 border-green-700/50 rounded-2xl p-6 w-full max-w-lg">
        {/* Dealer */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-casino-muted text-sm">Dealer</span>
            <span className="text-white font-bold">
              {dealerCards.length > 0 ? (dealerCards.some(c => c.hidden) ? '?' : dealerScore) : '-'}
            </span>
          </div>
          <div className="flex gap-2 justify-center">
            {dealerCards.map((card, i) => renderCard(card, i))}
            {dealerCards.length === 0 && (
              <div className="w-16 h-24 rounded-lg border-2 border-dashed border-green-700/30" />
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-green-700/30 my-4" />

        {/* Player */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-casino-muted text-sm">Player</span>
            <span className="text-white font-bold">
              {playerCards.length > 0 ? playerScore : '-'}
            </span>
          </div>
          <div className="flex gap-2 justify-center">
            {playerCards.map((card, i) => renderCard(card, i))}
            {playerCards.length === 0 && (
              <div className="w-16 h-24 rounded-lg border-2 border-dashed border-green-700/30" />
            )}
          </div>
        </div>

        {/* Result */}
        <div className="h-8 text-center mb-4">
          {result && (
            <span className={`font-bold text-lg ${lastWin ? 'text-casino-gold' : 'text-casino-muted'}`}>
              {result} {lastWin && `(+${lastWin.toFixed(2)})`}
            </span>
          )}
        </div>

        {/* Controls */}
        {gameState === 'betting' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-casino-muted text-sm">Bet:</span>
              {betOptions.map(amount => (
                <button
                  key={amount}
                  onClick={() => setBet(amount)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all
                    ${bet === amount
                      ? 'bg-gradient-gold text-casino-dark'
                      : 'bg-casino-darker text-white border border-casino-border hover:border-casino-gold/50'
                    }
                  `}
                >
                  {amount}
                </button>
              ))}
            </div>
            <button
              onClick={startGame}
              disabled={balance < bet}
              className="w-full py-3 rounded-xl font-bold text-lg transition-all
                bg-gradient-gold text-casino-dark hover:opacity-90
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deal ({bet.toFixed(2)})
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex gap-3">
            <button
              onClick={hit}
              className="flex-1 py-3 rounded-xl font-bold transition-all
                bg-blue-600 text-white hover:bg-blue-500 active:scale-95"
            >
              Hit
            </button>
            <button
              onClick={() => stand()}
              className="flex-1 py-3 rounded-xl font-bold transition-all
                bg-red-600 text-white hover:bg-red-500 active:scale-95"
            >
              Stand
            </button>
            {playerCards.length === 2 && balance >= bet && (
              <button
                onClick={doubleDown}
                className="flex-1 py-3 rounded-xl font-bold transition-all
                  bg-yellow-600 text-white hover:bg-yellow-500 active:scale-95"
              >
                2x
              </button>
            )}
          </div>
        )}

        {gameState === 'dealer' && (
          <div className="text-center text-casino-muted">Dealer playing...</div>
        )}

        {gameState === 'finished' && (
          <button
            onClick={newRound}
            className="w-full py-3 rounded-xl font-bold text-lg transition-all
              bg-gradient-gold text-casino-dark hover:opacity-90 active:scale-95"
          >
            New Hand
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes dealCard {
          from { opacity: 0; transform: translateY(-20px) rotate(-5deg); }
          to { opacity: 1; transform: translateY(0) rotate(0); }
        }
      `}</style>
    </div>
  );
}
