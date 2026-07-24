'use client';

import { useFavoritesStore } from '@/stores/favoritesStore';
import { useI18n } from '@/i18n/I18nProvider';

interface NarrowGameCardProps {
  name: string;
  slug?: string;
  gameId?: string;
  provider?: string;
  imageUrl?: string;
  color?: string;
  playingCount?: number;
  onClick: () => void;
}

export function NarrowGameCard({
  name,
  slug,
  gameId,
  provider,
  imageUrl,
  color = '#ff2d95',
  playingCount,
  onClick,
}: NarrowGameCardProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { t } = useI18n();
  const liked = gameId ? isFavorite(gameId) : false;

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameId && slug) {
      toggleFavorite({ id: gameId, name, slug, provider, emoji: '' });
    }
  };

  const imgSrc = imageUrl || `/games/${slug}.svg`;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col rounded-xl overflow-hidden
        transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]
        w-full animate-fade-up bg-[#0a0a1a] border border-white/5
        hover:border-[var(--neon-color)]/50"
      style={{ '--neon-color': color } as React.CSSProperties}
    >
      {/* Cover Image — 1.5x taller */}
      <div className="relative w-full aspect-[4/4.5] overflow-hidden">
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        {/* Gradient overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, ${color}30, transparent)`,
          }}
        />
        {/* Favorite button */}
        {gameId && (
          <button
            onClick={handleFavorite}
            className="absolute top-1.5 right-1.5 p-1.5 rounded-full z-10
              transition-all hover:scale-110 bg-black/40 backdrop-blur-sm"
            aria-label={liked ? t('game.favoriteRemove') : t('game.favoriteAdd')}
          >
            <svg
              className={`w-3.5 h-3.5 transition-all ${
                liked
                  ? 'text-miami-pink drop-shadow-[0_0_6px_rgba(255,45,149,0.6)]'
                  : 'text-gray-400 group-hover:text-gray-200'
              }`}
              viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
        )}

        {/* Играют (X) badge */}
        {playingCount && playingCount > 0 && (
          <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-miami-green animate-pulse" />
            <span className="text-[10px] font-medium text-white/90">{t('game.playingCount').replace('{count}', playingCount.toString())}</span>
          </div>
        )}
      </div>

      {/* Game Name */}
      <div className="px-2.5 py-2.5">
        <h3
          className="text-xs font-heading font-bold text-white truncate text-center
            group-hover:text-[var(--neon-color)] transition-colors duration-300"
        >
          {name}
        </h3>
      </div>
    </button>
  );
}