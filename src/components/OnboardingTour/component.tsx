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
  | 'chess-intro'
  | 'chess-player-header'
  | 'chess-move-predictions'
  | 'chess-outcomes'
  | 'chess-receipts'
  | 'complete';

type Step = {
  id: StepId;
  title: string;
  body: string;
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

// Total number of steps in the complete tour
const TOTAL_STEPS = 8;

const stepsForRoute = (route: string): Step[] => {
  if (route.startsWith('/chess/')) {
    return [
      { id: 'chess-intro', title: 'Live Game Interface', body: 'Games are streamed live from Lichess. Here you can place bets on moves and outcomes.', globalStep: 3 },
      { id: 'chess-player-header', title: 'Bet on a Player', body: 'Tap the White player header to bet on White winning the game.', anchor: 'white-player-header', advanceOnAnchorClick: true, globalStep: 4 },
      { id: 'chess-move-predictions', title: 'Move Predictions', body: 'Preview potential next moves. Tap a specific move to place a bet on it.', anchor: 'single-move-prediction', advanceOnAnchorClick: true, globalStep: 5 },
      { id: 'chess-outcomes', title: 'Outcome Wagers', body: 'On the right side, you can bet on game outcomes including draws and wins.', anchor: 'outcome-wagers', advanceOnAnchorClick: true, globalStep: 6 },
      { id: 'chess-receipts', title: 'Receipts', body: 'Track your wagers here as they confirm and settle.', anchor: 'receipts', globalStep: 7 },
      { id: 'complete', title: "You're all set!", body: "Have fun and bet responsibly.", globalStep: 8 },
    ];
  }
  // Dashboard with Join Game button highlight
  return [
    { id: 'intro-dashboard', title: 'Welcome to BetMate', body: 'Take a quick tour. You can skip anytime.', globalStep: 1 },
    { id: 'dashboard-join-game', title: 'Join Featured Match', body: 'Click the "Join Game" button on the featured match to start betting.', anchor: 'join-featured-button', advanceOnAnchorClick: true, globalStep: 2 },
    { id: 'goto-chess', title: 'Going to Game Interface', body: "Now we'll take you to the live game interface.", route: '/chess/:featured', autoAdvance: true, globalStep: 3 },
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
  const [minimized, setMinimized] = useState(false);
  const [maskRect, setMaskRect] = useState<Rect | null>(null);
  const [bubblePos, setBubblePos] = useState<BubblePos | null>(null);
  const lastAnchorRef = useRef<HTMLElement | null>(null);

  const isAuthenticated = Boolean(getBearerToken());
  const { onboardingEnabled } = useMode();

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Allow local override via query (?tour=1)
      const urlParams = new URLSearchParams(window.location.search);
      const force = urlParams.get('tour') === '1';

      if (isAuthenticated) {
        const resp = await createBackendAxiosRequest<OnboardingStatusResponse>({
          method: 'GET',
          url: 'auth/onboarding',
          headers: getBearerTokenHeader(),
        });
        const data = resp.data || { versionSeen: 0, currentVersion: CURRENT_VERSION };
        setStatus(data);
        setVisible(force || (data.versionSeen < (data.currentVersion || CURRENT_VERSION)));
      } else {
        // guest fallback
        const seen = Number(localStorage.getItem(LOCAL_KEY) || '0');
        setStatus({ versionSeen: seen, currentVersion: CURRENT_VERSION });
        setVisible(force || seen < CURRENT_VERSION);
      }
    } catch (e) {
      logger.warn('onboarding_status_error', 'Falling back to local status', { error: String(e) });
      const seen = Number(localStorage.getItem(LOCAL_KEY) || '0');
      setStatus({ versionSeen: seen, currentVersion: CURRENT_VERSION });
      setVisible(seen < CURRENT_VERSION);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { void fetchStatus(); }, [fetchStatus]);

  // Compute steps per current route
  const steps = useMemo(() => stepsForRoute(location.pathname), [location.pathname]);

  // Manage anchor highlight + positioning lifecycle
  useEffect(() => {
    if (!visible) return;
    const step = steps[activeIndex];
    const el = findAnchorEl(step?.anchor);
    highlight(lastAnchorRef.current, false);
    highlight(el, true);
    lastAnchorRef.current = el;
    if (el) {
      try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch {}
      const compute = () => {
        const pad = 10;
        const r = el.getBoundingClientRect();
        let rect = { top: Math.max(0, r.top - pad), left: Math.max(0, r.left - pad), width: r.width + pad * 2, height: r.height + pad * 2 };
        // Tighten to tiles union for single move prediction
        if ((step?.anchor || '') === 'single-move-prediction') {
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
        if (tourId === 'single-move-prediction') {
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
    if (step.id === 'goto-chess') {
      void gotoFeaturedGame();
      setActiveIndex(0);
      return;
    }
    if (step.id === 'complete') {
      void completeAndPersist();
      return;
    }
    setActiveIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps, activeIndex, gotoFeaturedGame, completeAndPersist]);

  // Auto-advance on route change to chess
  useEffect(() => {
    if (!visible) return;
    const step = steps[activeIndex];
    if (!step) return;
    if (step.id === 'goto-chess' && location.pathname.startsWith('/chess/')) {
      setActiveIndex(0);
    }
  }, [visible, steps, activeIndex, location.pathname]);

  // Click-to-advance for selected steps
  useEffect(() => {
    if (!visible) return;
    const step = steps[activeIndex];
    if (!step?.advanceOnAnchorClick) return;
    const el = findAnchorEl(step.anchor);
    if (!el) return;
    const onClick = () => { setActiveIndex((i) => Math.min(i + 1, steps.length - 1)); };
    el.addEventListener('click', onClick, { once: true });
    return () => { el.removeEventListener('click', onClick as any); };
  }, [visible, steps, activeIndex]);

  // Always allow guest onboarding even if flag is off; gate only for signed-in users
  if (onboardingEnabled === false && isAuthenticated) return null;
  if (!visible || loading || !status) return null;

  const step = steps[activeIndex];
  const title = step?.title || 'Welcome';
  const body = step?.body || '';
  // Use global step numbers for consistent counting across routes
  const stepIndex = step?.globalStep || (activeIndex + 1);
  const totalSteps = TOTAL_STEPS;

  if (minimized) {
    return (
      <button className="tour-minimized" onClick={() => setMinimized(false)}>{title} • Tap to resume</button>
    );
  }

  if (maskRect && bubblePos) {
    const { top, left, width, height } = maskRect;
    return (
      <div className="onboarding-tour-layer" aria-label="Onboarding tour">
        <div className="tour-shade" style={{ top: 0, left: 0, width: '100%', height: top }} />
        <div className="tour-shade" style={{ top, left: 0, width: left, height }} />
        <div className="tour-shade" style={{ top, left: left + width, right: 0, height, position: 'fixed' as const }} />
        <div className="tour-shade" style={{ top: top + height, left: 0, width: '100%', bottom: 0, position: 'fixed' as const }} />
        <div className="tour-outline" style={{ top, left, width, height, borderRadius: 10 }} />
        <div className={["tour-bubble", `side-${bubblePos.side}`].join(' ')} style={{ top: bubblePos.top, left: bubblePos.left }} role="dialog" aria-modal="false">
          <h4>{title}</h4>
          <p>{body}</p>
          <div className="tour-actions">
            <span className="tour-meta">Step {stepIndex} of {totalSteps}</span>
            <button type="button" onClick={() => setMinimized(true)}>Minimize</button>
            <button type="button" onClick={handleSkip} disabled={saving}>Skip</button>
            <button type="button" className="primary" onClick={handleNext} disabled={saving}>{step?.id === 'complete' ? 'Finish' : 'Next'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-tour-overlay" role="dialog" aria-modal="true" aria-label="Onboarding tour">
      <div className="onboarding-tour-card">
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="onboarding-tour-actions">
          <span className="left">Step {stepIndex} of {totalSteps}</span>
          <div>
            <button type="button" onClick={() => setMinimized(true)}>Minimize</button>
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