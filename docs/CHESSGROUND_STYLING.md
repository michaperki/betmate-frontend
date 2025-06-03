# Chessground Styling Guide

## Overview

This document explains how the Chessground chess board is styled in our application to ensure proper responsive sizing and display across all screen sizes.

## Key Components

1. **ChessgroundWrapper Component**: Wraps the Chessground library with our custom styling
2. **fixed-chess-styling.scss**: Contains the responsive sizing logic for the board
3. **dark-style.scss**: Contains the dark theme styling for the chess match page

## How It Works

### Box Model and Sizing

The Chessground library requires specific box-sizing to render correctly:

```scss
.cg-wrap {
  box-sizing: content-box;
  width: 100%;
  height: 100%;
}
```

This ensures that the padding and borders don't interfere with the board's dimensions.

### Responsive Sizing

We use a responsive approach that scales the board based on viewport width while maintaining a 1:1 aspect ratio:

```scss
.chessboard-wrapper {
  width: min(90vw, 350px);
  height: min(90vw, 350px);
  
  @media (min-width: 769px) and (max-width: 1200px) {
    width: min(70vw, 550px);
    height: min(70vw, 550px);
  }

  @media (min-width: 1201px) {
    width: min(40vw, 600px);
    height: min(40vw, 600px);
  }
}
```

### Maintaining Aspect Ratio

We use the ::before pseudo-element to ensure the container maintains a square aspect ratio:

```scss
&::before {
  content: '';
  display: block;
  padding-top: 100%;
  margin: 0;
}
```

## Common Issues and Solutions

### Piece Cutoff

If pieces appear cut off at the edges of the board, ensure:
- `box-sizing: content-box` is applied to the chessboard wrapper
- The container has sufficient size to accommodate pieces at board edges

### Responsive Sizing Issues

If the board doesn't resize properly:
- Check that both width and height use the same responsive scaling
- Ensure the parent container allows the board to take the necessary space

### Misaligned Pieces

If pieces don't align with squares:
- Check for conflicting CSS that might override the position
- Ensure the ::before pseudo-element is maintaining the correct aspect ratio

## Implementation Notes

When making changes to the chess board styling:

1. Always test on multiple screen sizes
2. Keep the `.cg-wrap` and `.cg-board` styling minimal to avoid conflicts
3. Use the container element (`.chessboard-wrapper`) to handle responsive sizing

## References

- [Chessground Documentation](https://github.com/lichess-org/chessground)
- [CSS Box Sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing)
- [CSS Aspect Ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)