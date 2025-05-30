import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Game } from 'types/resources/game';
import { User } from 'types/resources/auth';
import { fetchUserBettingStats } from 'store/actionCreators/wagerActionCreators';
import { RootState } from 'types/state';

export interface DashboardStats {
  totalWagers: number;
  winRate: number;
  currentBalance: number;
  activeMatches: number;
}

export const useDashboardData = (games: Game[], user: User | null) => {
  const dispatch = useDispatch();
  const userBettingStats = useSelector((state: RootState) => state.wager.stats);

  const [stats, setStats] = useState<DashboardStats>({
    totalWagers: 0,
    winRate: 0,
    currentBalance: user?.account || 0,
    activeMatches: 0,
  });

  const [featuredGame, setFeaturedGame] = useState<Game | null>(null);
  const prevGamesLength = useRef(games.length);

  // Fetch user betting stats on mount and when user changes
  useEffect(() => {
    if (user) {
      dispatch(fetchUserBettingStats());
    }
  }, [dispatch, user]);

  // Track games changes
  useEffect(() => {
    if (prevGamesLength.current !== games.length) {
      prevGamesLength.current = games.length;
    }
  }, [games]);

  // Update stats when any of the dependencies change
  useEffect(() => {
    // Handle empty games array
    if (games.length === 0) {
      setFeaturedGame(null);
      setStats(prev => ({
        ...prev,
        activeMatches: 0,
        currentBalance: user?.account || 0,
      }));
      return;
    }

    // Find featured game (highest rating)
    const gameRating = (game: Game) => game.player_black.elo + game.player_white.elo;
    const featured = games.reduce((top, game) =>
      gameRating(top) > gameRating(game) ? top : game
    );

    setFeaturedGame(featured);

    // Calculate stats from real backend data
    setStats({
      totalWagers: userBettingStats?.totalWagers || 0,
      winRate: userBettingStats?.winRate || 0,
      currentBalance: user?.account || 0,
      activeMatches: games.length,
    });
  }, [games, user, userBettingStats]);

  // Also listen for game_ended events directly in this hook
  useEffect(() => {
    const handleGameEnd = () => {
      // When a game ends, refresh betting stats
      if (user) {
        dispatch(fetchUserBettingStats());
      }
    };

    window.addEventListener('game_ended', handleGameEnd);
    return () => window.removeEventListener('game_ended', handleGameEnd);
  }, [dispatch, user]);

  return {
    stats,
    featuredGame,
    regularGames: games.filter(g => g !== featuredGame),
  };
};