'use client';

import { create } from 'zustand';

interface GameResult {
  id: string;
  game: string;
  bet: number;
  winAmount: number;
  multiplier?: number;
  result?: Record<string, unknown>;
  timestamp: number;
}

interface GameState {
  gameHistory: GameResult[];
  currentGame: string | null;
  isPlaying: boolean;
  lastResult: GameResult | null;
  clientSeed: string;
  serverHash: string;
  addGameResult: (result: GameResult) => void;
  setCurrentGame: (game: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setSeeds: (clientSeed: string, serverHash: string) => void;
  clearHistory: () => void;
  getGameStats: (game: string) => { totalBets: number; totalWins: number; totalWagered: number };
}

export const useGameStore = create<GameState>((set, get) => ({
  gameHistory: [],
  currentGame: null,
  isPlaying: false,
  lastResult: null,
  clientSeed: '',
  serverHash: '',

  addGameResult: (result) =>
    set((state) => ({
      gameHistory: [result, ...state.gameHistory].slice(0, 100),
      lastResult: result,
      isPlaying: false,
    })),

  setCurrentGame: (game) =>
    set({ currentGame: game, isPlaying: game !== null }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setSeeds: (clientSeed, serverHash) => set({ clientSeed, serverHash }),

  clearHistory: () => set({ gameHistory: [], lastResult: null }),

  getGameStats: (game: string) => {
    const { gameHistory } = get();
    const gameResults = gameHistory.filter((g) => g.game === game);
    return {
      totalBets: gameResults.length,
      totalWins: gameResults.filter((g) => g.winAmount > 0).length,
      totalWagered: gameResults.reduce((sum, g) => sum + g.bet, 0),
    };
  },
}));
