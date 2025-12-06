import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/reducers';
import { getBalanceHistory } from 'store/actionCreators/authActionCreators';
import { fetchWagerHistory } from 'store/actionCreators/wagerActionCreators';
import './style.scss';

// Tiny sparkline based on balance history
const MiniSparkline: React.FC = () => {
  const { balanceHistory, loadingBalanceHistory } = useSelector((s: RootState) => s.auth);
  if (loadingBalanceHistory || balanceHistory.length < 2) {
    return <div className="mini-empty">No data</div>;
  }
  const data = balanceHistory.slice().reverse().slice(-14); // last 14
  const balances = data.map(d => d.balance);
  const min = Math.min(...balances);
  const max = Math.max(...balances);
  const range = Math.max(1, max - min);
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 30 - ((item.balance - min) / range) * 28; // fit into 30px viewBox
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg className="mini-spark" viewBox="0 0 100 30" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="#00EFB2" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const computeStreak = (history: any[]) => {
  // Consecutive wins from most recent
  let streak = 0;
  for (const w of history) {
    if (w.status === 'won') streak += 1; else if (w.status === 'lost') break;
  }
  return streak;
};

const StatsTiles: React.FC = () => {
  const dispatch = useDispatch();
  const wagerHistory = useSelector((s: RootState) => s.wager.wagerHistory);

  useEffect(() => {
    dispatch(getBalanceHistory(30));
    dispatch(fetchWagerHistory(undefined, 10, 0));
  }, [dispatch]);

  const recent = wagerHistory.slice(0, 3);
  const streak = computeStreak(wagerHistory);

  return (
    <section className="stats-tiles">
      <div className="tile">
        <div className="tile-header">
          <span className="tile-title">Wager Analytics</span>
        </div>
        <div className="tile-body">
          <MiniSparkline />
        </div>
      </div>

      <div className="tile">
        <div className="tile-header">
          <span className="tile-title">Recent Activity</span>
        </div>
        <div className="tile-body">
          {recent.length === 0 ? (
            <div className="mini-empty">No recent wagers</div>
          ) : (
            <ul className="recent-list">
              {recent.map((w: any) => (
                <li key={w._id}>
                  <span className={`status ${w.status}`}>{w.status}</span>
                  <span className="amount">{w.amount}</span>
                  <span className="odds">@ {w.odds.toFixed(2)}x</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="tile">
        <div className="tile-header">
          <span className="tile-title">Current Streak</span>
        </div>
        <div className="tile-body streak">
          <div className="streak-value">{streak}</div>
          <div className="streak-label">wins in a row</div>
        </div>
      </div>
    </section>
  );
};

export default StatsTiles;

