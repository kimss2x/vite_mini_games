import React from 'react';
import GameManager from './GameManager';

interface GameLayoutProps {
  title: string;
  children: React.ReactNode;
  topInfo?: React.ReactNode;
  bottomInfo?: React.ReactNode;
  onBackToMenu?: () => void;
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
}) => {
  return (
    <GameManager
      title={title}
      gameStats={topInfo}
      instructions={bottomInfo}
      onBackToMenu={onBackToMenu}
    >
      {children}
    </GameManager>
  );
};

export default GameLayout;
