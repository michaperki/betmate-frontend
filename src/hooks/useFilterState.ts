import { useState, useMemo } from 'react';
import { Game } from 'types/resources/game';

export type TimeFilter = 'all' | 'starting_soon' | 'live' | 'ending_soon';
export type RatingFilter = 'all' | 'beginner' | 'intermediate' | 'master';

export interface FilterState {
  timeFilter: TimeFilter;
  ratingFilter: RatingFilter;
}

export const useFilterState = (games: Game[]) => {
  const [filters, setFilters] = useState<FilterState>({
    timeFilter: 'all',
    ratingFilter: 'all',
  });

  const filteredGames = useMemo(() => {
    return games.filter(game => {
      // Time-based filtering
      if (filters.timeFilter !== 'all') {
        const gameTime = new Date(game.created_at).getTime();
        const now = Date.now();
        const timeDiff = now - gameTime;

        switch (filters.timeFilter) {
          case 'starting_soon':
            // Games starting within 10 minutes
            if (game.game_status !== 'not_started' || timeDiff > 10 * 60 * 1000) return false;
            break;
          case 'live':
            if (game.game_status !== 'in_progress') return false;
            break;
          case 'ending_soon':
            // Games that have been running for more than 20 minutes
            if (game.game_status !== 'in_progress' || timeDiff < 20 * 60 * 1000) return false;
            break;
        }
      }

      // Rating-based filtering
      if (filters.ratingFilter !== 'all') {
        const avgRating = (game.player_black.elo + game.player_white.elo) / 2;
        
        switch (filters.ratingFilter) {
          case 'beginner':
            if (avgRating > 1400) return false;
            break;
          case 'intermediate':
            if (avgRating <= 1400 || avgRating > 1800) return false;
            break;
          case 'master':
            if (avgRating <= 1800) return false;
            break;
        }
      }

      return true;
    });
  }, [games, filters]);

  const setTimeFilter = (timeFilter: TimeFilter) => {
    setFilters(prev => ({ ...prev, timeFilter }));
  };

  const setRatingFilter = (ratingFilter: RatingFilter) => {
    setFilters(prev => ({ ...prev, ratingFilter }));
  };

  const clearFilters = () => {
    setFilters({ timeFilter: 'all', ratingFilter: 'all' });
  };

  return {
    filters,
    filteredGames,
    setTimeFilter,
    setRatingFilter,
    clearFilters,
  };
};