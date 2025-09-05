import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { layout } from './theme/gameTheme';

const CANVAS_WIDTH = layout.maxWidth;
const CANVAS_HEIGHT = Math.round(layout.maxWidth * 0.75);
const FROG_SIZE = 40;
const SAFE_ZONE = 60;
const LANE_HEIGHT = 60;
const LANE_GAP = 20;
const LANES = 3;

interface Car {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

const FroggerCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const carsRef = useRef<Car[]>([]);
  const frogRef = useRef({ x: 0, y: 0 });

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');

  const initCars = useCallback(() => {
    const cars: Car[] = [];
    const speeds = [120, -150, 100];
    for (let i = 0; i < LANES; i++) {
      const y = CANVAS_HEIGHT - SAFE_ZONE - (i + 1) * (LANE_HEIGHT + LANE_GAP) + (LANE_HEIGHT - 40) / 2;
      for (let j = 0; j < 3; j++) {
        cars.push({
          x: j * (CANVAS_WIDTH / 3),
          y,
          width: 80,
          height: 40,
          speed: speeds[i]
        });
      }
    }
    carsRef.current = cars;
  }, []);

  const resetFrog = useCallback(() => {
    frogRef.current = {
      x: CANVAS_WIDTH / 2 - FROG_SIZE / 2,
      y: CANVAS_HEIGHT - SAFE_ZONE + (SAFE_ZONE - FROG_SIZE) / 2
    };
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setGameState('playing');
    initCars();
    resetFrog();
  }, [initCars, resetFrog]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return;
    const frog = frogRef.current;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        frog.y = Math.max(0, frog.y - FROG_SIZE);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        frog.y = Math.min(CANVAS_HEIGHT - FROG_SIZE, frog.y + FROG_SIZE);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        frog.x = Math.max(0, frog.x - FROG_SIZE);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        frog.x = Math.min(CANVAS_WIDTH - FROG_SIZE, frog.x + FROG_SIZE);
        break;
    }
    if (frog.y <= 0) {
      setScore(s => s + 1);
      resetFrog();
    }
  }, [gameState, resetFrog]);

  const update = useCallback((dt: number) => {
    if (gameState !== 'playing') return;
    const frog = frogRef.current;
    carsRef.current.forEach(car => {
      car.x += car.speed * dt;
      if (car.speed > 0 && car.x > CANVAS_WIDTH + car.width) car.x = -car.width;
      if (car.speed < 0 && car.x < -car.width) car.x = CANVAS_WIDTH + car.width;
      if (
        frog.x < car.x + car.width &&
        frog.x + FROG_SIZE > car.x &&
        frog.y < car.y + car.height &&
        frog.y + FROG_SIZE > car.y
      ) {
        setLives(l => {
          const nl = l - 1;
          if (nl <= 0) setGameState('gameover');
          return nl;
        });
        resetFrog();
      }
    });
  }, [gameState, resetFrog]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // safe zones
    ctx.fillStyle = '#3b5';
    ctx.fillRect(0, 0, CANVAS_WIDTH, SAFE_ZONE);
    ctx.fillRect(0, CANVAS_HEIGHT - SAFE_ZONE, CANVAS_WIDTH, SAFE_ZONE);

    // lanes
    ctx.fillStyle = '#555';
    for (let i = 0; i < LANES; i++) {
      const y = CANVAS_HEIGHT - SAFE_ZONE - (i + 1) * (LANE_HEIGHT + LANE_GAP);
      ctx.fillRect(0, y, CANVAS_WIDTH, LANE_HEIGHT);
    }

    // cars
    ctx.fillStyle = 'orange';
    carsRef.current.forEach(car => {
      ctx.fillRect(car.x, car.y, car.width, car.height);
    });

    // frog
    ctx.fillStyle = 'lime';
    const frog = frogRef.current;
    ctx.fillRect(frog.x, frog.y, FROG_SIZE, FROG_SIZE);
  }, []);

  const loop = useCallback((time: number) => {
    const prev = (loop as any).prev || time;
    const dt = (time - prev) / 1000;
    (loop as any).prev = time;
    update(dt);
    draw();
    animationRef.current = requestAnimationFrame(loop);
  }, [draw, update]);

  useEffect(() => {
    startGame();
    const handler = (e: KeyboardEvent) => handleKey(e);
    window.addEventListener('keydown', handler);
    animationRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('keydown', handler);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [handleKey, loop, startGame]);

  return (
    <GameManager
      title="Frogger"
      gameIcon="🐸"
      gameStats={<div>Score: {score} | Lives: {lives}</div>}
      gameStatus={gameState === 'gameover' ? 'Game Over' : undefined}
      actionButtons={<GameButton onClick={startGame}>Reset</GameButton>}
      instructions={<div>방향키로 이동하여 위쪽으로 건너가세요</div>}
    >
      <GameCanvas
        gameTitle="frogger"
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
    </GameManager>
  );
};

export default FroggerCanvas;
