import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router';
import { Game, GameStatus } from 'types/resources/game';
import { Wager, WagerStatus } from 'types/resources/wager';
import { faTimes, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StatLine } from './helperComponents';
import './style.scss';

interface PostgameModalProps {
  games: Record<string, Game>
  resolvedWagers?: Wager[],
}

const PostgameModal: React.FC<PostgameModalProps> = (props) => {
  const [expanded, setExpanded] = useState(false);
  const [hide, setHide] = useState(false);

  const { id: gameId } = useParams<{ id: string }>();
  const history = useHistory();

  const game: Game | undefined = props.games[gameId];

  // Skip rendering if game is not available or modal is hidden
  if (!game || hide) {
    return null;
  }

  // Use empty array if resolvedWagers is undefined
  const wagers = props.resolvedWagers || [];

  // Only calculate if we have wagers
  const hasBets = wagers.length > 0;

  let winnings = '0.00';
  let losses = '0.00';
  let profit = 0;
  let totalBets = 0;

  if (hasBets) {
    // Calculate winnings
    winnings = wagers
      .filter((wager) => wager.game_id === gameId && wager.status === WagerStatus.WON)
      .reduce((currWinnings, wager) => (
        currWinnings
          + (wager.amount
            * (
              (wager.wdl
                ? wager.odds
                : wager.winning_pool_share)
              - 1
            ))
      ), 0)
      .toFixed(2);

    // Calculate losses
    losses = wagers
      .filter((wager) => wager.game_id === gameId && wager.status === WagerStatus.LOST)
      .reduce((loss, wager) => loss + wager.amount, 0)
      .toFixed(2);

    // Calculate profit
    profit = Number(winnings) - Number(losses);

    // Count bets
    totalBets = wagers
      .filter((wager) => wager.game_id === gameId)
      .length;
  }
  
  return (
    <div className="postgame-drawer-container">
      {/* Collapse/expand button */}
      <button 
        className="postgame-drawer-toggle"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <span>Bet Summary</span>
        <FontAwesomeIcon
          icon={expanded ? faChevronDown : faChevronUp}
          size="sm"
        />
      </button>
      
      {/* Drawer content */}
      <div className={`postgame-drawer ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="postgame-drawer-header">
          <h3>Game Results</h3>
          <FontAwesomeIcon
            className="postgame-close-icon"
            icon={faTimes}
            onClick={() => setHide(true)}
          />
        </div>
        
        <div className="postgame-drawer-content">
          <div className="postgame-player-info">
            <h4>White ({game.player_white.elo}) vs. Black ({game.player_black.elo})</h4>
          </div>
          
          <div className="postgame-bet-summary">
            {hasBets ? (
              <div className="postgame-stats-container">
                <StatLine winnings={winnings} losses={losses} betType='win' resolvedWagers={props.resolvedWagers} />
                <StatLine winnings={winnings} losses={losses} betType='loss' resolvedWagers={props.resolvedWagers} />
                <hr />
                <div className="stat-line">
                  <p className="stat-line-left">Total</p>
                  <div className="stat-line-right">
                    <div />
                    <p className={profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                      {profit >= 0 ? '+' : '-'}${Math.abs(profit).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="no-bets-text">
                Looks like you didn&apos;t place any bets 😢 There's always next game!
              </p>
            )}
          </div>
          
          <button
            type="button"
            className="back-to-dashboard-btn"
            onClick={() => history.push('/')}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostgameModal;