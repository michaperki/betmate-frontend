import React from 'react';
import { useHistory } from 'react-router-dom';
import { FeaturedMatchDTO, MatchDetailsDTO } from 'types/matches';
import { useResponsiveLayout } from 'hooks/useResponsiveLayout';
import { getMatchDetails } from 'store/requests/matchesRequests';
import './style.scss';

export interface FeaturedMatchCardProps {
  match: FeaturedMatchDTO;
}

const displayTimeControl = (match: FeaturedMatchDTO) => {
  const tc = match.time_control;
  if (!tc) return '';
  const inc = tc.increment_seconds || 0;
  const minutes = Math.round((tc.initial_seconds || 0) / 60);
  return `${minutes}+${inc}`;
};

const truncate = (s?: string, n = 10) => {
  if (!s) return '';
  if (s.length <= n) return s;
  return `${s.slice(0, n)}…`;
};

const pieceSrc = (color: 'white' | 'black') => (color === 'white' ? '/pieces_w/king.png' : '/pieces/king.png');

const countryToFlag = (cc?: string) => {
  if (!cc) return '';
  const code = cc.trim().toUpperCase();
  if (code.length !== 2) return '';
  const A = 0x1F1E6;
  const first = code.charCodeAt(0) - 65;
  const second = code.charCodeAt(1) - 65;
  if (first < 0 || first > 25 || second < 0 || second > 25) return '';
  return String.fromCodePoint(A + first) + String.fromCodePoint(A + second);
};

const FeaturedMatchCard: React.FC<FeaturedMatchCardProps> = ({ match }) => {
  const history = useHistory();
  const { isMobile } = useResponsiveLayout();
  const [flipped, setFlipped] = React.useState(false);
  const [details, setDetails] = React.useState<MatchDetailsDTO | null>(null);
  const [whiteMs, setWhiteMs] = React.useState<number>(match.clocks?.white_ms || 0);
  const [blackMs, setBlackMs] = React.useState<number>(match.clocks?.black_ms || 0);

  const left = match.players.find(p => p.color === 'white') || match.players[0];
  const right = match.players.find(p => p.color === 'black') || match.players[1];

  const metaLineParts: string[] = [];
  if (match.time_control) metaLineParts.push(displayTimeControl(match));
  metaLineParts.push('Rapid');
  if (match.source?.provider) metaLineParts.push(match.source.provider.charAt(0).toUpperCase() + match.source.provider.slice(1));
  const metaLine = metaLineParts.join(' • ');

  const isLive = match.status === 'in_progress';
  const moveText = `Move ${match.meta?.move_number ?? 0} • ${match.meta?.phase ?? ''}`.trim();

  // Load details when flipping to back (desktop) to show market chips/pool
  React.useEffect(() => {
    let mounted = true;
    if (flipped) {
      getMatchDetails(match.match_id)
        .then((resp) => { if (mounted) setDetails(resp.data); })
        .catch(() => {});
    }
    return () => { mounted = false; };
  }, [flipped, match.match_id]);

  // Reset local clocks when props change
  React.useEffect(() => {
    setWhiteMs(match.clocks?.white_ms || 0);
    setBlackMs(match.clocks?.black_ms || 0);
  }, [match.clocks?.white_ms, match.clocks?.black_ms]);

  // Tick active clock down each second (visual only)
  React.useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => {
      if (match.meta?.side_to_move === 'white') {
        setWhiteMs((t) => Math.max(0, t - 1000));
      } else if (match.meta?.side_to_move === 'black') {
        setBlackMs((t) => Math.max(0, t - 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isLive, match.meta?.side_to_move]);

  const formatClock = (ms?: number) => {
    const total = Math.max(0, Math.floor((ms || 0) / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const clockClass = (ms?: number) => {
    const t = (ms || 0) / 1000;
    if (t <= 20) return 'critical';
    if (t <= 60) return 'warn';
    return '';
  };

  return (
    <section className={`featured-match-card ${flipped ? 'is-flipped' : ''}`}>
      <div className="fmc-header">
        <div className="title-row">
          <h3 className="title">Featured Match</h3>
          {isLive && <span className="live-badge">LIVE</span>}
        </div>
        <div className="meta-strip">
          <span className="meta-text">{metaLine}</span>
          <div className="meta-right">
            {match.stakes?.tier && <span className="stakes-pill">{match.stakes.tier}</span>}
          </div>
        </div>
      </div>
      <div className="fmc-flip">
        {/* FRONT */}
        <div className={`fmc-body ${isMobile ? 'mobile' : 'desktop'} fmc-front`}>
          <div className="player-block left">
            <div className="player-top">
              <div className={`color-chip ${left?.color}`}>
                <img className="piece" src={pieceSrc('white')} alt="White" />
              </div>
              {left?.country_code && <div className="flag" title={left.country_code}>{countryToFlag(left.country_code)}</div>}
              <div className="username" title={left?.username}>{truncate(left?.username, 12)}</div>
              {left?.title && <div className="title-badge">{left.title}</div>}
            </div>
            <div className="player-mid"><div className="rating">{left?.rating}</div></div>
          </div>

          <div className="center-block">
            <div className="game-state">{moveText}</div>
            <div className="instrument">
              {isLive ? (
                <>
                  <div className={`clock left-clock ${match.meta?.side_to_move === 'white' ? 'active' : ''} ${clockClass(whiteMs)}`}>{formatClock(whiteMs)}</div>
                  <div className="vs">VS</div>
                  <div className={`clock right-clock ${match.meta?.side_to_move === 'black' ? 'active' : ''} ${clockClass(blackMs)}`}>{formatClock(blackMs)}</div>
                </>
              ) : (
                <div className="scheduled">{match.status === 'not_started' ? 'Scheduled' : 'Finished'}</div>
              )}
            </div>
            <div className="stakes">
              <div className="tier-badge">{(match.stakes?.tier || 'High Stakes').toUpperCase()}</div>
              {match.stakes && (
                <div className="limits">${match.stakes.min_bet} – ${match.stakes.max_bet} per bet</div>
              )}
              {match.stats?.total_bets ? (
                <div className="market-line">{match.stats.total_bets} bets · ${match.stats.total_pool?.toLocaleString?.() || match.stats.total_pool} pool</div>
              ) : (
                <div className="market-line muted">Be the first to bet</div>
              )}
            </div>
          </div>

          <div className="player-block right">
            <div className="player-top">
              <div className={`color-chip ${right?.color}`}>
                <img className="piece" src={pieceSrc('black')} alt="Black" />
              </div>
              {right?.country_code && <div className="flag" title={right.country_code}>{countryToFlag(right.country_code)}</div>}
              <div className="username" title={right?.username}>{truncate(right?.username, 12)}</div>
              {right?.title && <div className="title-badge">{right.title}</div>}
            </div>
            <div className="player-mid"><div className="rating">{right?.rating}</div></div>
          </div>
        </div>

        {/* BACK (market) */}
        <div className="fmc-back">
          <div className="market">
            <div className="section">
              <div className="section-title">Market</div>
              <div className="odds-chips">
                <div className="chip">WHITE {details?.odds?.white_win ? (1 / (details?.odds?.white_win || 0)).toFixed(2) + 'x' : '-'}</div>
                <div className="chip">DRAW {details?.odds?.draw ? (1 / (details?.odds?.draw || 0)).toFixed(2) + 'x' : '-'}</div>
                <div className="chip">BLACK {details?.odds?.black_win ? (1 / (details?.odds?.black_win || 0)).toFixed(2) + 'x' : '-'}</div>
              </div>
              {details?.stats ? (
                <div className="pool-line">{details.stats.total_bets} bets · ${details.stats.total_pool?.toLocaleString?.() || details.stats.total_pool} in pool</div>
              ) : (
                <div className="pool-line muted">Market just opened</div>
              )}
            </div>

            <div className="section">
              <div className="section-title">Limits</div>
              {match.stakes && (
                <div className="limits-line">Bets from ${match.stakes.min_bet} to ${match.stakes.max_bet}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fmc-actions">
        <button className="btn primary" onClick={() => history.push(`/chess/${match.match_id}`)}>Join Game</button>
        <button className="btn secondary" onClick={() => {
          if (isMobile) { history.push(`/matches/${match.match_id}`); }
          else { setFlipped((v) => !v); }
        }}>{flipped ? 'Back' : 'View Market'}</button>
        {match.source?.url && (
          <button className="btn link" onClick={() => window.open(match.source!.url!, '_blank')}>Open in Source</button>
        )}
      </div>
    </section>
  );
};

export default FeaturedMatchCard;
