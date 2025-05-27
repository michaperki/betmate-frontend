import { useEffect, useState } from 'react';
import { Game } from 'types/resources/game';
import { User } from 'types/resources/auth';

export interface DashboardStats {
  totalWagers: number;
  winRate: number;
  currentBalance: number;
  activeMatches: number;
}

export const useDashboardData = (games: Game[], user: User | null) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalWagers: 0,
    winRate: 0,
    currentBalance: user?.account || 0, // Use real user balance
    activeMatches: 0,
  });

  const [featuredGame, setFeaturedGame] = useState<Game | null>(null);

  useEffect(() => {
    if (games.length === 0) return;

    // Find featured game (highest rating)
    const gameRating = (game: Game) => game.player_black.elo + game.player_white.elo;
    const featured = games.reduce((top, game) => 
      gameRating(top) > gameRating(game) ? top : game
    );

    setFeaturedGame(featured);

    // Calculate stats
    setStats(prev => ({
      ...prev,
      activeMatches: games.length,
      currentBalance: user?.account || 0, // Update balance when user changes
      // TODO: Integrate with actual user stats from backend
    }));
  }, [games, user]);

  return {
    stats,
    featuredGame,
    regularGames: games.filter(g => g !== featuredGame),
  };
};