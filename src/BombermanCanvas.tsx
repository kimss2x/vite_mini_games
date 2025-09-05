import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { layout } from './theme/gameTheme';

const CANVAS_WIDTH = layout.maxWidth;
const CANVAS_HEIGHT = layout.maxWidth;
const GRID_SIZE = 11;
const TILE = CANVAS_WIDTH / GRID_SIZE;

enum Cell {
  Empty,
  Solid,
  Block,
  Bomb,
  Explosion,
}

interface Bomb {
  x: number;
  y: number;
  timer: number; // ms
}

interface Explosion {
  x: number;
  y: number;
  timer: number; // ms
}

const BombermanCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gridRef = useRef<Cell[][]>([]);
  const bombsRef = useRef<Bomb[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const playerRef = useRef({ x: 1, y: 1, power: 1, capacity: 1 });

  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameover' | 'clear'>('playing');

  const initLevel = useCallback(() => {
    const grid: Cell[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        if (
          x === 0 ||
          y === 0 ||
          x === GRID_SIZE - 1 ||
          y === GRID_SIZE - 1 ||
          (x % 2 === 0 && y % 2 === 0)
        ) {
          row.push(Cell.Solid);
        } else if (x < 2 && y < 2) {
          row.push(Cell.Empty);
        } else {
          row.push(Math.random() < 0.7 ? Cell.Block : Cell.Empty);
        }
      }
      grid.push(row);
    }
    gridRef.current = grid;
    bombsRef.current = [];
    explosionsRef.current = [];
    playerRef.current = { x: 1, y: 1, power: 1, capacity: 1 };
    setScore(0);
    setGameState('playing');
  }, []);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  const tryMove = useCallback((dx: number, dy: number) => {
    const p = playerRef.current;
    const nx = p.x + dx;
    const ny = p.y + dy;
    const cell = gridRef.current[ny]?.[nx];
    if (cell === Cell.Empty) {
      p.x = nx;
      p.y = ny;
    }
  }, []);

  const placeBomb = useCallback(() => {
    const p = playerRef.current;
    if (bombsRef.current.length >= p.capacity) return;
    const existing = bombsRef.current.some((b) => b.x === p.x && b.y === p.y);
    if (existing) return;
    bombsRef.current.push({ x: p.x, y: p.y, timer: 2000 });
    gridRef.current[p.y][p.x] = Cell.Bomb;
  }, []);

  const explode = useCallback(
    (bomb: Bomb) => {
      const power = playerRef.current.power;
      const { x, y } = bomb;
      const mark = (cx: number, cy: number) => {
        const cell = gridRef.current[cy]?.[cx];
        if (cell === undefined || cell === Cell.Solid) return false;
        if (cell === Cell.Block) {
          gridRef.current[cy][cx] = Cell.Explosion;
          explosionsRef.current.push({ x: cx, y: cy, timer: 400 });
          setScore((s) => s + 1);
          return false;
        }
        gridRef.current[cy][cx] = Cell.Explosion;
        explosionsRef.current.push({ x: cx, y: cy, timer: 400 });
        return true;
      };
      gridRef.current[y][x] = Cell.Explosion;
      explosionsRef.current.push({ x, y, timer: 400 });
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      dirs.forEach(([dx, dy]) => {
        for (let i = 1; i <= power; i++) {
          const cont = mark(x + dx * i, y + dy * i);
          if (!cont) break;
        }
      });
    },
    []
  );

  const update = useCallback(
    (dt: number) => {
      if (gameState !== 'playing') return;
      bombsRef.current = bombsRef.current.filter((b) => {
        b.timer -= dt * 1000;
        if (b.timer <= 0) {
          gridRef.current[b.y][b.x] = Cell.Empty;
          explode(b);
          return false;
        }
        return true;
      });
      explosionsRef.current = explosionsRef.current.filter((ex) => {
        ex.timer -= dt * 1000;
        if (ex.timer <= 0) {
          if (gridRef.current[ex.y][ex.x] === Cell.Explosion) {
            gridRef.current[ex.y][ex.x] = Cell.Empty;
          }
          return false;
        }
        return true;
      });
      const p = playerRef.current;
      if (gridRef.current[p.y][p.x] === Cell.Explosion) {
        setGameState('gameover');
      } else {
        const remains = gridRef.current.some((row) => row.some((c) => c === Cell.Block));
        if (!remains) setGameState('clear');
      }
    },
    [explode, gameState]
  );

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = gridRef.current[y][x];
        switch (cell) {
          case Cell.Solid:
            ctx.fillStyle = '#444';
            break;
          case Cell.Block:
            ctx.fillStyle = '#a0522d';
            break;
          case Cell.Bomb:
            ctx.fillStyle = '#000';
            break;
          case Cell.Explosion:
            ctx.fillStyle = 'orange';
            break;
          default:
            ctx.fillStyle = '#222';
        }
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        ctx.strokeStyle = '#111';
        ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    const p = playerRef.current;
    ctx.fillStyle = '#0af';
    ctx.fillRect(p.x * TILE + TILE * 0.1, p.y * TILE + TILE * 0.1, TILE * 0.8, TILE * 0.8);
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      update(dt);
      if (ctx) draw(ctx);
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [draw, update]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'r', 'R'].includes(
          e.key
        )
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === 'r' || e.key === 'R') {
        initLevel();
        return;
      }
      if (gameState !== 'playing') return;
      switch (e.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
          tryMove(0, -1);
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          tryMove(0, 1);
          break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
          tryMove(-1, 0);
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          tryMove(1, 0);
          break;
        case ' ':
          placeBomb();
          break;
      }
    },
    [gameState, initLevel, placeBomb, tryMove]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);

  const gameStatus =
    gameState === 'gameover'
      ? '💀 게임 오버! R로 리셋'
      : gameState === 'clear'
      ? '✅ 클리어! R로 리셋'
      : undefined;

  return (
    <GameManager
      title="Bomberman-lite"
      gameIcon="💣"
      gameStats={<div>부순 벽: {score}</div>}
      gameStatus={gameStatus}
      instructions={<div>WASD/←→↑↓ 이동, Space 폭탄, R 리셋</div>}
    >
      <GameCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        gameTitle="Bomberman-lite"
      />
      <div style={{ marginTop: 12 }}>
        <GameButton onClick={initLevel}>Reset</GameButton>
      </div>
    </GameManager>
  );
};

export default BombermanCanvas;

