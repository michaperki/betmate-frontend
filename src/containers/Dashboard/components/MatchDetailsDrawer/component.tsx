import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { getMatchDetails } from 'store/requests/matchesRequests';
import { MatchDetailsDTO } from 'types/matches';
import './style.scss';

interface RouteParams { id: string }

const MatchDetailsDrawer: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<RouteParams>();
  const [details, setDetails] = useState<MatchDetailsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      try {
        const resp = await getMatchDetails(id);
        if (mounted) setDetails(resp.data);
      } catch {}
      finally { if (mounted) setLoading(false); }
    };
    fetchDetails();
    const int = setInterval(fetchDetails, (details?.status === 'in_progress') ? 3000 : 8000);
    return () => { mounted = false; clearInterval(int); };
  }, [id, details?.status]);

  return (
    <div className="match-details-drawer">
      <div className="overlay" onClick={() => history.push('/')}></div>
      <div className="drawer">
        <div className="header">
          <div className="title">Match Details</div>
          <button className="close" onClick={() => history.push('/')}>✕</button>
        </div>
        {loading && <div className="loading">Loading…</div>}
        {!loading && details && (
          <div className="content">
            <div className="players">
              <div className="player">
                <div className="name">{details.players.find(p => p.color === 'white')?.username}</div>
                <div className="rating">{details.players.find(p => p.color === 'white')?.rating}</div>
              </div>
              <div className="vs">VS</div>
              <div className="player">
                <div className="name">{details.players.find(p => p.color === 'black')?.username}</div>
                <div className="rating">{details.players.find(p => p.color === 'black')?.rating}</div>
              </div>
            </div>
            <div className="snapshot">
              <div className="line">{`Move ${details.meta?.move_number ?? 0} • ${details.meta?.side_to_move || ''} to move`}</div>
              {details.meta?.last_move_san && <div className="line">Last move: {details.meta.last_move_san}</div>}
            </div>
            <div className="betting">
              <div className="panel-title">Betting</div>
              <div className="odds-row">
                <div className="odds">White: {details.odds?.white_win ? (1 / details.odds.white_win).toFixed(2) + 'x' : '-'}</div>
                <div className="odds">Draw: {details.odds?.draw ? (1 / details.odds.draw).toFixed(2) + 'x' : '-'}</div>
                <div className="odds">Black: {details.odds?.black_win ? (1 / details.odds.black_win).toFixed(2) + 'x' : '-'}</div>
              </div>
              {details.stakes && (
                <div className="limits">Min/Max: ${details.stakes.min_bet}–${details.stakes.max_bet} {details.stakes.currency}</div>
              )}
              {details.stats && (
                <div className="pool">Pool: ${details.stats.total_pool} • Bets: {details.stats.total_bets}</div>
              )}
              <div className="actions">
                <button className="btn primary" onClick={() => history.push(`/chess/${details.match_id}`)}>Place Bet</button>
                <button className="btn secondary" onClick={() => history.push(`/chess/${details.match_id}`)}>Join Game</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetailsDrawer;

