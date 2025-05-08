export interface CreateLichessResponse {
  gameId: string;

  clock: { initial: number; increment: number; totalTime: number };

  // ─── NEW OPTIONAL FIELDS ─────────────────────────────
  /** centiseconds left after every half‑move */
  clocks?: number[];

  /** ply numbers that mark the start of middle‑ and end‑game */
  division?: { middle: number; end: number };
}
