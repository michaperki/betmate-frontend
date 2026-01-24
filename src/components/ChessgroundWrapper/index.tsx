import React, { forwardRef } from 'react';
import Chessground from '@react-chess/chessground';
import { Config } from 'chessground/config';
import './style.scss';
// Ensure Chessground core styles and themes are loaded for the new UI
import 'chessground/assets/chessground.base.css';
import 'chessground/assets/chessground.brown.css';
import 'chessground/assets/chessground.cburnett.css';

interface ChessgroundWrapperProps {
  config: Config;
}

// This wrapper ensures the config is properly formatted before passing to Chessground
const ChessgroundWrapper = forwardRef<HTMLDivElement, ChessgroundWrapperProps>(
  ({ config }, ref) => {
    // Ensure movable has rookCastle property defined
    const safeConfig: Config = {
      ...config,
      movable: config.movable ? {
        ...config.movable,
        rookCastle: config.movable.rookCastle ?? true,
      } : {
        free: false,
        color: 'both',
        rookCastle: true,
      },
    };

    return (
      <div className="cg-wrap" ref={ref}>
        <Chessground config={safeConfig} />
      </div>
    );
  }
);

ChessgroundWrapper.displayName = 'ChessgroundWrapper';

export default ChessgroundWrapper;
