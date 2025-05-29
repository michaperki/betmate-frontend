import React, { useEffect, useCallback, useRef } from 'react';
import { fetchGamesByStatus, clearGames } from 'store/actionCreators/gameActionCreators';
import { Game, GameStatus } from 'types/resources/game';
import { User } from 'types/resources/auth';
import Leaderboard from 'components/Leaderboard';

// New mobile-first dashboard components
import HeroSection from './components/HeroSection';
import QuickStatsBar from './components/QuickStatsBar';
import FeaturedMatch from './components/FeaturedMatch';
import LiveMatchesGrid from './components/LiveMatchesGrid';
import FilterBar from './components/FilterBar';

// Custom hooks
import { useDashboardData } from 'hooks/useDashboardData';
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
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();
  const { stats, featuredGame, regularGames } = useDashboardData(props.games, props.user);
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
        {/* Hero Section with greeting and balance */}
        <HeroSection
          userName={props.user?.first_name || "Player"}
          stats={stats}
        />

        {/* Quick Stats Bar */}
        <QuickStatsBar stats={stats} />

        {/* Main Content Area */}
        <div className="dashboard-main">
          
          {/* Featured Game and Leaderboard Section */}
          <div className="dashboard-featured-section">
            {featuredGame && (
              <div className="featured-match-container">
                <FeaturedMatch game={featuredGame} />
              </div>
            )}
            
            {/* Leaderboard - responsive positioning */}
            <div className="leaderboard-container">
              <Leaderboard />
            </div>
          </div>

          {/* Live Matches Section */}
          <div className="dashboard-matches-section">
            
            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              onTimeFilterChange={setTimeFilter}
              onRatingFilterChange={setRatingFilter}
              onClearFilters={clearFilters}
              totalCount={regularGames.length}
              filteredCount={sortedFilteredGames.length}
            />

            {/* Live Matches Grid */}
            <LiveMatchesGrid 
              games={sortedFilteredGames}
              isLoading={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;