import React from 'react';
import { useHistory } from 'react-router-dom';
import { WDLBar } from 'components/WagerPanel/helper_components';

import './style.scss';
import { Game } from 'types/resources/game';

interface GameCardProps {
  game: Game
  topGame?: boolean
}

const GameCard: React.FC<GameCardProps> = (props) => {
  const history = useHistory();
  return (
    <div className='game-card'>
      <div className='game-title'>
        <div className='game-title-inner regular-text'>
          <div className='game-title-small'>
            <p className='player-name-whole player-title'>{props.game.player_white.name}</p>
            <p className='player-title'>({props.game.player_white.elo})</p>
          </div>
          <p className='vs-text'>vs</p>
          <div className='game-title-small'>
            <p className='player-name-whole player-title'>{props.game.player_black.name}</p>
            <p className='player-title'>({props.game.player_black.elo})</p>
          </div>
        </div>
      </div>
      <div className='wdl-bar'>
        <WDLBar odds={props.game.odds} height={props.topGame ? 30 : 15} />
      </div>
      <div className='actions-row'>
        <button className='join-button' onClick={() => history.push(`/chess/${props.game._id}`)}>Join Game</button>
        <button className='details-link' onClick={() => history.push(`/matches/${props.game._id}`)}>View Market</button>
      </div>
    </div>
  );
};

export default GameCard;
