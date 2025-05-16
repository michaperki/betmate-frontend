import React, { forwardRef } from 'react';
import Chessground from '@react-chess/chessground';
import { Config } from 'chessground/config';

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
      } : undefined,
    };

    return (
      <div ref={ref}>
        <Chessground config={safeConfig} />
      </div>
    );
  }
);

ChessgroundWrapper.displayName = 'ChessgroundWrapper';

export default ChessgroundWrapper;