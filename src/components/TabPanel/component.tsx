import React, { useCallback, useMemo, useState } from 'react';
import './dark-style.scss'; // Use the new dark mobile-first styling

interface TabPanelProps {
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode;
    badgeCount?: number;
  }[];
  defaultTabId?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
  style?: React.CSSProperties;
}

const TabPanel: React.FC<TabPanelProps> = ({
  tabs,
  defaultTabId,
  className = '',
  onTabChange,
  style,
}) => {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || (tabs.length > 0 ? tabs[0].id : ''));

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    if (onTabChange) onTabChange(tabId);
  }, [onTabChange]);

  // If no tabs, render nothing
  if (tabs.length === 0) return null;

  // Find the active tab content
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  const tabIds = useMemo(() => tabs.map(t => t.id), [tabs]);
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'ArrowRight') {
      const next = (idx + 1) % tabIds.length;
      handleTabClick(tabIds[next]);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      const prev = (idx - 1 + tabIds.length) % tabIds.length;
      handleTabClick(tabIds[prev]);
      e.preventDefault();
    }
  }, [tabIds, handleTabClick]);

  return (
    <div className={`tab-panel ${className}`} style={style}>
      <div className="tab-header" role="tablist" aria-label="Section tabs">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab-button ${activeTabId === tab.id ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTabId === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(e) => onKeyDown(e, idx)}
          >
            <span>{tab.label}</span>
            {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
              <span className="tab-badge">{tab.badgeCount}</span>
            )}
          </button>
        ))}
      </div>
      <div
        className="tab-content"
        id={`tabpanel-${activeTab.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab.id}`}
      >
        {activeTab.content}
      </div>
    </div>
  );
};

export default TabPanel;
