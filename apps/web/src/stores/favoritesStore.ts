'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteGame {
  id: string;
  name: string;
  emoji?: string;
  category?: string;
  provider?: string;
  slug?: string;
}

interface FavoritesState {
  favorites: FavoriteGame[];
  toggleFavorite: (game: FavoriteGame) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (game: FavoriteGame) => {
        const exists = get().favorites.find((f) => f.id === game.id);
        if (exists) {
          set({ favorites: get().favorites.filter((f) => f.id !== game.id) });
        } else {
          set({ favorites: [game, ...get().favorites] });
        }
      },
      isFavorite: (id: string) => {
        return get().favorites.some((f) => f.id === id);
      },
    }),
    { name: 'brom-favorites' }
  )
);

interface RecentGame {
  id: string;
  name: string;
  emoji?: string;
  slug?: string;
  timestamp: number;
}

interface RecentState {
  recents: RecentGame[];
  addRecent: (game: RecentGame) => void;
}

export const useRecentStore = create<RecentState>()(
  persist(
    (set, get) => ({
      recents: [],
      addRecent: (game: RecentGame) => {
        const filtered = get().recents.filter((r) => r.id !== game.id);
        set({ recents: [{ ...game, timestamp: Date.now() }, ...filtered].slice(0, 20) });
      },
    }),
    { name: 'brom-recents' }
  )
);