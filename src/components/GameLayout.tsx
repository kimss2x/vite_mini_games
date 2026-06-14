import React from 'react';
import GameManager from './GameManager';

interface GameLayoutProps {
  title: string;
  children: React.ReactNode;
  topInfo?: React.ReactNode;
  bottomInfo?: React.ReactNode;
  onBackToMenu?: () => void;
  // 게임오버/승리 배너 오버레이용 (GameManager로 전달)
  gameStatus?: string;
  score?: number;
}

/**
 * Legacy GameLayout wrapper mapping to GameManager for UI consistency
 */
const GameLayout: React.FC<GameLayoutProps> = ({
  title,
  children,
  topInfo,
  bottomInfo,
  onBackToMenu,
  gameStatus,
  score,
}) => {
  return (
    <GameManager
      title={title}
      gameStats={topInfo}
      instructions={bottomInfo}
      onBackToMenu={onBackToMenu}
      gameStatus={gameStatus}
      score={score}
    >
      {children}
    </GameManager>
  );
};

export default GameLayout;
