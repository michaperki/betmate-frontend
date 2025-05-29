import { createBackendAxiosRequest } from 'store/requests';
import { RequestReturnType } from 'types/state';

// Types for move analysis response
export interface MoveAnalysis {
  move: string;        // The move in SAN notation
  score: number;       // Raw engine score
  percentile: number;  // Percentile rank compared to best move (0-100)
  is_best_move: boolean; // Whether this is the engine's top choice
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
  const result = await createBackendAxiosRequest<MoveAnalysis>({
    method: 'GET',
    url: '/analysis/move',
    params: { fen, move: moveString },
  });

  return result;
};