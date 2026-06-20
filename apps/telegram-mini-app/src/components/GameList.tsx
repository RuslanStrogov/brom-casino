import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../lib/api';
import { Dice6, Rocket, Star, Trophy, Coins } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  type: 'slots' | 'crash' | 'dice' | 'roulette' | 'blackjack';
  thumbnail: string;
  minBet: number;
  maxBet: number;
  rtp: number;
  provider: string;
  featured?: boolean;
}

const GAME_ICONS: Record<string, React.ReactNode> = {
  slots: <Coins className="w-8 h-8" />,
  crash: <Rocket className="w-8 h-8" />,
  dice: <Dice6 className="w-8 h-8" />,
  roulette: <Dice6 className="w-8 h-8" />,
  blackjack: <Trophy className="w-8 h-8" />,
};

const GAME_GRADIENTS: Record<string, string> = {
  slots: 'from-purple-600 to-pink-600',
  crash: 'from-green-600 to-emerald-600',
  dice: 'from-blue-600 to-cyan-600',
  roulette: 'from-red-600 to-orange-600',
  blackjack: 'from-amber-600 to-yellow-600',
};

export default function GameList() {
  const navigate = useNavigate();
  const { hapticImpact } = useTelegram();
  const [games, setGames] = React.useState<Game[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>('all');

  React.useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const response = await api.get('/games');
      setGames(response.data.games || getMockGames());
    } catch {
      setGames(getMockGames());
    } finally {
      setLoading(false);
    }
  };

  const getMockGames = (): Game[] => [
    { id: 'slot-1', name: 'Lucky 7s', type: 'slots', thumbnail: '', minBet: 0.1, maxBet: 100, rtp: 96.5, provider: 'BROM', featured: true },
    { id: 'slot-2', name: 'Diamond Rush', type: 'slots', thumbnail: '', minBet: 0.5, maxBet: 200, rtp: 97.2, provider: 'BROM', featured: true },
    { id: 'slot-3', name: 'Neon Fruits', type: 'slots', thumbnail: '', minBet: 0.1, maxBet: 50, rtp: 95.8, provider: 'BROM' },
    { id: 'slot-4', name: 'Crypto Kings', type: 'slots', thumbnail: '', minBet: 1, maxBet: 500, rtp: 96.9, provider: 'BROM' },
    { id: 'crash-1', name: 'Moon Rocket', type: 'crash', thumbnail: '', minBet: 0.1, maxBet: 1000, rtp: 97.0, provider: 'BROM', featured: true },
    { id: 'crash-2', name: 'Turbo Crash', type: 'crash', thumbnail: '', minBet: 0.5, maxBet: 500, rtp: 97.0, provider: 'BROM' },
    { id: 'dice-1', name: 'Dice Roll', type: 'dice', thumbnail: '', minBet: 0.01, maxBet: 100, rtp: 99.0, provider: 'BROM' },
    { id: 'roulette-1', name: 'Euro Roulette', type: 'roulette', thumbnail: '', minBet: 0.1, maxBet: 200, rtp: 97.3, provider: 'BROM' },
    { id: 'blackjack-1', name: 'TON Blackjack', type: 'blackjack', thumbnail: '', minBet: 0.5, maxBet: 300, rtp: 99.5, provider: 'BROM' },
  ];

  const handleGameClick = (game: Game) => {
    hapticImpact('light');
    if (game.type === 'crash') {
      navigate('/games/crash', { state: { game } });
    } else {
      navigate(`/games/slot/${game.id}`, { state: { game } });
    }
  };

  const filteredGames = filter === 'all' ? games : games.filter(g => g.type === filter);
  const featuredGames = games.filter(g => g.featured);
  const categories = ['all', 'slots', 'crash', 'dice', 'roulette', 'blackjack'];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-casino-card rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Featured */}
      {featuredGames.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Star className="w-4 h-4" /> Featured
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {featuredGames.map(game => (
              <button
                key={game.id}
                onClick={() => handleGameClick(game)}
                className="flex-shrink-0 w-36 card-hover btn-press"
              >
                <div className={`bg-gradient-to-br ${GAME_GRADIENTS[game.type]} rounded-xl p-4 h-28 flex flex-col justify-between`}>
                  <div className="text-white/80">{GAME_ICONS[game.type]}</div>
                  <div>
                    <p className="text-white font-bold text-sm text-left">{game.name}</p>
                    <p className="text-white/60 text-xs text-left">RTP {game.rtp}%</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                hapticImpact('light');
                setFilter(cat);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all btn-press ${
                filter === cat
                  ? 'bg-amber-500 text-black'
                  : 'bg-casino-card text-white/70 hover:text-white'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Game Grid */}
      <section>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          {filter === 'all' ? 'All Games' : filter.charAt(0).toUpperCase() + filter.slice(1)}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {filteredGames.map(game => (
            <button
              key={game.id}
              onClick={() => handleGameClick(game)}
              className="card-hover btn-press text-left"
            >
              <div className="bg-casino-card rounded-xl overflow-hidden border border-casino-border">
                <div className={`bg-gradient-to-br ${GAME_GRADIENTS[game.type]} p-4 h-24 flex items-center justify-center`}>
                  <div className="text-white/90">{GAME_ICONS[game.type]}</div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{game.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-white/50">{game.provider}</span>
                    <span className="text-xs text-green-400">{game.rtp}% RTP</span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    {game.minBet} - {game.maxBet} TON
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
