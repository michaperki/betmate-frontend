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

  const impliedPct = (p?: number) => (p ? Math.round(p * 100) : null);
  const favorite = React.useMemo(() => {
    if (!details?.odds) return null;
    const entries: [string, number][] = [
      ['WHITE', details.odds.white_win || 0],
      ['DRAW', details.odds.draw || 0],
      ['BLACK', details.odds.black_win || 0],
    ];
    const top = entries.sort((a, b) => b[1] - a[1])[0];
    if (!top || !top[1]) return null;
    return `${top[0]} ${impliedPct(top[1])}%`;
  }, [details?.odds]);

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
            {/* Match State */}
            <section className="section">
              <div className="section-title">Match</div>
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
                {favorite && <div className="favorite">Favorite: {favorite}</div>}
              </div>
            </section>

            {/* Market */}
            <section className="section">
              <div className="section-title">Market</div>
              <div className="odds-row chips">
                <div className="chip">WHITE {details.odds?.white_win ? (1 / details.odds.white_win).toFixed(2) + 'x' : '-'}</div>
                <div className="chip">DRAW {details.odds?.draw ? (1 / details.odds.draw).toFixed(2) + 'x' : '-'}</div>
                <div className="chip">BLACK {details.odds?.black_win ? (1 / details.odds.black_win).toFixed(2) + 'x' : '-'}</div>
              </div>
            </section>

            {/* Limits & Pool */}
            <section className="section">
              <div className="section-title">Limits & Pool</div>
              {details.stakes && (
                <div className="limits">Bets from ${details.stakes.min_bet} to ${details.stakes.max_bet}</div>
              )}
              {details.stats ? (
                <div className="pool">{details.stats.total_bets} bets · ${details.stats.total_pool?.toLocaleString?.() || details.stats.total_pool} pool</div>
              ) : (
                <div className="pool muted">Be the first to bet</div>
              )}
            </section>

            {/* Actions */}
            <section className="section">
              <div className="actions">
                <button className="btn primary" onClick={() => history.push(`/chess/${details.match_id}`)}>Join Game</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetailsDrawer;
