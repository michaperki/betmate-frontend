import React, { useEffect } from 'react';
import { fetchGamesByStatus, clearGames } from 'store/actionCreators/gameActionCreators';
import { Game } from 'types/resources/game';
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

  useEffect(() => {
    props.clearGames();
    props.fetchGamesByStatus(['not_started', 'in_progress']);
  }, []);

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