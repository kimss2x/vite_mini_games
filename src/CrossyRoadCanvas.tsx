import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { layout } from './theme/gameTheme';

const CANVAS = layout.maxWidth;
const COLS = 9;
const ROWS = 13;
const TILE = CANVAS / COLS;

type RowType = 'grass' | 'road';
interface Row {
  type: RowType;
  cars: number[];
  dir: number;
  speed: number; // tiles per ms
}

function makeRow(): Row {
  if (Math.random() < 0.5) {
    return { type: 'grass', cars: [], dir: 0, speed: 0 };
  }
  const dir = Math.random() < 0.5 ? 1 : -1;
  const speed = 0.003 + Math.random() * 0.003; // tiles per ms
  const spacing = 3;
  const cars: number[] = [];
  for (let i = 0; i < COLS; i += spacing) {
    cars.push(dir === 1 ? -i : COLS - 1 + i);
  }
  return { type: 'road', cars, dir, speed };
}

const CrossyRoadCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rowsRef = useRef<Row[]>([]);
  const playerRef = useRef({ x: Math.floor(COLS / 2), y: ROWS - 1 });
  const [player, setPlayer] = useState(playerRef.current);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<'playing' | 'gameover'>('playing');
  const stateRef = useRef<'playing' | 'gameover'>('playing');
  const raf = useRef<number>();
  const last = useRef<number>(0);

  const reset = useCallback(() => {
    const init: Row[] = [];
    for (let i = 0; i < ROWS; i++) {
      if (i === ROWS - 1) init.push({ type: 'grass', cars: [], dir: 0, speed: 0 });
      else init.push(makeRow());
    }
    rowsRef.current = init;
    playerRef.current = { x: Math.floor(COLS / 2), y: ROWS - 1 };
    setPlayer(playerRef.current);
    setScore(0);
    setState('playing');
    stateRef.current = 'playing';
    last.current = 0;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  const step = useCallback((time: number) => {
    if (!last.current) last.current = time;
    const dt = time - last.current;
    last.current = time;

    rowsRef.current = rowsRef.current.map((row) => {
      if (row.type === 'road') {
        const cars = row.cars.map((c) => {
          let n = c + row.dir * row.speed * dt;
          if (row.dir === 1 && n > COLS) n = -1;
          if (row.dir === -1 && n < -1) n = COLS;
          return n;
        });
        return { ...row, cars };
      }
      return row;
    });

    const p = playerRef.current;
    const row = rowsRef.current[p.y];
    if (stateRef.current === 'playing' && row.type === 'road') {
      for (const c of row.cars) {
        if (Math.abs(c - p.x) < 0.5) {
          setState('gameover');
          stateRef.current = 'gameover';
          break;
        }
      }
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);
    raf.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current!);
  }, [step]);

  const move = useCallback((dx: number, dy: number) => {
    if (stateRef.current !== 'playing') return;
    let nx = Math.min(Math.max(playerRef.current.x + dx, 0), COLS - 1);
    let ny = playerRef.current.y + dy;
    if (dy < 0) {
      setScore((s) => s + 1);
      if (ny < 2) {
        rowsRef.current.unshift(makeRow());
        rowsRef.current.pop();
        ny += 1;
      }
    }
    if (ny > ROWS - 1) ny = ROWS - 1;
    if (ny < 0) ny = 0;
    playerRef.current = { x: nx, y: ny };
    setPlayer(playerRef.current);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (
      ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'r', 'R'].includes(e.key)
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
    switch (e.key) {
      case 'a':
      case 'A':
      case 'ArrowLeft':
        move(-1, 0);
        break;
      case 'd':
      case 'D':
      case 'ArrowRight':
        move(1, 0);
        break;
      case 'w':
      case 'W':
      case 'ArrowUp':
        move(0, -1);
        break;
      case 's':
      case 'S':
      case 'ArrowDown':
        move(0, 1);
        break;
      case 'r':
      case 'R':
        reset();
        break;
    }
  }, [move, reset]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS, CANVAS);
    for (let y = 0; y < ROWS; y++) {
      const row = rowsRef.current[y];
      ctx.fillStyle = row.type === 'grass' ? '#3a5' : '#555';
      ctx.fillRect(0, y * TILE, CANVAS, TILE);
      if (row.type === 'road') {
        ctx.font = `${TILE * 0.8}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const c of row.cars) {
          ctx.fillText('🚗', c * TILE + TILE / 2, y * TILE + TILE / 2);
        }
      }
    }
    ctx.font = `${TILE * 0.8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐥', playerRef.current.x * TILE + TILE / 2, playerRef.current.y * TILE + TILE / 2);
  }, []);

  const status = state === 'gameover' ? '💀 게임 오버! R로 리셋' : undefined;

  return (
    <GameManager
      title="Crossy Road"
      gameIcon="🐥"
      gameStats={<div>Score: {score}</div>}
      gameStatus={status}
      instructions={<div>WASD/←↑→↓ 이동, R 리셋</div>}
    >
      <GameCanvas ref={canvasRef} width={CANVAS} height={CANVAS} gameTitle="Crossy Road" />
      <div style={{ marginTop: 12 }}>
        <GameButton onClick={reset}>Reset</GameButton>
      </div>
    </GameManager>
  );
};

export default CrossyRoadCanvas;
