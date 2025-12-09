import { createBackendAxiosRequest } from 'store/requests';
import { RequestReturnType } from 'types/state';

// Types for move analysis response
export interface MoveAnalysis {
  move: string;        // The move in SAN notation
  score: number;       // Raw engine score
  percentile: number;  // Percentile rank compared to best move (0-100)
  is_best_move: boolean; // Whether this is the engine's top choice
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
  const out: MoveAnalysis[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const mv = String(item.move || '');
    if (!mv) continue;
    out.push({
      move: mv,
      score: Number(item.score || 0),
      percentile: Number(item.percentile || 0),
      is_best_move: Boolean(item.is_best_move),
    });
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
): Promise<RequestReturnType<MoveAnalysis[]>> => {
  const key = topKey(fen, n);
  const cached = cacheTop.get(key);
  if (cached) return Promise.resolve(cached);
  const inflight = inFlightTop.get(key);
  if (inflight) return inflight;

  const p = createBackendAxiosRequest<any>({
    method: 'GET',
    url: '/analysis/top-moves',
    params: { fen, n },
  })
    .then((raw) => {
      // Normalize to MoveAnalysis[] while preserving Axios shape
      const normalized = normalizeTopMovesPayload(raw.data);
      const resp = { ...raw, data: normalized } as RequestReturnType<MoveAnalysis[]>;
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
