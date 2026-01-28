import React, { forwardRef } from 'react';
import { Config } from 'chessground/config';
import ChessgroundWrapper from '../ChessgroundWrapper';
import './style.scss';

interface ChessboardProps {
  config: Config;
  gameStatus?: 'live' | 'ending' | 'ended';
  winner?: 'white' | 'black' | 'draw';
  endType?: string;
  onRestart?: () => void;
  onReview?: () => void;
}

const Chessboard = forwardRef<HTMLDivElement, ChessboardProps>(
  ({
    config, gameStatus = 'live', winner, endType, onRestart, onReview,
  }, ref) => {
    return (
      <div className="chessboard" ref={ref}>
        <div className="chessboard__container">
          <ChessgroundWrapper config={config} />

          {/* Game Over Overlay */}
          {gameStatus !== 'live' && (
            <div className="chessboard__overlay">
              <div className="chessboard__overlay-content">
                <div className="chessboard__overlay-label">Game Over</div>
                <div className="chessboard__overlay-result">
                  {winner === 'white' ? (
                    <>
                      <span className="chessboard__overlay-piece">♔</span>
                      White Wins
                    </>
                  ) : winner === 'black' ? (
                    <>
                      <span className="chessboard__overlay-piece">♚</span>
                      Black Wins
                    </>
                  ) : (
                    <>
                      <span className="chessboard__overlay-piece">½</span>
                      Draw
                    </>
                  )}
                </div>
                {endType && <div className="chessboard__overlay-type">{endType}</div>}
                <div className="chessboard__overlay-actions">
                  {onRestart && (
                    <button
                      onClick={onRestart}
                      className="chessboard__overlay-button chessboard__overlay-button--primary"
                    >
                      Watch Next Game
                    </button>
                  )}
                  {onReview && (
                    <button
                      onClick={onReview}
                      className="chessboard__overlay-button chessboard__overlay-button--secondary"
                    >
                      Dashboard
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

Chessboard.displayName = 'Chessboard';

export default Chessboard;
