/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useState } from 'react';
import Slider from 'react-slider';
import { useParams } from 'react-router';

import { updateShowModal } from 'store/actionCreators/gameActionCreators';
import { createWager } from 'store/actionCreators/wagerActionCreators';
import { WDLBar } from 'components/WagerPanel/helper_components';
import GameOutcomes from 'components/WagerFormComponents/GameOutcomes';
import { Game } from 'types/resources/game';
import { WagerMessages } from '../WagerFormComponents';

import './style.scss';
import './dark-style.scss';
import { useMode } from 'context/ModeContext';

interface PregameModalProps {
  games: Record<string, Game>,
  isAuthenticated: boolean
  createWager: typeof createWager
  updateShowModal: typeof updateShowModal,
  isDarkTheme?: boolean
}

const PregameModal: React.FC<PregameModalProps> = (props) => {
  const { isDarkTheme = true } = props;
  const [wagerAmount, setWagerAmount] = useState(5);
  const [panelLoading, setPanelLoading] = useState(false);

  const { id: gameId } = useParams<{ id: string }>();
  const wagersLoading = props.games[gameId]?.pool_wagers?.move.options.length === 0;
  const { mode } = useMode();

  const handleSubmit = useCallback((wager: string) => (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    if (wagerAmount && props.isAuthenticated) {
      const currency = mode === 'real' ? 'USDT' : 'BET';
      props.createWager(
        gameId,
        wager,
        wagerAmount,
        true,
        1 / props.games[gameId].odds[wager],
        props.games[gameId].move_hist.length + 1,
        mode,
        currency,
      );
      setPanelLoading(true);
    }
  }, [wagerAmount, props.isAuthenticated, gameId, props.games[gameId], mode]);

  return (
    <div className={isDarkTheme ? "dark-blur-background" : "blur-background"}>
      <div className={isDarkTheme ? "dark-pregame-modal-container" : "pregame-modal-container"}>
        <div className={isDarkTheme ? "dark-padding-container" : "padding-container"}>
          <h1>Pre-Game Bets</h1>
          <h3>Select a winning side and an amount to bet on the outcome of the game.</h3>
          <form className={isDarkTheme ? "dark-pregame-body-container" : "pregame-body-container"}>
            <div className={isDarkTheme ? "dark-pregame-wdl-container" : "pregame-wdl-container"}>
              <WDLBar
                odds={props.games[gameId]?.odds}
                height={30}
              />
            </div>
            <Slider
              max={10}
              min={1}
              className={isDarkTheme ? "dark-slider-pregame" : "slider-pregame"}
              thumbClassName={isDarkTheme ? "dark-thumb-pregame" : "thumb-pregame"}
              trackClassName={isDarkTheme ? "dark-track-pregame" : "track-pregame"}
              renderThumb={(prps, state) => <div {...prps}>${state.valueNow}</div>}
              renderTrack={(prps) => <div {...prps} />}
              value={wagerAmount}
              onChange={(value) => setWagerAmount(value)}
            />
            <GameOutcomes
              odds={props.games[gameId]?.odds}
              wagersLoading={wagersLoading}
              handleSubmit={handleSubmit}
              isDarkTheme={isDarkTheme}
            />
            <WagerMessages
              panelLoading={panelLoading}
              setPanelLoading={setPanelLoading}
              isDarkTheme={isDarkTheme}
            />
          </form>
          <button
            className={isDarkTheme ? "dark-skip-button" : "skip-button"}
            type="button"
            onClick={() => { props.updateShowModal(gameId, false); }}
          >
            skip &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default PregameModal;
