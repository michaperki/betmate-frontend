import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { logger } from 'utils';
import { useMode } from 'context/ModeContext';
import { createBackendAxiosRequest } from 'store/requests';
import { getBearerToken, getBearerTokenHeader } from 'store/actionCreators';
import { getFeaturedMatch } from 'store/requests/matchesRequests';

import './style.scss';

type StepId =
  | 'intro-dashboard'
  | 'dashboard-join-game'
  | 'goto-chess'
  | 'chess-viewer'
  | 'chess-currency-toggle'
  | 'chess-player-header'
  | 'chess-move-predictions'
  | 'chess-outcomes'
  | 'chess-receipts'
  | 'complete';

type Step = {
  id: StepId;
  title: string;
  body: string | ((username?: string) => string);
  anchor?: string; // data-tour-id value
  route?: string; // target route (optional)
  autoAdvance?: boolean; // advance automatically when route/anchor satisfied
  advanceOnAnchorClick?: boolean; // attach one-off click to anchor to advance
  globalStep?: number; // global step number across routes
};

interface OnboardingStatusResponse {
  versionSeen: number;
  currentVersion: number;
}

const CURRENT_VERSION = 1;

const LOCAL_KEY = 'betmate:onboarding_version_seen';
const TOUR_ACTIVE_KEY = 'betmate:tour_active';

  // Total number of steps in the complete tour
  // Dashboard (2) + Chess (6 including complete) = 8
  const TOTAL_STEPS = 8;

const stepsForRoute = (route: string): Step[] => {
  if (route.startsWith('/chess/')) {
    return [
      { id: 'chess-viewer', title: 'BetMate Game Viewer', body: 'This is the BetMate Game Viewer.', anchor: 'game-viewer', globalStep: 3 },
      { id: 'chess-currency-toggle', title: 'Toggle Currency', body: 'Switch between Cash (real USD) and K-Bits (arcade tokens). Your balance, wagers, and payouts reflect the selected mode.', anchor: 'currency-toggle', advanceOnAnchorClick: true, globalStep: 4 },
      { id: 'chess-player-header', title: 'Bet on a Player', body: 'Tap the White player header to bet on White winning the game.', anchor: 'white-player-header', advanceOnAnchorClick: true, globalStep: 5 },
      { id: 'chess-move-predictions', title: 'Move Predictions', body: 'Preview potential next moves. Tap a move tile to place a bet on it.', anchor: 'move-tiles', advanceOnAnchorClick: true, globalStep: 6 },
      { id: 'chess-outcomes', title: 'Outcome Wagers', body: 'On the right side, you can bet on game outcomes including draws and wins.', anchor: 'outcome-wagers', advanceOnAnchorClick: true, globalStep: 7 },
      { id: 'complete', title: "You're all set!", body: "Have fun and bet responsibly.", globalStep: 8 },
    ];
  }
  // Dashboard with Feature Match card highlight
  return [
    { id: 'intro-dashboard', title: 'Welcome to BetMate', body: `Let's take a quick tour of the platform.`, globalStep: 1 },
    { id: 'dashboard-join-game', title: 'Featured Match', body: 'This match card shows a live game being streamed from Lichess. Click the "Join Game" button to start betting on moves and outcomes.', anchor: 'match-card', advanceOnAnchorClick: true, globalStep: 2 },
  ];
};

const findAnchorEl = (anchor?: string): HTMLElement | null => {
  if (!anchor) return null;
  try {
    return document.querySelector(`[data-tour-id="${anchor}"]`) as HTMLElement | null;
  } catch { return null; }
};

const highlight = (el: HTMLElement | null, on: boolean) => {
  if (!el) return;
  if (on) el.classList.add('tour-highlight');
  else el.classList.remove('tour-highlight');
};

type Rect = { top: number; left: number; width: number; height: number };
type BubblePos = { top: number; left: number; side: 'top' | 'bottom' | 'left' | 'right' };

const OnboardingTour: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [maskRect, setMaskRect] = useState<Rect | null>(null);
  const [bubblePos, setBubblePos] = useState<BubblePos | null>(null);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const lastAnchorRef = useRef<HTMLElement | null>(null);

  const isAuthenticated = Boolean(getBearerToken());
  const { onboardingEnabled } = useMode();
  // Allow explicit override via ?tour=1 even if onboarding is disabled for signed-in users
  const forceParam = useMemo(() => {
    try {
      const param = new URLSearchParams(window.location.search).get('tour');
      logger.info('onboarding_force_param', 'Checking tour force parameter', { param });
      return param === '1';
    } catch (e) {
      logger.warn('onboarding_force_param_error', 'Error parsing tour force parameter', { error: String(e) });
      return false;
    }
  }, [typeof window === 'undefined' ? '' : window.location.search]);

  const fetchStatus = useCallback(async () => {
    try {
      // Note: We now handle force param separately in the useEffect that calls this function
      if (isAuthenticated) {
        const resp = await createBackendAxiosRequest<OnboardingStatusResponse>({
          method: 'GET',
          url: 'auth/onboarding',
          headers: getBearerTokenHeader(),
        });
        const data = resp.data || { versionSeen: 0, currentVersion: CURRENT_VERSION };
        setStatus(data);

        // Only set visible if not forced (forced case handled in calling useEffect)
        if (!forceParam) {
          const shouldShowTour = data.versionSeen < (data.currentVersion || CURRENT_VERSION);
          setVisible(shouldShowTour);
          logger.info('onboarding_fetch_status', 'Setting tour visibility from API', { shouldShowTour });
        }
      } else {
        // guest fallback
        const seen = Number(localStorage.getItem(LOCAL_KEY) || '0');
        setStatus({ versionSeen: seen, currentVersion: CURRENT_VERSION });

        // Only set visible if not forced (forced case handled in calling useEffect)
        if (!forceParam) {
          const shouldShowTour = seen < CURRENT_VERSION;
          setVisible(shouldShowTour);
          logger.info('onboarding_fetch_status', 'Setting tour visibility from localStorage', { shouldShowTour });
        }
      }
    } catch (e) {
      logger.warn('onboarding_status_error', 'Falling back to local status', { error: String(e) });
      const seen = Number(localStorage.getItem(LOCAL_KEY) || '0');
      setStatus({ versionSeen: seen, currentVersion: CURRENT_VERSION });

      // Only set visible if not forced (forced case handled in calling useEffect)
      if (!forceParam) {
        const shouldShowTour = seen < CURRENT_VERSION;
        setVisible(shouldShowTour);
      }
    }
  }, [isAuthenticated, forceParam]);

  // Check if we're on auth pages where tour should never appear
  const isAuthPage = useMemo(() => {
    const path = location.pathname;
    // Treat root as an auth page only when NOT authenticated
    if (path === '/') return !isAuthenticated;
    return path === '/signin' || path === '/signup' || path === '/onboarding';
  }, [location.pathname, isAuthenticated]);

  // Initial fetch of status and restore tour state
  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      logger.info('onboarding_init', 'Starting tour initialization', { isAuthPage, forceParam });

      try {
        await fetchStatus();

        // Check for force parameter - this should override everything except auth pages
        if (forceParam && !isAuthPage) {
          logger.info('onboarding_force', 'Forcing tour visibility via URL parameter');
          setVisible(true);
          localStorage.setItem(TOUR_ACTIVE_KEY, 'true');
        }
        // Otherwise, don't restore tour on auth pages
        else if (!isAuthPage) {
          // Restore tour state from localStorage if it was active before navigation
          try {
            const tourActive = localStorage.getItem(TOUR_ACTIVE_KEY);
            logger.info('onboarding_restore', 'Checking stored tour state', { tourActive });
            if (tourActive === 'true') {
              setVisible(true);
            }
          } catch (e) {
            // Ignore errors reading from localStorage
          }
        }
      } finally {
        // Mark that initial check has completed
        setInitialCheckComplete(true);
        setLoading(false);
      }
    };

    void checkStatus();
  }, [fetchStatus, isAuthPage, forceParam]);

  // Removed auth/me call; tour no longer fetches user info for personalization

  // Compute steps per current route
  const steps = useMemo(() => stepsForRoute(location.pathname), [location.pathname]);

  // Manage anchor highlight + positioning lifecycle
  useEffect(() => {
    if (!visible) return;
    const step = steps[activeIndex];
    const el = findAnchorEl(step?.anchor);

    // Remove highlight from previous element
    highlight(lastAnchorRef.current, false);

    // Add highlight to current element
    if (el) {
      highlight(el, true);
      lastAnchorRef.current = el;

      // Ensure element is visible by scrolling to it
      try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch {}
    }
    if (el) {
      const compute = () => {
        const pad = 10;
        const r = el.getBoundingClientRect();
        let rect = { top: Math.max(0, r.top - pad), left: Math.max(0, r.left - pad), width: r.width + pad * 2, height: r.height + pad * 2 };
        // Tighten to tiles union for single move prediction
        if ((step?.anchor || '') === 'move-tiles') {
          try {
            const tiles = Array.from(el.querySelectorAll('.lp-tile')) as HTMLElement[];
            const vis = tiles.filter(t => t.offsetParent !== null);
            if (vis.length) {
              let minT = Number.POSITIVE_INFINITY, minL = Number.POSITIVE_INFINITY, maxR = 0, maxB = 0;
              vis.forEach(t => {
                const tr = t.getBoundingClientRect();
                minT = Math.min(minT, tr.top);
                minL = Math.min(minL, tr.left);
                maxR = Math.max(maxR, tr.left + tr.width);
                maxB = Math.max(maxB, tr.top + tr.height);
              });
              if (isFinite(minT) && isFinite(minL) && maxR > minL && maxB > minT) {
                rect = { top: Math.max(0, minT - pad), left: Math.max(0, minL - pad), width: (maxR - minL) + pad * 2, height: (maxB - minT) + pad * 2 };
              }
            }
          } catch {}
        }
        // Ensure minimum visible hole for small targets (e.g., buttons)
        const minW = 120, minH = 48;
        if (rect.width < minW) { const d = (minW - rect.width) / 2; rect.left = Math.max(0, rect.left - d); rect.width = minW; }
        if (rect.height < minH) { const d = (minH - rect.height) / 2; rect.top = Math.max(0, rect.top - d); rect.height = minH; }
        setMaskRect(rect);
        const vw = window.innerWidth; const vh = window.innerHeight;
        const bubbleW = 360; const bubbleH = 140; // estimated bubble size
        const offset = 12; const margin = 8;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const positions: Array<{ side: BubblePos['side']; top: number; left: number }>= [
          { side: 'bottom', top: rect.top + rect.height + offset, left: centerX - bubbleW / 2 },
          { side: 'top',    top: Math.max(margin, rect.top - bubbleH - offset), left: centerX - bubbleW / 2 },
          { side: 'right',  top: centerY - bubbleH / 2, left: rect.left + rect.width + offset },
          { side: 'left',   top: centerY - bubbleH / 2, left: Math.max(margin, rect.left - bubbleW - offset) },
        ];
        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
        const fitsViewport = (p: { top: number; left: number }) => (
          p.left >= margin && p.left + bubbleW <= vw - margin && p.top >= margin && p.top + bubbleH <= vh - margin
        );
        let choice = positions.find(p => fitsViewport(p));
        if (!choice) {
          const p = positions[0];
          choice = { ...p, top: clamp(p.top, margin, vh - bubbleH - margin), left: clamp(p.left, margin, vw - bubbleW - margin) };
        }
        setBubblePos(choice);
      };
      compute();
      const id = window.setTimeout(compute, 250);
      return () => window.clearTimeout(id);
    } else {
      setMaskRect(null);
      setBubblePos(null);
    }
    return () => { highlight(el, false); };
  }, [visible, steps, activeIndex]);

  // Recompute on scroll/resize
  useEffect(() => {
    if (!visible) return;
    const handler = () => {
      const el = lastAnchorRef.current; if (!el) return;
      const pad = 10;
      const r = el.getBoundingClientRect();
      let rect = { top: Math.max(0, r.top - pad), left: Math.max(0, r.left - pad), width: r.width + pad * 2, height: r.height + pad * 2 };
      try {
        const tourId = el.getAttribute('data-tour-id');
        if (tourId === 'move-tiles') {
          const tiles = Array.from(el.querySelectorAll('.lp-tile')) as HTMLElement[];
          const vis = tiles.filter(t => t.offsetParent !== null);
          if (vis.length) {
            let minT = Number.POSITIVE_INFINITY, minL = Number.POSITIVE_INFINITY, maxR = 0, maxB = 0;
            vis.forEach(t => {
              const tr = t.getBoundingClientRect();
              minT = Math.min(minT, tr.top);
              minL = Math.min(minL, tr.left);
              maxR = Math.max(maxR, tr.left + tr.width);
              maxB = Math.max(maxB, tr.top + tr.height);
            });
            if (isFinite(minT) && isFinite(minL) && maxR > minL && maxB > minT) {
              rect = { top: Math.max(0, minT - pad), left: Math.max(0, minL - pad), width: (maxR - minL) + pad * 2, height: (maxB - minT) + pad * 2 };
            }
          }
        }
      } catch {}
      const minW = 120, minH = 48;
      if (rect.width < minW) { const d = (minW - rect.width) / 2; rect.left = Math.max(0, rect.left - d); rect.width = minW; }
      if (rect.height < minH) { const d = (minH - rect.height) / 2; rect.top = Math.max(0, rect.top - d); rect.height = minH; }
      setMaskRect(rect);
      const vw = window.innerWidth; const vh = window.innerHeight;
      const bubbleW = 360; const bubbleH = 140; const offset = 12; const margin = 8;
      const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
      const positions: Array<{ side: BubblePos['side']; top: number; left: number }>= [
        { side: 'bottom', top: rect.top + rect.height + offset, left: centerX - bubbleW / 2 },
        { side: 'top',    top: Math.max(margin, rect.top - bubbleH - offset), left: centerX - bubbleW / 2 },
        { side: 'right',  top: centerY - bubbleH / 2, left: rect.left + rect.width + offset },
        { side: 'left',   top: centerY - bubbleH / 2, left: Math.max(margin, rect.left - bubbleW - offset) },
      ];
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
      const fitsViewport = (p: { top: number; left: number }) => (
        p.left >= margin && p.left + bubbleW <= vw - margin && p.top >= margin && p.top + bubbleH <= vh - margin
      );
      let choice = positions.find(p => fitsViewport(p));
      if (!choice) {
        const p = positions[0];
        choice = { ...p, top: clamp(p.top, margin, vh - bubbleH - margin), left: clamp(p.left, margin, vw - bubbleW - margin) };
      }
      setBubblePos(choice);
    };
    const onScroll = () => { window.requestAnimationFrame(handler); };
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => { window.removeEventListener('resize', onScroll); window.removeEventListener('scroll', onScroll, true); };
  }, [visible]);

  const completeAndPersist = useCallback(async () => {
    try {
      setSaving(true);
      if (isAuthenticated) {
        await createBackendAxiosRequest<OnboardingStatusResponse>({
          method: 'PUT',
          url: 'auth/onboarding',
          data: { version: status?.currentVersion || CURRENT_VERSION },
          headers: getBearerTokenHeader(),
        });
      } else {
        localStorage.setItem(LOCAL_KEY, String(status?.currentVersion || CURRENT_VERSION));
      }

      // Clean up tour active state
      try {
        localStorage.removeItem(TOUR_ACTIVE_KEY);
      } catch {}

      logger.info('onboarding_complete', 'Tour completed');
    } catch (e) {
      logger.warn('onboarding_complete_failed', 'Failed to persist onboarding completion', { error: String(e) });
    } finally {
      setSaving(false);
      setVisible(false);
    }
  }, [isAuthenticated, status?.currentVersion]);

  const handleSkip = useCallback(() => {
    logger.info('onboarding_skip', 'Tour skipped', { atStep: steps[activeIndex]?.id });
    void completeAndPersist();
  }, [steps, activeIndex, completeAndPersist]);

  const gotoFeaturedGame = useCallback(async () => {
    try {
      const resp = await getFeaturedMatch();
      const id = resp?.data?.match_id;
      if (id) history.push(`/chess/${id}`);
    } catch (e) {
      logger.warn('onboarding_featured_nav_failed', 'Unable to navigate to featured match', { error: String(e) });
    }
  }, [history]);

  const handleNext = useCallback(() => {
    logger.info('onboarding_step', 'Next pressed', { step: steps[activeIndex]?.id });
    const step = steps[activeIndex];
    if (!step) return;

    if (step.id === 'dashboard-join-game') {
      // If on the dashboard featured match step, navigate to a chess game
      // The route change will trigger the reset to chess steps
      logger.info('onboarding_next_navigate', 'Navigating to chess game from dashboard');

      // First make sure we're storing the active state
      try {
        localStorage.setItem(TOUR_ACTIVE_KEY, 'true');
      } catch {}

      void gotoFeaturedGame();
      return;
    }

    if (step.id === 'complete') {
      void completeAndPersist();
      return;
    }

    setActiveIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps, activeIndex, gotoFeaturedGame, completeAndPersist]);

  // Handle route transitions in the tour
  useEffect(() => {
    if (!visible) return;

    // When user navigates from dashboard to chess interface
    if (location.pathname.startsWith('/chess/')) {
      // Reset to the first chess step - ensure tour remains visible
      setActiveIndex(0);
      logger.info('onboarding_chess_transition', 'User entered chess interface, transitioning to chess steps');
    }
  }, [visible, location.pathname]);

  // Persist tour visibility state to localStorage
  useEffect(() => {
    try {
      if (visible) {
        localStorage.setItem(TOUR_ACTIVE_KEY, 'true');
      } else {
        localStorage.removeItem(TOUR_ACTIVE_KEY);
      }
    } catch (e) {
      // Ignore errors writing to localStorage
    }
  }, [visible]);

  // Click-to-advance for selected steps
  useEffect(() => {
    if (!visible) return;
    const step = steps[activeIndex];
    if (!step?.advanceOnAnchorClick) return;
    const el = findAnchorEl(step.anchor);
    if (!el) return;

    // Find the join game button inside the featured match card
    const joinGameButton = el.querySelector('[data-tour-id="join-featured-button"]');

    // If we're on the dashboard step and there's a join game button
    if (step.id === 'dashboard-join-game' && joinGameButton) {
      const onClick = () => {
        // This will be triggered when the user clicks the Join Game button
        // The navigation to the chess interface happens in the button's own onClick handler
        logger.info('onboarding_join_game_click', 'User clicked Join Game, navigating to chess interface');

        // Make sure tour remains active during navigation
        try {
          localStorage.setItem(TOUR_ACTIVE_KEY, 'true');
        } catch {}

        // Don't need to update activeIndex - this will happen automatically when route changes
      };

      joinGameButton.addEventListener('click', onClick, { once: true });
      return () => { joinGameButton.removeEventListener('click', onClick as any); };
    } else {
      // Default behavior for other elements
      const onClick = () => { setActiveIndex((i) => Math.min(i + 1, steps.length - 1)); };
      el.addEventListener('click', onClick, { once: true });
      return () => { el.removeEventListener('click', onClick as any); };
    }
  }, [visible, steps, activeIndex]);

  // Hide tour if:
  // 1. Initial check hasn't completed yet, or
  // 2. On auth pages, or
  // 3. Onboarding disabled for authenticated users and not forced AND no active session, or
  // 4. Tour is not visible, still loading, or status not available
  const persistedActive = (() => { try { return localStorage.getItem(TOUR_ACTIVE_KEY) === 'true'; } catch { return false; } })();
  if (!initialCheckComplete ||
      isAuthPage ||
      ((onboardingEnabled === false && isAuthenticated && !forceParam) && !persistedActive) ||
      !visible || loading || !status) {
    logger.info('onboarding_hide_tour', 'Not showing tour', {
      initialCheckComplete,
      isAuthPage,
      onboardingEnabled,
      isAuthenticated,
      forceParam,
      persistedActive,
      visible,
      loading,
      hasStatus: Boolean(status)
    });
    return null;
  }

  const step = steps[activeIndex];
  const title = step?.title || 'Welcome';
  const body = step?.body || '';
  // Use global step numbers for consistent counting across routes
  const stepIndex = step?.globalStep || (activeIndex + 1);
  const totalSteps = TOTAL_STEPS;

  // Handle function-based body text (if any)
  const getBodyText = (step: Step | undefined): string => {
    if (!step) return '';
    if (typeof step.body === 'function') {
      return step.body();
    }
    return step.body;
  };

  const bodyText = getBodyText(step);

  if (maskRect && bubblePos) {
    const { top, left, width, height } = maskRect;
    const isFirstStep = activeIndex === 0;

    return (
      <div className="onboarding-tour-layer" aria-label="Onboarding tour">
        <div className="tour-shade" style={{ top: 0, left: 0, width: '100%', height: top }} />
        <div className="tour-shade" style={{ top, left: 0, width: left, height }} />
        <div className="tour-shade" style={{ top, left: left + width, right: 0, height, position: 'fixed' as const }} />
        <div className="tour-shade" style={{ top: top + height, left: 0, width: '100%', bottom: 0, position: 'fixed' as const }} />
        <div className="tour-outline" style={{ top, left, width, height, borderRadius: 10 }} />
        <div className={["tour-bubble", `side-${bubblePos.side}`].join(' ')} style={{ top: bubblePos.top, left: bubblePos.left }} role="dialog" aria-modal="false">
          <h4>{title}</h4>
          <p>{bodyText}</p>
          <div className="tour-actions">
            <span className="tour-meta">Step {stepIndex} of {totalSteps}</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {!isFirstStep && (
                <button type="button" onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))} disabled={saving}>Back</button>
              )}
              <button type="button" onClick={handleSkip} disabled={saving}>Skip</button>
              <button type="button" className="primary" onClick={handleNext} disabled={saving}>{step?.id === 'complete' ? 'Finish' : 'Next'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-tour-overlay" role="dialog" aria-modal="true" aria-label="Onboarding tour">
      <div className="onboarding-tour-card">
        <h3>{title}</h3>
        <p>{bodyText}</p>
        <div className="onboarding-tour-actions">
          <span className="left">Step {stepIndex} of {totalSteps}</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            {activeIndex > 0 && (
              <button type="button" onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))} disabled={saving}>Back</button>
            )}
            <button type="button" onClick={handleSkip} disabled={saving}>Skip</button>
            <button type="button" className="primary" onClick={handleNext} disabled={saving}>
              {step?.id === 'complete' ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingTour;
