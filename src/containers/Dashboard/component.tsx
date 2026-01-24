import React, { useEffect, useCallback, useRef } from 'react';
import { fetchGamesByStatus, clearGames } from 'store/actionCreators/gameActionCreators';
import { Game, GameStatus } from 'types/resources/game';
import { User } from 'types/resources/auth';
import Leaderboard from 'components/Leaderboard';
import { useTheme } from 'context/ThemeContext';
import Card from 'components/Card/component';

// New mobile-first dashboard components
// Option A components
import SnapSummary from './components/SnapSummary/component';
import StatsTiles from './components/StatsTiles/component';
import FeaturedTabs from './components/FeaturedTabs';
import MatchDetailsDrawer from './components/MatchDetailsDrawer';
import LiveMatchesGrid from './components/LiveMatchesGrid';
import FilterBar from './components/FilterBar';

// Custom hooks
import { useDashboardData } from 'hooks/useDashboardData';
import { FeaturedMatchDTO } from 'types/matches';
import { getFeaturedMatch } from 'store/requests/matchesRequests';
import { useRouteMatch } from 'react-router-dom';
import { useFilterState } from 'hooks/useFilterState';
import { useResponsiveLayout } from 'hooks/useResponsiveLayout';

import './style.scss';

export interface DashboardProps {
  fetchGamesByStatus: typeof fetchGamesByStatus;
  clearGames: typeof clearGames;
  games: Game[];
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { theme } = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();
  const { stats, featuredGame, regularGames } = useDashboardData(props.games, props.user);
  const [featuredMatchDTO, setFeaturedMatchDTO] = React.useState<FeaturedMatchDTO | null>(null);
  const matchRoute = useRouteMatch<{ id: string }>('/matches/:id');
  const {
    filters,
    filteredGames,
    setTimeFilter,
    setRatingFilter,
    clearFilters
  } = useFilterState(regularGames);

  // For tracking game counts
  const prevGamesCountRef = useRef(props.games.length);

  // Function to check if any games are complete (not memoized to avoid dependency loops)
  const hasCompletedGame = () => {
    return props.games.some(game =>
      game.complete ||
      game.game_status !== 'not_started' && game.game_status !== 'in_progress'
    );
  };

  // Create a memoized refresh function to avoid dependency issues
  const refreshGames = useCallback(() => {
    props.clearGames();
    props.fetchGamesByStatus(['not_started', 'in_progress']);
  }, [props.clearGames, props.fetchGamesByStatus]);

  // Initial load
  useEffect(() => {
    refreshGames();

    return () => {
      // Cleanup on unmount
    };
  }, [refreshGames]);

  // Fetch featured match DTO (card redesign data)
  useEffect(() => {
    let mounted = true;
    const fetchFeatured = async () => {
      try {
        const resp = await getFeaturedMatch();
        if (mounted) setFeaturedMatchDTO(resp.data);
      } catch {
        if (mounted) setFeaturedMatchDTO(null);
      }
    };
    fetchFeatured();
    const interval = setInterval(fetchFeatured, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Update the ref when props.games changes
  useEffect(() => {
    // Track games count changes
    const prevLength = prevGamesCountRef.current;
    prevGamesCountRef.current = props.games.length;
  }, [props.games.length]);

  // Run ONCE after games load to check for any completed games
  useEffect(() => {
    // Skip if no games
    if (props.games.length === 0) return;

    // One-time check for completed games
    if (hasCompletedGame()) {
      refreshGames();
    }
  }, [refreshGames, props.games.length]);

  // Listen for game end events and refresh the dashboard
  useEffect(() => {
    const handleGameEnd = (event: CustomEvent<any>) => {
      // Small delay to ensure any server-side state is updated
      setTimeout(() => {
        refreshGames();
      }, 500);
    };

    // Add event listener for our custom game_ended event
    window.addEventListener('game_ended', handleGameEnd as EventListener);

    // Fallback - check every 60 seconds if we need to refresh
    const intervalId = setInterval(() => {
      refreshGames();
    }, 60000); // Refresh every minute as a fallback

    // Cleanup on unmount
    return () => {
      window.removeEventListener('game_ended', handleGameEnd as EventListener);
      clearInterval(intervalId);
    };
  }, [refreshGames]);

  // Sort filtered games by time (newest first)
  const sortedFilteredGames = filteredGames.sort((gameA, gameB) => {
    const timeA = new Date(gameA.created_at).getTime();
    const timeB = new Date(gameB.created_at).getTime();
    return timeB - timeA;
  });

  if (props.games.length === 0) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Option A: Snap Summary + Quick Actions (mobile re-ordered below) */}
        <SnapSummary userName={props.user?.first_name || 'Player'} stats={stats} />

        {/* Main Content Area */}
        <div className="dashboard-main">
          
          {/* Featured/Active/History Tabs (controls only this section) */}
          <FeaturedTabs featuredMatchDTO={featuredMatchDTO} featuredGame={featuredGame || null} />

          {/* Stats Tiles */}
          <Card>
            <StatsTiles />
          </Card>

          {/* Leaderboard (condensed) */}
          <div className="leaderboard-container">
            <Leaderboard />
          </div>

          {/* Live Matches Section */}
          <div className="dashboard-matches-section">

            {/* Filter Bar */}
            <div className="filter-section">
              <FilterBar
                filters={filters}
                onTimeFilterChange={setTimeFilter}
                onRatingFilterChange={setRatingFilter}
                onClearFilters={clearFilters}
                totalCount={regularGames.length}
                filteredCount={sortedFilteredGames.length}
              />
            </div>

            {/* Live Matches Grid */}
            <LiveMatchesGrid
              games={sortedFilteredGames}
              isLoading={false}
              featuredGame={featuredGame || undefined}
            />
          </div>

        </div>
      </div>
      {matchRoute && <MatchDetailsDrawer />}
    </div>
  );
};

export default Dashboard;
