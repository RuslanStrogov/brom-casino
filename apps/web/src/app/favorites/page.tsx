'use client';

import { useRouter } from 'next/navigation';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';
// In-house game mapping
const IN_HOUSE_GAMES = [
  { id: 'slots', nameKey: 'game.slots', emoji: '🎰', slug: 'slots', component: 'slots' },
  { id: 'crash', nameKey: 'game.crash', emoji: '🚀', slug: 'crash', component: 'crash' },
  { id: 'dice', nameKey: 'game.dice', emoji: '🎲', slug: 'dice', component: 'dice' },
  { id: 'plinko', nameKey: 'game.plinko', emoji: '🎯', slug: 'plinko', component: 'plinko' },
  { id: 'roulette', nameKey: 'game.roulette', emoji: '🎡', slug: 'roulette', component: 'roulette' },
  { id: 'blackjack', nameKey: 'game.blackjack', emoji: '🃏', slug: 'blackjack', component: 'blackjack' },
];

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { favorites, toggleFavorite } = useFavoritesStore();
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      {/* Header section */}
      <section className="relative overflow-hidden pt-20 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,45,149,0.12),transparent_70%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-heading font-bold bg-gradient-to-r from-miami-pink via-miami-purple to-miami-cyan bg-clip-text text-transparent mb-3">
              ❤️ {t('favorites.title')}
            </h1>
            <p className="text-gray-400 text-sm md:text-lg max-w-xl mx-auto">
              {t('favorites.section')} — {t('favorites.recent')}
            </p>
          </div>
        </div>
      </section>

      {/* Favorites grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-16">
        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-xl font-heading font-bold text-white mb-2">{t('favorites.empty')}</h3>
            <p className="text-gray-500 mb-8">
              {t('favorites.loginPrompt')}
            </p>
            <button
              onClick={() => router.push('/games')}
              className="btn-miami-primary"
            >
              🎮 {t('favorites.findGames')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {favorites.map((game) => {
              const inHouse = IN_HOUSE_GAMES?.find((g: any) => g.id === game.id);
              return (
                <div key={game.id} className="relative group">
                  <button
                    onClick={() => {
                      if (isAuthenticated && inHouse) {
                        router.push(`/games/${inHouse.component || inHouse.slug}`);
                      } else if (game.slug) {
                        router.push(`/games/${game.slug}`);
                      } else {
                        router.push('/games');
                      }
                    }}
                    className="w-full glass-card rounded-xl p-3 md:p-4 hover:scale-[1.03] transition-all duration-300 text-center"
                  >
                    <div className="text-3xl md:text-4xl mb-2">{game.emoji || '🎮'}</div>
                    <h3 className="text-xs md:text-sm font-bold text-white truncate">
                      {inHouse ? t(inHouse.nameKey) : game.name}
                    </h3>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(game);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-all z-10"
                    aria-label={t('game.favoriteRemove')}
                  >
                    <svg className="w-3.5 h-3.5 text-miami-pink" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}