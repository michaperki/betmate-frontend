import { Code } from 'types/state';

// Map backend error codes/messages to concise, user-friendly microcopy
export function shortWagerReason(code: Code, message?: string): string {
  const msg = String(message || '').toLowerCase();
  switch (String(code || '').toUpperCase()) {
    case 'CAP_PER_BET':
      return 'Per-bet cap';
    case 'CAP_PER_PLAYER_GAME':
      return 'Per-player cap';
    case 'CAP_PER_OUTCOME':
      return 'Outcome cap';
    case 'CAP_PER_GAME':
      return 'Game cap';
    case 'CAP_GLOBAL':
      return 'Global cap';
    case '403':
      // fall through to message heuristics for specific 403s
      break;
    case '401':
      return 'Sign in required';
    case '429':
      return 'Please slow down';
    case '500':
      return 'Temporarily unavailable';
    default:
      break;
  }

  // Heuristics based on backend message strings
  if (msg.includes('insufficient')) return 'Insufficient funds';
  if (msg.includes('temporarily disabled')) return 'Paused';
  if (msg.includes('real mode is currently disabled')) return 'Real mode disabled';
  if (msg.includes('stake exceeds')) return 'Over stake cap';
  if (msg.includes('pricing unavailable')) return 'Odds unavailable';
  if (msg.includes('game has already ended')) return 'Game ended';

  // Fallback to the original (brief) message
  return message || 'Wager rejected';
}
