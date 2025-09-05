import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';

const CELL = 20;
const LEVEL = [
  '###############',
  '#.............#',
  '#.###.###.###.#',
  '#.............#',
  '#.###.#.#.###.#',
  '#.....#.#.....#',
  '###.#.#.#.#.###',
  '#.............#',
  '#.###.#.#.###.#',
  '#.............#',
  '###############',
];
const ROWS = LEVEL.length;
const COLS = LEVEL[0].length;

interface Ghost {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

const directions = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
];

const PacmanCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<string[][]>(LEVEL.map((r) => r.split('')));
  const pacmanRef = useRef({ x: 1, y: 1, dx: 0, dy: 0 });
  const ghostsRef = useRef<Ghost[]>([
    { x: 7, y: 5, dx: 1, dy: 0 },
    { x: 7, y: 6, dx: -1, dy: 0 },
  ]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [state, setState] = useState<'playing' | 'over' | 'clear'>('playing');

  const reset = useCallback(() => {
    mapRef.current = LEVEL.map((r) => r.split(''));
    pacmanRef.current = { x: 1, y: 1, dx: 0, dy: 0 };
    ghostsRef.current = [
      { x: 7, y: 5, dx: 1, dy: 0 },
      { x: 7, y: 6, dx: -1, dy: 0 },
    ];
    setScore(0);
    setLives(3);
    setState('playing');
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = mapRef.current[y][x];
        if (cell === '#') {
          ctx.fillStyle = '#0033cc';
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        } else if (cell === '.') {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(
            x * CELL + CELL / 2,
            y * CELL + CELL / 2,
            3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(
      pacmanRef.current.x * CELL + CELL / 2,
      pacmanRef.current.y * CELL + CELL / 2,
      CELL / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ghostsRef.current.forEach((g) => {
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(
        g.x * CELL + CELL / 2,
        g.y * CELL + CELL / 2,
        CELL / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }, []);

  const step = useCallback(() => {
    if (state !== 'playing') return;
    const nextX = pacmanRef.current.x + pacmanRef.current.dx;
    const nextY = pacmanRef.current.y + pacmanRef.current.dy;
    if (mapRef.current[nextY][nextX] !== '#') {
      pacmanRef.current.x = nextX;
      pacmanRef.current.y = nextY;
      if (mapRef.current[nextY][nextX] === '.') {
        mapRef.current[nextY][nextX] = ' ';
        setScore((s) => s + 10);
      }
    }

    ghostsRef.current.forEach((g) => {
      const nx = g.x + g.dx;
      const ny = g.y + g.dy;
      if (mapRef.current[ny][nx] === '#') {
        const opts = directions.filter(
          (d) => mapRef.current[g.y + d.dy][g.x + d.dx] !== '#'
        );
        const r = opts[Math.floor(Math.random() * opts.length)];
        g.dx = r.dx;
        g.dy = r.dy;
      }
      g.x += g.dx;
      g.y += g.dy;
    });

    ghostsRef.current.forEach((g) => {
      if (g.x === pacmanRef.current.x && g.y === pacmanRef.current.y) {
        setLives((l) => {
          const nl = l - 1;
          if (nl <= 0) setState('over');
          return nl;
        });
        pacmanRef.current = { x: 1, y: 1, dx: 0, dy: 0 };
      }
    });

    const remaining = mapRef.current.flat().some((c) => c === '.');
    if (!remaining) setState('clear');

    draw();
  }, [draw, state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
    draw();
    const interval = setInterval(step, 200);
    return () => clearInterval(interval);
  }, [draw, step]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright', 'r'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (key === 'r') {
        reset();
        return;
      }
      if (state !== 'playing') return;
      if (key === 'w' || key === 'arrowup') {
        pacmanRef.current.dx = 0;
        pacmanRef.current.dy = -1;
      } else if (key === 's' || key === 'arrowdown') {
        pacmanRef.current.dx = 0;
        pacmanRef.current.dy = 1;
      } else if (key === 'a' || key === 'arrowleft') {
        pacmanRef.current.dx = -1;
        pacmanRef.current.dy = 0;
      } else if (key === 'd' || key === 'arrowright') {
        pacmanRef.current.dx = 1;
        pacmanRef.current.dy = 0;
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [reset, state]);

  return (
    <GameLayout
      title="🟡 Pac-Man"
      topInfo={<div>Score: {score} | Lives: {lives}</div>}
      bottomInfo={<div>WASD/Arrow 이동, R=Reset</div>}
    >
      <GameCanvas
        ref={canvasRef}
        gameTitle="Pac-Man"
        width={COLS * CELL}
        height={ROWS * CELL}
      />
    </GameLayout>
  );
};

export default PacmanCanvas;
