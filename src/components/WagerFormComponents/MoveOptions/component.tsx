import React from 'react';
import { useParams } from 'react-router';
import { Chess } from 'chess.js';
import { VerticalBar } from 'components/WagerPanel/helper_components';
import { Game } from 'types/resources/game';
import { moveOptionColors } from 'utils/config';

interface MoveOptionsProps {
  wagersLoading: boolean
  handleSubmit: (wager: string) => (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  games: Record<string, Game>
  isAuthenticated: boolean
  onMoveHover: (shapes: Array<{ orig: string; dest: string }>) => void
  onMoveUnhover: () => void
}

const MoveOptions: React.FC<MoveOptionsProps> = (props) => {
  const { id: gameId } = useParams<{ id: string }>();

  const renderMoveOptions = () => {
    const { options, wagers } = props.games[gameId]?.pool_wagers?.move;

    if (!options || !wagers) return <div />;

    const totalPool = wagers.reduce((acc, w) => acc + w.amount, 0);

    const poolPerMove: Record<string, number> = wagers.reduce((currObj, { amount, data }) => {
      const field = options.includes(data) ? data : 'Other';
      return {
        ...currObj,
        [field]: currObj[field] + amount,
      };
    }, {
      ...options.reduce((obj, move) => ({ ...obj, [move]: 0 }), {}),
      Other: 0,
    });

    const maxPercentage = (
      Object
        .values(poolPerMove)
        .reduce((currMax, movePool) => Math.max(currMax, movePool / totalPool), 0)
    );

    return Object.entries(poolPerMove)
      .map(([move, movePool], i) => (
        <div
          key={move}
          className={`move-option ${props.isAuthenticated ? 'move-auth' : ''}`}
          style={{ borderColor: props.isAuthenticated ? moveOptionColors[i] : 'grey' }}
          onMouseEnter={() => {
            const chess = new Chess(props.games[gameId].state);
            try {
              const moveObj = chess.move(move, { sloppy: true });
              if (moveObj && props.onMoveHover) {
                props.onMoveHover([{ orig: moveObj.from, dest: moveObj.to }]);
              }
            } catch (e) {
              console.error('Invalid move', e);
            }
          }}
          onMouseLeave={props.onMoveUnhover}
          onClick={props.handleSubmit(move)}
        >
          <VerticalBar
            color={moveOptionColors[i]}
            maxPercentage={Number(maxPercentage)}
            percentage={movePool / totalPool}
          />
          <p>{move}</p>
        </div>
      ));
  };

  return (
    <div className="options-container move-options">
      {props.wagersLoading
        ? <p>Loading...</p>
        : renderMoveOptions()}
    </div>
  );
};

export default MoveOptions;
