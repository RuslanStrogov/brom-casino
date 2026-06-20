'use client';

interface GameCardProps {
  name: string;
  emoji: string;
  description: string;
  onClick: () => void;
}

export function GameCard({ name, emoji, description, onClick }: GameCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-casino-card border border-casino-border rounded-2xl p-6 text-left
        transition-all duration-300 hover:border-casino-gold/50 hover:shadow-lg hover:shadow-casino-gold/10
        hover:-translate-y-1 active:scale-[0.98] overflow-hidden"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-casino-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10">
        {/* Icon */}
        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
          {emoji}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-casino-gold transition-colors">
          {name}
        </h3>

        {/* Description */}
        <p className="text-sm text-casino-muted mb-4">
          {description}
        </p>

        {/* Play button */}
        <div className="flex items-center gap-2 text-casino-gold text-sm font-medium">
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
        <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-casino-gold/10 to-transparent" />
      </div>
    </button>
  );
}
