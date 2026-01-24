import React, { forwardRef } from 'react';
import ChessgroundWrapper from '../ChessgroundWrapper';
import { Config } from 'chessground/config';
import './style.scss';

interface NewChessboardProps {
  config: Config;
  gameStatus?: 'live' | 'ending' | 'ended';
  winner?: 'white' | 'black' | 'draw';
  endType?: string;
  onRestart?: () => void;
  onReview?: () => void;
}

const NewChessboard = forwardRef<HTMLDivElement, NewChessboardProps>(
  ({ config, gameStatus = 'live', winner, endType, onRestart, onReview }, ref) => {
    return (
      <div className="new-chessboard" ref={ref}>
        <div className="new-chessboard__container">
          <ChessgroundWrapper config={config} />

          {/* Game Over Overlay */}
          {gameStatus !== 'live' && (
            <div className="new-chessboard__overlay">
              <div className="new-chessboard__overlay-content">
                <div className="new-chessboard__overlay-label">Game Over</div>
                <div className="new-chessboard__overlay-result">
                  {winner === 'white' ? (
                    <>
                      <span className="new-chessboard__overlay-piece">♔</span>
                      White Wins
                    </>
                  ) : winner === 'black' ? (
                    <>
                      <span className="new-chessboard__overlay-piece">♚</span>
                      Black Wins
                    </>
                  ) : (
                    <>
                      <span className="new-chessboard__overlay-piece">½</span>
                      Draw
                    </>
                  )}
                </div>
                {endType && <div className="new-chessboard__overlay-type">{endType}</div>}
                <div className="new-chessboard__overlay-actions">
                  {onRestart && (
                    <button 
                      onClick={onRestart}
                      className="new-chessboard__overlay-button new-chessboard__overlay-button--primary"
                    >
                      Watch Next Game
                    </button>
                  )}
                  {onReview && (
                    <button 
                      onClick={onReview}
                      className="new-chessboard__overlay-button new-chessboard__overlay-button--secondary"
                    >
                      Review Game
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

NewChessboard.displayName = 'NewChessboard';

export default NewChessboard;