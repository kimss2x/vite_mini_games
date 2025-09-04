import React, { useState, useEffect, useCallback } from 'react';
import GameManager from './components/GameManager';
import GameButton from './components/GameButton';

const GRID_SIZE = 3;
const GAME_TIME = 30; // seconds
const SPAWN_INTERVAL = 800; // ms

const WhackAMoleCanvas: React.FC = () => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [active, setActive] = useState<number | null>(null);
  const [running, setRunning] = useState(true);

  // 두더지 출현 타이머
  useEffect(() => {
    if (!running) return;
    const moleTimer = setInterval(() => {
      setActive(Math.floor(Math.random() * GRID_SIZE * GRID_SIZE));
    }, SPAWN_INTERVAL);
    return () => clearInterval(moleTimer);
  }, [running]);

  // 게임 시간 카운트다운
  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
      setActive(null);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, running]);

  const whack = useCallback((index: number) => {
    if (!running) return;
    if (index === active) {
      setScore(s => s + 1);
      setActive(null);
    }
  }, [active, running]);

  const reset = () => {
    setScore(0);
    setTimeLeft(GAME_TIME);
    setRunning(true);
  };

  const gridSize = 100;
  const grid = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, ${gridSize}px)`,
        gap: 8,
        justifyContent: 'center'
      }}
    >
      {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
        <div
          key={i}
          onClick={() => whack(i)}
          style={{
            width: gridSize,
            height: gridSize,
            background: '#444',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          {active === i && (
            <div
              style={{
                width: gridSize * 0.6,
                height: gridSize * 0.6,
                borderRadius: '50%',
                background: '#8B4513'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );

  const gameStats = (
    <div style={{ textAlign: 'center', color: '#bcbcbe' }}>
      <div>점수: {score}</div>
      <div>남은 시간: {timeLeft}s</div>
    </div>
  );

  const actionButtons = (
    <GameButton onClick={reset} variant="primary" size="large">
      다시 시작
    </GameButton>
  );

  const instructions = '두더지를 클릭해 점수를 올리세요! 30초 동안 최대한 많이 잡으세요.';

  return (
    <GameManager
      title="Whack-a-Mole"
      gameIcon="🐹"
      gameStats={gameStats}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      {grid}
    </GameManager>
  );
};

export default WhackAMoleCanvas;
