'use client';

interface GameCardProps {
  name: string;
  emoji: string;
  description: string;
  onClick: () => void;
  color?: string;
  provider?: string;
  rtp?: number;
  isLive?: boolean;
}

export function GameCard({ name, emoji, description, onClick, color, provider, rtp, isLive }: GameCardProps) {
  const neonColor = color || '#ff2d95';

  return (
    <button
      onClick={onClick}
      className="group relative glass-card rounded-2xl p-6 text-left
        transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden w-full animate-fade-up"
      style={{
        '--neon-color': neonColor,
      } as React.CSSProperties}
    >
      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${neonColor}15, transparent)`,
        }}
      />

      <div className="relative z-10">
        {/* Icon */}
        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
          {emoji}
        </div>

        {/* Title */}
        <h3
          className="text-xl font-heading font-bold text-white mb-2 transition-colors duration-300 group-hover:text-[var(--neon-color)]"
        >
          {name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-4">
          {description}
        </p>

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
          <span>Play Now</span>
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