/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router';
import { useHistory } from 'react-router-dom';
import Slider from 'react-slider';

import { GameOutcomes, MoveOptions, WagerMessages } from 'components/WagerFormComponents';
import { onEnterMovePanel, onLeaveMovePanel } from 'store/actionCreators/chessgroundActionCreators';
import { Game } from 'types/resources/game';
import { createWager } from 'store/actionCreators/wagerActionCreators';
import { useMode } from 'context/ModeContext';
import { realWdlMultiplier } from 'utils/realOdds';
import { modeCurrency, currencySymbol } from 'utils/currency';

interface WagerSubPanelProps {
  onEnterMovePanel: typeof onEnterMovePanel
  onLeaveMovePanel: typeof onLeaveMovePanel
  isAuthenticated: boolean
  betType: 'wdl' | 'move',
  games: Record<string, Game>
  createWager: typeof createWager
}

const WagerSubPanel: React.FC<WagerSubPanelProps> = (props) => {
  const [wagerAmount, setWagerAmount] = useState(5);
  const [panelLoading, setPanelLoading] = useState(false);
  const { id: gameId } = useParams<{ id: string }>();
  const history = useHistory();
  const { mode, risk } = useMode();

  const wagersLoading = !props.games[gameId]?.pool_wagers?.move?.options?.length;

  const handleSubmit = useCallback((wdl: boolean) => (wager: string) => (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    if (!props.isAuthenticated) { history.push('/signin'); return; }
    if (wagerAmount && props.isAuthenticated) {
      // Map wager string to the correct odds property name
      let oddsValue = 1;
      if (wdl) {
        // For WDL wagers, map the wager type to the correct odds property
        if (wager === 'white_win') {
          oddsValue = mode === 'real'
            ? realWdlMultiplier('white_win', props.games[gameId].odds.white_win, undefined, risk as any)
            : (1 / props.games[gameId].odds.white_win);
        } else if (wager === 'black_win') {
          oddsValue = mode === 'real'
            ? realWdlMultiplier('black_win', props.games[gameId].odds.black_win, undefined, risk as any)
            : (1 / props.games[gameId].odds.black_win);
        } else if (wager === 'draw') {
          oddsValue = mode === 'real'
            ? realWdlMultiplier('draw', props.games[gameId].odds.draw, undefined, risk as any)
            : (1 / props.games[gameId].odds.draw);
        }
      }

      const currency = mode === 'real' ? 'USDT' : 'BET';
      props.createWager(
        gameId,
        wager,
        wagerAmount,
        wdl,
        oddsValue,
        props.games[gameId].move_hist.length + 1,
        mode,
        currency,
      );
      setPanelLoading(true);
    }
  }, [wagerAmount, props.isAuthenticated, gameId, props.games[gameId], mode, risk, history]);

  const wagerExplanation = props.betType === 'move'
    ? `Bet on which move will happen next. Win ${mode === 'real' ? 'cash' : 'tokens'} from others in the pool.`
    : `Bet on the outcome of the game. Win ${mode === 'real' ? 'cash' : 'tokens'} from the ${mode === 'real' ? 'house' : 'house'}.`;

  const handleMouseEnter = () => props.betType === 'move' && props.onEnterMovePanel();
  const handleMouseLeave = () => props.betType === 'move' && props.onLeaveMovePanel();

  return (
    <div className={`bet-subpanel ${props.betType}`} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className='wager-header'>
        <h1>{props.betType === 'move' ? 'Move' : 'Game'} Betting</h1>
        <p>{wagerExplanation}</p>
      </div>
      <form>
        <Slider
          max={10}
          min={1}
          className="slider"
          thumbClassName={`thumb thumb-${props.betType}`}
          trackClassName={`track track-${props.betType}`}
          renderThumb={(prps, state) => <div {...prps}>{`${currencySymbol(modeCurrency(mode))}${state.valueNow}`}</div>}
          renderTrack={(prps) => <div {...prps} />}
          value={wagerAmount}
          onChange={(value) => setWagerAmount(value)}
        />
        {props.betType === 'move'
          ? (
            <MoveOptions
              wagersLoading={wagersLoading}
              handleSubmit={handleSubmit(false)}
            />
          ) : (
            <GameOutcomes
              odds={props.games[gameId]?.odds}
              wagersLoading={wagersLoading}
              handleSubmit={handleSubmit(true)}
            />
          )
        }
        <WagerMessages
          panelLoading={panelLoading}
          setPanelLoading={setPanelLoading}
        />
      </form>
    </div>
  );
};

export default WagerSubPanel;
