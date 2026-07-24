'use client';

import { useFavoritesStore, FavoriteGame } from '@/stores/favoritesStore';
import { useRecentStore } from '@/stores/favoritesStore';
import { useI18n } from '@/i18n/I18nProvider';

interface GameCardProps {
  name: string;
  emoji: string;
  description: string;
  onClick: () => void;
  color?: string;
  provider?: string;
  rtp?: number;
  isLive?: boolean;
  gameId?: string;
  slug?: string;
}

export function GameCard({
  name,
  emoji,
  description,
  onClick,
  color,
  provider,
  rtp,
  isLive,
  gameId,
  slug,
}: GameCardProps) {
  const neonColor = color || '#ff2d95';
  const { favorites, toggleFavorite, isFavorite } = useFavoritesStore();
  const { addRecent } = useRecentStore();
  const { t } = useI18n();
  const liked = gameId ? isFavorite(gameId) : false;

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameId) {
      toggleFavorite({
        id: gameId,
        name,
        emoji,
        slug,
        provider,
      });
    }
  };

  const handleClick = () => {
    if (gameId) {
      addRecent({ id: gameId, name, emoji, slug, timestamp: Date.now() });
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="group relative glass-card rounded-2xl p-6 text-left
        transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden w-full animate-fade-up"
      style={
        {
          '--neon-color': neonColor,
        } as React.CSSProperties
      }
    >
      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${neonColor}15, transparent)`,
        }}
      />

      <div className="relative z-10">
        {/* Favorite heart button */}
        {gameId && (
          <button
            onClick={handleFavorite}
            className="absolute -top-1 -right-1 p-2 rounded-full z-20 transition-all hover:scale-110"
            aria-label={liked ? t('game.favoriteRemove', 'Remove from favorites') : t('game.favoriteAdd', 'Add to favorites')}
          >
            <svg
              className={`w-5 h-5 transition-all ${
                liked ? 'text-miami-pink drop-shadow-[0_0_8px_rgba(255,45,149,0.6)]' : 'text-gray-500 group-hover:text-gray-300'
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

        {/* Icon */}
        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
          {emoji}
        </div>

        {/* Title */}
        <h3 className="text-xl font-heading font-bold text-white mb-2 transition-colors duration-300 group-hover:text-[var(--neon-color)]">
          {name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-4">{description}</p>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {provider && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-miami-purple/20 text-miami-purple border border-miami-purple/30">
              {provider}
            </span>
          )}
          {rtp && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-miami-cyan/20 text-miami-cyan border border-miami-cyan/30">
              RTP {rtp}%
            </span>
          )}
          {isLive && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-miami-pink/20 text-miami-pink border border-miami-pink/30">
              LIVE
            </span>
          )}
        </div>

        {/* Play button */}
        <div
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: neonColor }}
        >
          <span>{t('game.playNow', 'Play Now')}</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-8 h-8"
          style={{
            background: `linear-gradient(225deg, ${neonColor}20, transparent)`,
          }}
        />
      </div>
    </button>
  );
}