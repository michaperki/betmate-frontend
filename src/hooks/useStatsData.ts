import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'types/state';
import { fetchWagerHistory, fetchUserBettingStats } from 'store/actionCreators/wagerActionCreators';
import { getBalanceHistory } from 'store/actionCreators/authActionCreators';
import { useMode } from 'context/ModeContext';
import { Wager, WagerStatus } from 'types/resources/wager';

export function useStatsData() {
  const dispatch = useDispatch();
  const { mode } = useMode();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const wagerHistory = useSelector((s: RootState) => s.wager.wagerHistory);
  const userStats = useSelector((s: RootState) => s.wager.stats);
  const balanceHistory = useSelector((s: RootState) => s.auth.balanceHistory);

  useEffect(() => {
    if (!isAuthenticated) return;
    try { dispatch(fetchWagerHistory(undefined, 200, 0)); } catch {}
    try { dispatch(fetchUserBettingStats()); } catch {}
    try { dispatch(getBalanceHistory(90, mode === 'real' ? 'USDT' : 'BET')); } catch {}
  }, [dispatch, isAuthenticated, mode]);

  const completed = useMemo(() => (Array.isArray(wagerHistory)
    ? wagerHistory.filter((w: Wager) => (w.status === WagerStatus.WON || w.status === WagerStatus.LOST))
    : []), [wagerHistory]);

  const totals = useMemo(() => {
    const sum = { totalBets: 0, wonBets: 0, lostBets: 0, totalWagered: 0, profit: 0 };
    for (const w of completed) {
      sum.totalBets += 1;
      sum.totalWagered += Number(w.amount) || 0;
      if (w.status === WagerStatus.WON) {
        sum.wonBets += 1;
        sum.profit += (w.amount * (w.odds || 1)) - w.amount;
      } else if (w.status === WagerStatus.LOST) {
        sum.lostBets += 1;
        sum.profit -= (Number(w.amount) || 0);
      }
    }
    return sum;
  }, [completed]);

  const roi = totals.totalWagered > 0 ? (totals.profit / totals.totalWagered) * 100 : 0;
  const winRate = userStats?.winRate ?? (totals.totalBets > 0 ? (totals.wonBets / totals.totalBets) * 100 : 0);

  // Weekly profit (last 7 entries of balance history if present)
  const profitThisWeek = useMemo(() => {
    const hist = Array.isArray(balanceHistory) ? balanceHistory.slice().reverse() : [];
    if (hist.length < 2) return 0;
    const last7 = hist.slice(-7);
    const arr = last7.length >= 2 ? last7 : hist.slice(-Math.min(14, hist.length));
    const start = arr[0]?.balance ?? 0;
    const end = arr[arr.length - 1]?.balance ?? 0;
    return Math.round((end - start) * 100) / 100;
  }, [balanceHistory]);

  return {
    // top stats
    totalProfit: Math.round(totals.profit * 100) / 100,
    totalWagered: Math.round(totals.totalWagered * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    totalBets: totals.totalBets,
    wonBets: totals.wonBets,
    lostBets: totals.lostBets,
    winRate: Math.round(winRate * 10) / 10,
    profitThisWeek,
    // raw for future charts/breakdowns
    wagerHistory,
    balanceHistory,
  };
}

export type UseNewStatsData = ReturnType<typeof useNewStatsData>;

