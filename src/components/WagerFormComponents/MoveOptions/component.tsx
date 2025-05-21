import React from 'react';
import { useParams } from 'react-router';
import { Chess } from 'chess.js';
import { VerticalBar } from 'components/WagerPanel/helper_components';
import { Game } from 'types/resources/game';
import { moveOptionColors } from 'utils/config';
import BotIndicator from 'components/BotIndicator';
import './style.scss';

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
    const { options: rawOptions, wagers } = props.games[gameId]?.pool_wagers?.move;

    if (!rawOptions || !wagers) return <div />;

    // Format move options before processing
    const options = rawOptions.map((move) => {
      // Handle castling notation
      if (move === 'O-O' || move === 'O-O-O') return move;

      // Force lowercase for pawn moves (any move that doesn't start with NBRQK)
      const firstChar = move.charAt(0);
      if (!/^[NBRQK]/.test(firstChar)) {
        return move.toLowerCase();
      }

      // For piece moves, keep the piece letter uppercase and rest lowercase
      return firstChar + move.substring(1).toLowerCase();
    });

    const totalPool = wagers.reduce((acc, w) => acc + w.amount, 0);

    // Check if any wagers are from bots
    const hasBotWagers = wagers.some(wager => wager.is_bot);

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

    // Track which moves have bot wagers
    const botWagerMoves = wagers
      .filter(wager => wager.is_bot)
      .reduce((moves, wager) => {
        const field = options.includes(wager.data) ? wager.data : 'Other';
        return { ...moves, [field]: true };
      }, {} as Record<string, boolean>);

    const maxPercentage = (
      Object
        .values(poolPerMove)
        .reduce((currMax, movePool) => Math.max(currMax, movePool / totalPool), 0)
    );

    // Format move display - lowercase for pawn moves, uppercase for piece moves
    const formatMove = (move: string): string => {
      if (move === 'Other') return move;

      // Handle castling notation
      if (move === 'O-O' || move === 'O-O-O') return move;

      // Force lowercase for pawn moves (any move that doesn't start with NBRQK)
      const firstChar = move.charAt(0);
      if (!/^[NBRQK]/.test(firstChar)) {
        return move.toLowerCase();
      }

      // For piece moves, keep the piece letter uppercase and rest lowercase
      return firstChar + move.substring(1).toLowerCase();
    };

    // Get all moves and add the "Other" option at the end
    const allMoves = Object.entries(poolPerMove);

    // Move "Other" to the end if it exists
    const sortedMoves = allMoves.sort((a, b) => {
      if (a[0] === 'Other') return 1;
      if (b[0] === 'Other') return -1;
      return 0;
    });

    return sortedMoves.map(([move, movePool], i) => {
      // Always show the "Other" option
      // if (move === 'Other' && movePool === 0 && allMoves.length > 1) {
      //   return null;
      // }

      return (
        <div
          key={move}
          className={`move-option ${props.isAuthenticated ? 'move-auth' : ''}`}
          style={{ borderColor: props.isAuthenticated ? moveOptionColors[i % moveOptionColors.length] : 'grey' }}
          data-move={move}
          onMouseEnter={() => {
            if (move === 'Other') return; // Skip chess move visualization for "Other"

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
          onClick={props.handleSubmit(formatMove(move))}
        >
          <VerticalBar
            color={moveOptionColors[i % moveOptionColors.length]}
            maxPercentage={Number(maxPercentage)}
            percentage={movePool / totalPool}
          />
          <div className="move-label">
            <p>{formatMove(move)}</p>
            {botWagerMoves[move] && <BotIndicator />}
          </div>
        </div>
      );
    }).filter(Boolean);
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
