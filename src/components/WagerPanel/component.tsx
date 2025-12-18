import React from 'react';
import BalanceIcon from 'assets/wager_panel/balance-icon.svg';
import { WDLBar, WDLProbability } from 'components/WagerPanel/helper_components';
import WagerSubPanel from 'components/WagerSubPanel';
import { useParams } from 'react-router';
import { Game } from 'types/resources/game';
import { useMode } from 'context/ModeContext';

interface WagerPanelProps {
  isAuthenticated: boolean,
  tokenBalance?: number,
  cashBalance?: number,
  games: Record<string, Game>,
}

const WagerPanel: React.FC<WagerPanelProps> = (props) => {
  const { id: gameId } = useParams<{ id: string }>();
  const { mode } = useMode();

  const displayBalance = mode === 'real' ? (props.cashBalance ?? 0) : (props.tokenBalance ?? 0);

  return (
    <div className="wager-panel-container">
      {(props.isAuthenticated) && (
        <div className="balance-text">
          <p>Balance: {displayBalance.toFixed(2)} {mode === 'real' ? 'USDT' : 'KBITZ'}</p>
          <img src={BalanceIcon} />
        </div>
      )}
      <WagerSubPanel betType="move" />
      <WagerSubPanel betType="wdl"/>
      <div>
        <WDLProbability odds={props.games[gameId]?.odds} height={20}/>
        <WDLBar odds={props.games[gameId]?.odds} height={20}/>
      </div>
    </div>
  );
};

export default WagerPanel;
