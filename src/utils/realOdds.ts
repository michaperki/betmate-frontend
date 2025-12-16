type Outcome = 'white_win' | 'black_win' | 'draw';

// Frontend-safe defaults that mirror backend defaults; avoid process.env usage in browser
const BASE_MARGIN = 0.04;
const DRAW_EXTRA = 0.07;
const MAX_WHITE = 4.0;
const MAX_BLACK = 4.0;
const MAX_DRAW = 6.0;
const EARLY_MOVE_NUM = 20;
const EARLY_EXTRA = 0.03;

export function realWdlMultiplier(outcome: Outcome, p: number, moveNum?: number): number {
  const early = (typeof moveNum === 'number') ? (moveNum <= EARLY_MOVE_NUM) : false;
  const margin = BASE_MARGIN + (outcome === 'draw' ? DRAW_EXTRA : 0) + (early ? EARLY_EXTRA : 0);
  const raw = (1 - Math.max(0, Math.min(0.9, margin))) / Math.max(1e-6, p);
  const cap = outcome === 'draw' ? MAX_DRAW : (outcome === 'white_win' ? MAX_WHITE : MAX_BLACK);
  const clamped = Math.min(raw, cap);
  return Math.max(1, Math.round(clamped * 10) / 10); // one decimal for UI
}
