import {
  FeedWager, Wager, WagerStatus,
} from 'types/resources/wager';
import { getMultiplier } from 'utils/chess';

export const createResolvedFeedWager = (wager: Wager): FeedWager => ({
  ...wager,
  time: wager.updated_at,
  odds: wager.wdl ? (wager.odds ?? 1) : (wager.winning_pool_share ?? 1),
  type: 'wager',
  // Ensure required fields have fallback values
  data: wager.data || 'Unknown bet',
  amount: wager.amount ?? 0,
});

export const createFeedWagers = (wager: Wager): FeedWager[] => ([
  {
    ...wager,
    time: wager.created_at,
    status: WagerStatus.PENDING,
    type: 'wager',
    // Ensure required fields have fallback values
    data: wager.data || 'Unknown bet',
    amount: wager.amount ?? 0,
    odds: wager.odds ?? 1,
  },
  ...(wager.resolved ? [createResolvedFeedWager(wager)] : []),
]);

const onWDLWagerCreate = (data: string, amount: number, odds: number): string => (
  `You made a $${amount} bet with ${getMultiplier(odds)}x odds for ${data.replace('_', ' to ')}`
);

const onMoveWagerCreate = (data: string, amount: number): string => (
  `You made a $${amount} pool bet on ${data}`
);

const onWagerWin = (data: string, wdl: boolean, amount: number, odds: number): string => (
  `You won $${(amount * odds).toFixed(2)} from your $${amount}${!wdl ? ' pool' : ''} bet on ${data.replace('_', ' to ')}`
);

const onWagerLost = (data: string, wdl: boolean, amount: number): string => (
  `You lost your $${amount}${!wdl ? ' pool' : ''} bet on ${data.replace('_', ' to ')}`
);

const onWagerCancelled = (data: string, wdl: boolean, amount: number): string => (
  `Your $${amount}${!wdl ? ' pool' : ''} bet on ${data} was cancelled as no one was correct`
);

export const getFeedMessage = (status: WagerStatus, data: string, wdl: boolean, amount: number, odds: number): string => {
  // Defensive checks for missing data
  if (!data || amount === undefined || amount === null) {
    console.warn('Missing wager data:', { status, data, wdl, amount, odds });
    return `Wager data incomplete`;
  }

  // Handle case where status might be an array (server data issue)
  let normalizedStatus: string;
  if (Array.isArray(status)) {
    normalizedStatus = status[0] ? String(status[0]).toLowerCase() : 'unknown';
  } else if (typeof status === 'string') {
    normalizedStatus = status.toLowerCase();
  } else {
    normalizedStatus = String(status).toLowerCase();
  }

  switch (normalizedStatus) {
    case WagerStatus.PENDING:
    case 'pending':
      return wdl
        ? onWDLWagerCreate(data, amount, odds || 1)
        : onMoveWagerCreate(data, amount);
    case WagerStatus.WON:
    case 'won':
      return onWagerWin(data, wdl, amount, odds || 1);
    case WagerStatus.LOST:
    case 'lost':
      return onWagerLost(data, wdl, amount);
    case WagerStatus.CANCELLED:
    case 'cancelled':
      return onWagerCancelled(data, wdl, amount);
    default:
      console.warn('Unhandled wager status:', { status, normalizedStatus, data, wdl, amount, odds });
      return `Wager ${normalizedStatus} - status not recognized`;
  }
};
