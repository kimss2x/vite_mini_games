import React, { forwardRef } from 'react';

interface PureGameCanvasProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  width: number;
  height: number;
  gameTitle?: string;
}

/**
 * 순수한 게임 캔버스 컴포넌트
 * - UI 장식 없이 게임 렌더링에만 집중
 * - 모든 UI 관리는 GameManager가 담당
 */
const PureGameCanvas = forwardRef<HTMLCanvasElement, PureGameCanvasProps>(
  ({ width, height, gameTitle, style, ...props }, ref) => {
    return (
      <canvas
        ref={ref}
        width={width}
        height={height}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
          ...style
        }}
        aria-label={gameTitle || 'Game Canvas'}
        {...props}
      />
    );
  }
);

PureGameCanvas.displayName = 'PureGameCanvas';

export default PureGameCanvas;