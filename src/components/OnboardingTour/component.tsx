import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'types/state';
import { useMode } from 'context/ModeContext';
import './style.scss';

type StepId =
  | 'welcome-dashboard'
  | 'currency-toggle'
  | 'featured-card'
  | 'game-welcome'
  | 'player-header'
  | 'move-top'
  | 'receipts';

type Step = {
  id: StepId;
  title: string;
  body: string;
  anchor?: string; // data-tour-id value
  route?: string; // if set, navigate to this path when entering the step
};

const STORAGE_KEY_STEP = 'betmate:tour_step';
const STORAGE_KEY_VERSION = 'betmate:tour_version';
const CURRENT_VERSION = '2';

function isRouteAllowed(pathname: string) {
  if (pathname === '/' || pathname.startsWith('/dashboard')) return true; // Dashboard
  if (pathname.startsWith('/chess') || pathname.startsWith('/matches')) return true; // Game UI
  return false;
}

function stepsForRoute(pathname: string): Step[] {
  // Same global 7 steps; anchor presence differs by route
  // 1-3 Dashboard, 4-7 Game UI
  return [
    { id: 'welcome-dashboard', title: 'Welcome to BetMate', body: 'Let’s take a quick tour of the platform.', anchor: 'welcome-dashboard' },
    { id: 'currency-toggle', title: 'Choose Your Currency', body: 'Toggle between BetMate Cash and K‑Bits at any time.', anchor: 'currency-toggle' },
    { id: 'featured-card', title: 'Featured Match', body: 'Open a live game with Join Game — or press Next to continue.', anchor: 'featured-card' },
    { id: 'game-welcome', title: 'Game Interface', body: 'Watch a live match and place bets while the game evolves.', anchor: 'game-welcome', route: '/chess/featured' },
    { id: 'player-header', title: 'Bet Outcome (Black)', body: 'Use the Black header to bet on Black to win.', anchor: 'player-header' },
    { id: 'move-top', title: 'Top Move', body: 'Pick the top suggested move — we highlight it and show its arrow on the board.', anchor: 'move-tiles' },
    { id: 'receipts', title: 'Receipts', body: 'Your wagers appear here. This panel will track your results.', anchor: 'receipts' },
  ];
}

function firstVisibleAnchor(query: string): HTMLElement | null {
  const list = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour-id="${query}"]`));
  for (const el of list) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden') return el;
  }
  return null;
}

type Rect = { x: number; y: number; w: number; h: number };

function rectFor(el: HTMLElement | null): Rect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const margin = 8;
  return { x: Math.max(8, r.left - margin), y: Math.max(8, r.top - margin), w: Math.min(window.innerWidth - 16, r.width + margin * 2), h: Math.min(window.innerHeight - 16, r.height + margin * 2) };
}

const OnboardingTour: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { onboardingEnabled } = useMode();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);

  const [activeIndex, setActiveIndex] = useState<number>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_STEP);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [rect, setRect] = useState<Rect | null>(null);
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);
  const [observingTopMove, setObservingTopMove] = useState<MutationObserver | null>(null);

  const steps = useMemo(() => stepsForRoute(location.pathname), [location.pathname]);
  const totalSteps = steps.length;
  const step = steps[activeIndex];

  // Determine visibility
  const forceShow = /[?&]tour=1/.test(location.search || '');
  const versionSeen = useMemo(() => {
    try { return window.localStorage.getItem(STORAGE_KEY_VERSION) || ''; } catch { return ''; }
  }, []);
  const visible = Boolean(
    (isAuthenticated && (onboardingEnabled || forceShow))
    && isRouteAllowed(location.pathname)
    && versionSeen !== CURRENT_VERSION
  );

  // Persist active step
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY_STEP, String(activeIndex)); } catch {}
  }, [activeIndex]);

  // Position spotlight + bubble around anchor
  const updatePosition = React.useCallback(() => {
    if (!visible) return;
    const anchorId = step?.anchor;
    const el = anchorId ? firstVisibleAnchor(anchorId) : null;
    const r = rectFor(el);
    setRect(r);
    if (r) {
      const padding = 10;
      const preferredTop = Math.max(12, r.y + r.h + 10);
      const left = Math.min(Math.max(12, r.x), window.innerWidth - 372);
      const top = Math.min(preferredTop, window.innerHeight - 140 - padding);
      setBubblePos({ top, left });
      // Ensure in view if on dashboard list
      try { el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch {}
    } else {
      setBubblePos({ top: 24, left: 24 });
    }
  }, [visible, step?.anchor]);

  useEffect(() => {
    updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [updatePosition]);

  // Cross-page behavior: if user presses Next on step 2->3 and on Next from step 2 or 3 navigate
  useEffect(() => {
    if (!visible) return;
    // If current step has a route and we are not on it yet, navigate
    if (step?.route && !location.pathname.startsWith(step.route.replace(':featured', ''))) {
      // Defer navigation to allow bubble initial render
      const t = window.setTimeout(() => history.push(step.route!), 50);
      return () => window.clearTimeout(t);
    }
  }, [visible, step?.route, location.pathname]);

  // Allow Join Game button to drive the tour
  useEffect(() => {
    if (!visible) return;
    const onJoin = () => {
      // If we are at featured-card (index 2), advance
      if (steps[activeIndex]?.id === 'featured-card') {
        setActiveIndex(3); // move to Game welcome (index 3)
      }
    };
    window.addEventListener('betmate:tour-join-game', onJoin as any);
    return () => window.removeEventListener('betmate:tour-join-game', onJoin as any);
  }, [visible, activeIndex, steps]);

  // Step 6: auto-hover the top move and keep it updated
  const hoverTopMove = React.useCallback(() => {
    try {
      const container = firstVisibleAnchor('move-tiles');
      if (!container) return;
      const firstItem = container.querySelector<HTMLElement>('.move-predictions__item');
      if (firstItem) {
        const ev = new MouseEvent('mouseenter', { bubbles: true, cancelable: true, view: window });
        firstItem.dispatchEvent(ev);
        firstItem.scrollIntoView({ block: 'nearest' });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = steps[activeIndex]?.id;
    if (id === 'move-top') {
      hoverTopMove();
      // Observe list changes to re-hover top item
      const container = firstVisibleAnchor('move-tiles');
      if (container) {
        const obs = new MutationObserver(() => hoverTopMove());
        obs.observe(container, { childList: true, subtree: true });
        setObservingTopMove(obs);
        return () => { obs.disconnect(); setObservingTopMove(null); };
      }
    }
    // Cleanup when leaving step
    return () => {
      if (observingTopMove) { observingTopMove.disconnect(); setObservingTopMove(null); }
    };
  }, [visible, activeIndex, steps, hoverTopMove]);

  if (!visible) return null;

  const goBack = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () => {
    // From step 2 (currency) to 3 (featured), do nothing special
    // From step 3 (featured) to 4 (game), push route and advance
    if (steps[activeIndex]?.id === 'featured-card') {
      history.push('/chess/featured');
      setActiveIndex(3);
      return;
    }
    setActiveIndex((i) => Math.min(totalSteps - 1, i + 1));
  };
  const skip = () => {
    try { window.localStorage.setItem(STORAGE_KEY_VERSION, CURRENT_VERSION); } catch {}
    try { window.localStorage.removeItem(STORAGE_KEY_STEP); } catch {}
    setActiveIndex(0);
    // Hide by re-checking versionSeen next render via visible
    // We can force a noop state toggle to trigger re-render; but visible relies on versionSeen memo.
    // Instead, navigate which re-mounts effectless; simple approach: reload visibility by pushing same route.
    history.replace(location.pathname + location.search + location.hash);
  };
  const done = skip;

  const stepNum = activeIndex + 1;

  return (
    <div className="bm-tour-overlay" aria-live="polite">
      {/* Spotlight rectangle; fallback to global mask if no anchor */}
      {rect && (
        <div
          className="bm-tour-spotlight"
          style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
          aria-hidden
        />
      )}
      {/* Bubble */}
      {bubblePos && (
        <div className="bm-tour-bubble" style={{ top: bubblePos.top, left: bubblePos.left }} role="dialog" aria-modal="false">
          <div className="bm-tour-title">{step?.title || 'Tour'}</div>
          <div className="bm-tour-body">{step?.body || ''}</div>
          <div className="bm-tour-controls">
            <div className="left">
              <button className="bm-tour-btn" onClick={skip}>Skip</button>
            </div>
            <div className="right">
              <div className="bm-tour-step">{stepNum} / {totalSteps}</div>
              <button className="bm-tour-btn" onClick={goBack} disabled={activeIndex === 0} aria-disabled={activeIndex === 0}>Back</button>
              {stepNum < totalSteps ? (
                <button className="bm-tour-btn bm-tour-btn--primary" onClick={goNext}>Next</button>
              ) : (
                <button className="bm-tour-btn bm-tour-btn--primary" onClick={done}>Done</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingTour;

