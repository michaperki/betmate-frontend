import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'featured' | 'active' | 'history'>(defaultTab);
  const [featuredHeight, setFeaturedHeight] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

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

  // Measure featured card height when visible (or on demand)
  useEffect(() => {
    const measure = () => {
      const root = wrapperRef.current;
      if (!root) return;
      const el = root.querySelector('.featured-match-container') as HTMLElement | null;
      if (el) {
        const h = Math.round(el.getBoundingClientRect().height);
        if (Number.isFinite(h) && h > 0) setFeaturedHeight(h);
      }
    };
    if (activeTab === 'featured') {
      // next tick to allow layout
      const id = requestAnimationFrame(measure);
      window.addEventListener('resize', measure);
      return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); };
    }
    return;
  }, [activeTab, featuredMatchDTO, featuredGame]);

  return (
    <div className="featured-tabs" ref={wrapperRef} style={{ ['--featured-height' as any]: featuredHeight ? `${featuredHeight}px` : undefined }}>
      <TabPanel
        key={defaultTab}
        defaultTabId={defaultTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId as any);
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
    </div>
  );
};

export default FeaturedTabs;

export {};
