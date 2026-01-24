import React, { useMemo } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import TabPanel from 'components/TabPanel';
import FeaturedMatch from '../FeaturedMatch';
import FeaturedMatchCard from '../FeaturedMatchCard';
import ActiveBetsPanel from 'containers/ActiveBetsPage/Panel';
import BettingHistoryPanel from 'containers/BettingHistoryPage/Panel';
import { RootState } from 'types/state';
import { Game } from 'types/resources/game';
import { FeaturedMatchDTO } from 'types/matches';
import './style.scss';

export interface FeaturedTabsProps {
  featuredMatchDTO: FeaturedMatchDTO | null;
  featuredGame: Game | null;
}

const parsePanelParam = (search: string): 'featured' | 'active' | 'history' => {
  const params = new URLSearchParams(search);
  const p = params.get('panel');
  if (p === 'active') return 'active';
  if (p === 'history') return 'history';
  return 'featured';
};

const FeaturedTabs: React.FC<FeaturedTabsProps> = ({ featuredMatchDTO, featuredGame }) => {
  const location = useLocation();
  const history = useHistory();
  const defaultTab = useMemo(() => parsePanelParam(location.search), [location.search]);
  

  const activeCount = useSelector((s: RootState) => s.wager.activeWagers.length);
  const totalWagers = useSelector((s: RootState) => s.wager.stats.totalWagers);

  const featuredContent = (
    <div className="featured-match-container">
      {featuredMatchDTO ? (
        <FeaturedMatchCard match={featuredMatchDTO} />
      ) : featuredGame ? (
        <FeaturedMatch game={featuredGame} />
      ) : (
        <div className="dashboard-loading">
          <p>No featured match right now.</p>
        </div>
      )}
    </div>
  );

  return (
    <TabPanel
      key={defaultTab}
      defaultTabId={defaultTab}
      className="featured-tabs"
      onTabChange={(tabId) => {
        const params = new URLSearchParams(location.search);
        params.set('panel', tabId);
        history.replace({ pathname: location.pathname, search: params.toString() });
      }}
      tabs={[
        { id: 'featured', label: 'Featured', content: featuredContent },
        { id: 'active', label: 'Active Bets', badgeCount: activeCount, content: <ActiveBetsPanel /> },
        { id: 'history', label: 'Betting History', badgeCount: totalWagers, content: <BettingHistoryPanel /> },
      ]}
    />
  );
};

export default FeaturedTabs;

export {};
