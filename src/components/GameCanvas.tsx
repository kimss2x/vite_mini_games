import React, { forwardRef } from 'react';
import { canvasStyle } from '../theme/gameTheme';

interface GameCanvasProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  gameTitle: string;
}

const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(
  ({ gameTitle, style, ...props }, ref) => {
    const mergedStyle = {
      ...canvasStyle,
      ...style
    };

    return (
      <canvas
        ref={ref}
        style={mergedStyle}
        aria-label={gameTitle}
        {...props}
      />
    );
  }
);

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;