import { Chess } from 'chess.js';
import type { Game, Move } from 'types/resources/game';

export type GameViewModel = {
  id: string;
  fen: string;
  playerWhite: { name: string; elo: number };
  playerBlack: { name: string; elo: number };
  timeWhiteSec: number;
  timeBlackSec: number;
  isWhiteTurn: boolean;
  status: 'live' | 'ending' | 'ended';
  winner?: 'white' | 'black' | 'draw';
  endType?: string;
};

/**
 * Safely generate a FEN string from a move history.
 */
export function toFenFromMoves(moves?: Move[]): string {
  try {
    const chess = new Chess();
    if (Array.isArray(moves)) {
      for (const mv of moves) {
        try {
          chess.move(mv.san, { sloppy: true } as any);
        } catch {
          // ignore invalid SAN in history
        }
      }
    }
    return chess.fen();
  } catch {
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }
}

/**
 * Normalize backend game status to simple UI phases.
 */
export function normalizeStatus(complete?: boolean, game_status?: string): 'live' | 'ending' | 'ended' {
  if (complete) return 'ended';
  // If backend sends a terminal status, consider it ending to allow overlays/animations
  if (typeof game_status === 'string' && /win|draw|aborted/i.test(game_status)) return 'ending';
  return 'live';
}

/**
 * Derive winner from backend status string.
 */
export function deriveWinner(game_status?: string): 'white' | 'black' | 'draw' | undefined {
  const s = String(game_status || '').toLowerCase();
  if (!s) return undefined;
  if (s.includes('draw')) return 'draw';
  if (s.includes('white_win')) return 'white';
  if (s.includes('black_win')) return 'black';
  return undefined;
}

/**
 * Human-friendly end reason from backend status.
 */
export function deriveEndType(game_status?: string): string | undefined {
  const s = String(game_status || '').toLowerCase();
  if (!s) return undefined;
  if (s.includes('checkmate')) return 'by checkmate';
  if (s.includes('resignation')) return 'by resignation';
  if (s.includes('time')) return 'by time';
  if (s.includes('abandon')) return 'by abandonment';
  if (s.includes('agreement')) return 'by agreement';
  if (s.includes('stalemate')) return 'by stalemate';
  if (s.includes('repetition')) return 'by repetition';
  if (s.includes('insufficient')) return 'by insufficient material';
  if (s.includes('aborted')) return 'aborted';
  return undefined;
}

/**
 * Convert raw backend clock value (ms or s) to seconds, using time_format when helpful.
 * - If `time_format` is like "10+0", we treat raw > (initialSeconds * 10) as ms; otherwise seconds.
 * - Without format, treat raw > 10000 as ms; otherwise seconds.
 */
function toSecondsFromRaw(raw?: number, time_format?: string): number {
  const n = Math.max(0, Number(raw || 0));
  const parseInitialSeconds = (tf?: string): number | null => {
    if (!tf) return null;
    const base = String(tf).split('+')[0]?.trim();
    const mins = Number.parseInt(base, 10);
    return Number.isFinite(mins) && mins >= 0 ? mins * 60 : null;
  };
  const initialSecs = parseInitialSeconds(time_format);
  if (initialSecs != null) return n > initialSecs * 10 ? Math.floor(n / 1000) : Math.floor(n);
  return n > 10000 ? Math.floor(n / 1000) : Math.floor(n);
}

/**
 * Build a compact view model consumed by the new UI.
 */
export function toGameViewModel(game: Game): GameViewModel {
  // Prefer server-provided FEN; fall back to reconstructing from history
  const fen = (String(game?.state || '').trim()) || toFenFromMoves(game?.move_hist);
  // Determine side to move from FEN when possible; otherwise parity fallback
  let isWhiteTurn = true;
  try { isWhiteTurn = new Chess(fen).turn() === 'w'; } catch {
    const moveCount = Array.isArray(game?.move_hist) ? game.move_hist.length : 0;
    isWhiteTurn = moveCount % 2 === 0;
  }
  const timeWhiteSec = toSecondsFromRaw(game?.time_white, game?.time_format);
  const timeBlackSec = toSecondsFromRaw(game?.time_black, game?.time_format);
  return {
    id: String(game?._id || ''),
    fen,
    playerWhite: { name: game?.player_white?.name || 'White', elo: Number(game?.player_white?.elo || 0) },
    playerBlack: { name: game?.player_black?.name || 'Black', elo: Number(game?.player_black?.elo || 0) },
    timeWhiteSec,
    timeBlackSec,
    isWhiteTurn,
    status: normalizeStatus(game?.complete, game?.game_status),
    winner: deriveWinner(game?.game_status),
    endType: deriveEndType(game?.game_status),
  };
}
