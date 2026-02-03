import { Chess } from 'chess.js';

export type MoveAnalysisLite = { move: string };

/**
 * Derive best-effort move candidates for the current FEN.
 * Priority: analysis (top moves) → offered market options → legal moves.
 */
export function deriveMoveCandidates(
  fen: string | undefined,
  analysis: MoveAnalysisLite[] | undefined,
  offered: string[] | undefined,
  limit = 8,
): string[] {
  const out: string[] = [];
  const pushUnique = (s: string) => { const t = String(s).replace(/[+#]$/g, ''); if (t && !out.includes(t)) out.push(t); };

  // 1) Analysis top moves
  if (analysis && analysis.length) {
    for (const m of analysis) { if (m?.move) pushUnique(String(m.move)); if (out.length >= limit) break; }
  }

  // 2) Live market offered options
  if (offered && offered.length && out.length < limit) {
    for (const m of offered) { if (m) pushUnique(String(m)); if (out.length >= limit) break; }
  }

  // 3) Legal moves from the current position
  if (out.length < limit && fen) {
    try {
      const chess = new Chess(fen);
      const legal = chess.moves({ verbose: true }) as Array<{ san: string }>;
      for (const mv of legal) { if (mv?.san) pushUnique(String(mv.san)); if (out.length >= limit) break; }
    } catch {}
  }

  return out.slice(0, limit);
}
