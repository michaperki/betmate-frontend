import { createBackendAxiosRequest } from 'store/requests';
import { RequestReturnType } from 'types/state';

// Types for move analysis response
export interface MoveAnalysis {
  move: string;        // The move in SAN notation
  score: number;       // Raw engine score
  percentile: number;  // Percentile rank compared to best move (0-100)
  is_best_move: boolean; // Whether this is the engine's top choice
  // Optional enhanced fields from microservice
  emoji?: string;
  emoji_confidence?: number;
  reason_codes?: string[];
}

// Simple in-memory de-dupe + result cache
const inFlightMove = new Map<string, Promise<RequestReturnType<MoveAnalysis>>>();
const cacheMove = new Map<string, RequestReturnType<MoveAnalysis>>();

const inFlightTop = new Map<string, Promise<RequestReturnType<MoveAnalysis[]>>>();
const cacheTop = new Map<string, RequestReturnType<MoveAnalysis[]>>();
const inFlightBatch = new Map<string, Promise<RequestReturnType<MoveAnalysis[]>>>();


const moveKey = (fen: string, san: string) => `${fen}::${san}`;
const topKey = (fen: string, n: number) => `${fen}::top::${n}`;
const batchKey = (fen: string, moves: string[]) => `${fen}::batch::${[...moves].sort().join('|')}`;

// Normalize various backend payload shapes to MoveAnalysis[]
function normalizeTopMovesPayload(input: any): MoveAnalysis[] {
  const payload = input?.body ? (() => { try { return JSON.parse(input.body); } catch { return input; } })() : input;
  const arr = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? input : []);
  const badges = (payload?.meta && (payload.meta as any).badges) ? (payload.meta as any).badges : undefined;
  const out: MoveAnalysis[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const mv = String((item as any).move || '');
    if (!mv) continue;
    const base: MoveAnalysis = {
      move: mv,
      score: Number((item as any).score || 0),
      percentile: Number((item as any).percentile || 0),
      is_best_move: Boolean((item as any).is_best_move),
    };
    // Preserve enhanced fields if present
    const emoji = (item as any).emoji;
    const emoji_confidence = (item as any).emoji_confidence;
    const reason_codes = (item as any).reason_codes;
    if (typeof emoji === 'string') (base as any).emoji = emoji;
    if (typeof emoji_confidence === 'number') (base as any).emoji_confidence = emoji_confidence;
    if (Array.isArray(reason_codes)) (base as any).reason_codes = reason_codes;
    // Fallback to badge meta if item lacks emoji
    const canon = mv.replace(/[+#]$/g, '');
    const b = badges ? (badges[mv] || badges[canon]) : undefined;
    if (!('emoji' in base) && b && b.badge_type === 'emoji' && typeof b.badge_text === 'string') {
      (base as any).emoji = b.badge_text;
    }
    out.push(base);
  }
  return out;
}

/**
 * Get engine analysis for a specific move in a given position
 * 
 * @param fen The board position in FEN notation
 * @param moveString The move in SAN notation (e.g. "e4", "Nf3", etc.)
 * @returns Analysis data including score and comparison to best moves
 */
export const getMoveAnalysis = async (
  fen: string,
  moveString: string
): Promise<RequestReturnType<MoveAnalysis>> => {
  const key = moveKey(fen, moveString);
  const cached = cacheMove.get(key);
  if (cached) return Promise.resolve(cached);
  const inflight = inFlightMove.get(key);
  if (inflight) return inflight;

  const p = createBackendAxiosRequest<MoveAnalysis>({
    method: 'GET',
    url: '/analysis/move',
    params: { fen, move: moveString },
  })
    .then((resp) => {
      cacheMove.set(key, resp);
      inFlightMove.delete(key);
      return resp;
    })
    .catch((err) => {
      inFlightMove.delete(key);
      throw err;
    });

  inFlightMove.set(key, p);
  return p;
};

/**
 * Get top N moves for a given FEN
 */
export const getTopMoves = async (
  fen: string,
  n = 12,
  opts?: { gameId?: string; atMove?: number },
): Promise<RequestReturnType<MoveAnalysis[]>> => {
  const key = topKey(fen, n);
  const cached = cacheTop.get(key);
  if (cached) return Promise.resolve(cached);
  const inflight = inFlightTop.get(key);
  if (inflight) return inflight;

  const p = createBackendAxiosRequest<any>({
    method: 'GET',
    url: '/analysis/top-moves',
    params: { fen, n, ...(opts?.gameId ? { game_id: opts.gameId } : {}), ...(typeof opts?.atMove === 'number' ? { at_move: opts.atMove } : {}) },
  })
    .then((raw) => {
      // Normalize to MoveAnalysis[] while preserving Axios shape
      const normalized = normalizeTopMovesPayload(raw.data);
      const resp = { ...raw, data: normalized } as RequestReturnType<MoveAnalysis[]> & { meta?: any };
      // Preserve backend-provided badge meta if present
      (resp as any).meta = (raw?.data && (raw.data as any).meta) ? (raw.data as any).meta : undefined;
      cacheTop.set(key, resp);
      inFlightTop.delete(key);
      return resp;
    })
    .catch((err) => {
      inFlightTop.delete(key);
      throw err;
    });

  inFlightTop.set(key, p);
  return p;
};

/**
 * Batch analyze a set of SAN moves. Also hydrates the single-move cache.
 */
export const getBatchMoveAnalysis = async (
  fen: string,
  moves: string[],
): Promise<RequestReturnType<MoveAnalysis[]>> => {
  const key = batchKey(fen, moves);
  const inflight = inFlightBatch.get(key);
  if (inflight) return inflight;

  const p = createBackendAxiosRequest<any>({
    method: 'POST',
    url: '/analysis/moves',
    data: { fen, moves },
  })
    .then((raw) => {
      const arr: MoveAnalysis[] = Array.isArray(raw?.data?.data) ? raw.data.data : (Array.isArray(raw?.data) ? raw.data : []);
      // hydrate single-move cache
      for (const item of arr) {
        if (!item || typeof item !== 'object') continue;
        const k = moveKey(fen, String((item as any).move || ''));
        if (k) {
          // create a synthetic AxiosResponse-like object for cache coherency
          const resp = { ...raw, data: item } as RequestReturnType<MoveAnalysis>;
          cacheMove.set(k, resp);
        }
      }
      const resp = { ...raw, data: arr } as RequestReturnType<MoveAnalysis[]>;
      inFlightBatch.delete(key);
      return resp;
    })
    .catch((err) => {
      inFlightBatch.delete(key);
      throw err;
    });

  inFlightBatch.set(key, p);
  return p;
};
