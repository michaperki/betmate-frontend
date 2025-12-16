import React from 'react';
import { useHistory } from 'react-router-dom';
import { FeaturedMatchDTO } from 'types/matches';
import { useResponsiveLayout } from 'hooks/useResponsiveLayout';
import './style.scss';

export interface FeaturedMatchCardProps {
  match: FeaturedMatchDTO;
}

const formatTimeControl = (tc?: FeaturedMatchDTO['time_control']) => {
  if (!tc) return '';
  const inc = tc.increment_seconds ? `+${tc.increment_seconds}` : '+0';
  return `${Math.round(tc.initial_seconds / 60)}+${tc.increment_seconds || 0}`;
};

const FeaturedMatchCard: React.FC<FeaturedMatchCardProps> = ({ match }) => {
  const history = useHistory();
  const { isMobile } = useResponsiveLayout();

  const left = match.players.find(p => p.color === 'white') || match.players[0];
  const right = match.players.find(p => p.color === 'black') || match.players[1];

  const metaLineParts: string[] = [];
  if (match.time_control) metaLineParts.push(formatTimeControl(match.time_control));
  metaLineParts.push('Rapid');
  if (match.source?.provider) metaLineParts.push(match.source.provider.charAt(0).toUpperCase() + match.source.provider.slice(1));
  if (match.stakes?.tier) metaLineParts.push('High Stakes');
  const metaLine = metaLineParts.join(' • ');

  const isLive = match.status === 'in_progress';
  const moveText = `Move ${match.meta?.move_number ?? 0} • ${match.meta?.phase ?? ''}`.trim();

  return (
    <section className="featured-match-card">
      <div className="fmc-header">
        <div className="title-row">
          <h3 className="title">Featured Match</h3>
          {isLive && <span className="live-badge">LIVE</span>}
        </div>
        <div className="meta-strip">
          <span className="meta-text">{metaLine}</span>
          {match.stats?.total_bets ? (
            <span className="meta-right">Bets: {match.stats.total_bets}</span>
          ) : null}
        </div>
      </div>

      <div className={`fmc-body ${isMobile ? 'mobile' : 'desktop'}`}>
        <div className="player-block left">
          <div className="player-top">
            <div className="username">{left?.username}</div>
            <div className="title-badge">{left?.title || ''}</div>
          </div>
          <div className="player-mid">
            <div className="rating">{left?.rating}</div>
          </div>
          <div className="player-bottom">
            <div className="context-line">{match.opening?.name ? `${match.opening.name}${match.opening.eco ? ` • ${match.opening.eco}` : ''}` : moveText}</div>
          </div>
        </div>

        <div className="center-block">
          <div className="clocks">
            {isLive ? (
              <>
                <div className="clock left-clock">{Math.ceil((match.clocks?.white_ms || 0) / 1000)}s</div>
                <div className="vs">VS</div>
                <div className="clock right-clock">{Math.ceil((match.clocks?.black_ms || 0) / 1000)}s</div>
              </>
            ) : (
              <div className="scheduled">{match.status === 'not_started' ? 'Scheduled' : 'Finished'}</div>
            )}
          </div>
          <div className="stakes">
            <div className="tier">{match.stakes?.tier || 'HIGH STAKES'}</div>
            {match.stakes ? (
              <div className="limits">{`$${match.stakes.min_bet} – $${match.stakes.max_bet}`}</div>
            ) : null}
            {match.stats?.total_pool !== undefined && (
              <div className="pool">Total pool: ${match.stats.total_pool}</div>
            )}
          </div>
        </div>

        <div className="player-block right">
          <div className="player-top">
            <div className="username">{right?.username}</div>
            <div className="title-badge">{right?.title || ''}</div>
          </div>
          <div className="player-mid">
            <div className="rating">{right?.rating}</div>
          </div>
          <div className="player-bottom">
            <div className="context-line">{match.opening?.name ? `${match.opening.name}${match.opening.eco ? ` • ${match.opening.eco}` : ''}` : moveText}</div>
          </div>
        </div>
      </div>

      <div className="fmc-actions">
        <button className="btn primary" onClick={() => history.push(`/chess/${match.match_id}`)}>Join Game</button>
        <button className="btn secondary" onClick={() => history.push(`/matches/${match.match_id}`)}>View Details</button>
        {match.source?.url && (
          <button className="btn link" onClick={() => window.open(match.source!.url!, '_blank')}>Open in Source</button>
        )}
      </div>
    </section>
  );
};

export default FeaturedMatchCard;

