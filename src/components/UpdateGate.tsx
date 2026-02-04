import React from 'react';
import { useLocation } from 'react-router-dom';
import { ROOT_URL } from 'utils';

// Lightweight update manager: polls backend status for version changes
// and reloads the app only when safe (not during an active game UI state).
// A game page declares its state via window events: 'betmate:game-state' ({ state: 'live'|'ending'|'ended' }).

const POLL_MS = 30000;

const UpdateGate: React.FC = () => {
  const location = useLocation();
  const [current, setCurrent] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<string | null>(null);
  const [gameState, setGameState] = React.useState<'live' | 'ending' | 'ended' | 'none'>('none');

  React.useEffect(() => {
    const onGame = (e: any) => {
      const s = (e?.detail && e.detail.state) || 'none';
      if (s === 'live' || s === 'ending' || s === 'ended') setGameState(s);
    };
    window.addEventListener('betmate:game-state', onGame as any);
    return () => window.removeEventListener('betmate:game-state', onGame as any);
  }, []);

  const onSafePoint = React.useCallback(() => {
    // Consider safe to reload when not on game routes, or game not live
    const path = location.pathname || '';
    const onGame = path.startsWith('/chess') || path.startsWith('/matches');
    if (!onGame) return true;
    return gameState !== 'live';
  }, [location.pathname, gameState]);

  const maybeReload = React.useCallback(() => {
    if (!pending) return;
    if (onSafePoint()) {
      try { window.location.reload(); } catch {}
    }
  }, [pending, onSafePoint]);

  React.useEffect(() => { if (pending) maybeReload(); }, [pending, gameState, location.pathname, maybeReload]);

  React.useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const res = await fetch(`${ROOT_URL}/api/status`, { cache: 'no-store' });
        const json = await res.json();
        const v: string = json?.build?.appVersion || json?.version || '';
        if (!mounted) return;
        if (!current) setCurrent(v || '');
        else if (v && v !== current) setPending(v);
      } catch {
        // ignore
      }
    };
    const tick = () => { void poll(); };
    tick();
    const t = window.setInterval(tick, POLL_MS);
    return () => { mounted = false; window.clearInterval(t); };
  }, [current]);

  return null;
};

export default UpdateGate;

