// Arcade move pricing (Level-0 heuristic)
// Computes fixed-odds multipliers for offered SAN moves using top move engine scores.

export type TopMoveLite = { move: string; score: number };

function bucketProb(delta: number): number {
  if (delta <= 30) return 0.5;
  if (delta <= 80) return 0.3;
  if (delta <= 200) return 0.15;
  return 0.05;
}

/**
 * Compute Arcade fixed-odds multipliers for a list of offered SAN moves.
 * - offered: array of SAN strings; include 'Other' if present
 * - top: array of top moves with engine scores (higher is better)
 * - margin: house margin (0..0.25 recommended)
 */
export function computeArcadeMoveOdds(
  offered: string[],
  top: TopMoveLite[],
  margin = 0.08,
): Record<string, number> {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const m = clamp(margin, 0, 0.25);

  // Build score map and determine best score
  const scoreByMove = new Map<string, number>();
  let best = -Infinity;
  for (const t of top || []) {
    if (!t || !t.move) continue;
    scoreByMove.set(String(t.move), Number(t.score || 0));
    if (Number(t.score || 0) > best) best = Number(t.score || 0);
  }
  if (!Number.isFinite(best)) best = 0;

  // Raw probability per move by delta bucket
  const rawP = (mv: string): number => {
    const sc = scoreByMove.has(mv) ? (scoreByMove.get(mv) as number) : (best - 250);
    const delta = best - sc;
    return bucketProb(delta);
  };

  const universe = (offered || []).filter(Boolean);
  if (universe.length === 0) return {};

  const raws = universe.map(rawP);
  const sum = raws.reduce((a, b) => a + b, 0) || 1;

  const out: Record<string, number> = {};
  for (const mv of universe) {
    const p = Math.max(1e-6, rawP(mv) / sum);
    const odds = (1 - m) / p;
    out[mv] = Math.max(1, Math.round(odds * 100) / 100); // 2dp, min 1x
  }
  return out;
}
