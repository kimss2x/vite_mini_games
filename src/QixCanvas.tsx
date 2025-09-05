import React, { useEffect, useRef, useState, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const COLS = 30;
const ROWS = 20;
const CELL = 20;

type Cell = 0 | 1 | 2; // 0 empty, 1 territory, 2 trail

interface Pt { x: number; y: number; }
interface Enemy { x: number; y: number; dx: number; dy: number; }
type Dir = 'L' | 'R' | 'U' | 'D';

export default function QixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<Cell[][]>(
    Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0))
  );
  const headRef = useRef<Pt>({ x: Math.floor(COLS / 2), y: 0 });
  const dirRef = useRef<Dir>('R');
  const trailRef = useRef<Pt[]>([]);
  const enemyRef = useRef<Enemy>({
    x: (COLS * CELL) / 2,
    y: (ROWS * CELL) / 2,
    dx: 2,
    dy: 2,
  });
  const [score, setScore] = useState(0);
  const [state, setState] = useState<'playing' | 'over'>('playing');

  const initGrid = useCallback(() => {
    const grid = gridRef.current;
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) grid[y][x] = y === 0 ? 1 : 0;
    headRef.current = { x: Math.floor(COLS / 2), y: 0 };
    dirRef.current = 'R';
    trailRef.current = [];
    enemyRef.current = {
      x: (COLS * CELL) / 2,
      y: (ROWS * CELL) / 2,
      dx: 2,
      dy: 2,
    };
    setScore(0);
    setState('playing');
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = gridRef.current[y][x];
        ctx.fillStyle = cell === 1 ? '#1b9aaa' : cell === 2 ? '#ef476f' : '#073b4c';
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    // trail line in progress already drawn via grid
    // draw player
    const h = headRef.current;
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(h.x * CELL, h.y * CELL, CELL, CELL);
    // draw enemy
    const e = enemyRef.current;
    ctx.fillStyle = '#06d6a0';
    ctx.beginPath();
    ctx.arc(e.x, e.y, CELL / 2, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const captureArea = () => {
    const grid = gridRef.current;
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const q: Pt[] = [];
    const push = (p: Pt) => {
      if (
        p.x >= 0 &&
        p.x < COLS &&
        p.y >= 0 &&
        p.y < ROWS &&
        !visited[p.y][p.x] &&
        grid[p.y][p.x] === 0
      ) {
        visited[p.y][p.x] = true;
        q.push(p);
      }
    };
    // flood fill from borders
    for (let x = 0; x < COLS; x++) {
      push({ x, y: 0 });
      push({ x, y: ROWS - 1 });
    }
    for (let y = 0; y < ROWS; y++) {
      push({ x: 0, y });
      push({ x: COLS - 1, y });
    }
    for (let i = 0; i < q.length; i++) {
      const { x, y } = q[i];
      push({ x: x + 1, y });
      push({ x: x - 1, y });
      push({ x, y: y + 1 });
      push({ x, y: y - 1 });
    }
    let gained = 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (grid[y][x] === 0 && !visited[y][x]) {
          grid[y][x] = 1;
          gained++;
        }
        if (grid[y][x] === 2) {
          grid[y][x] = 1;
          gained++;
        }
      }
    }
    trailRef.current = [];
    setScore((s) => s + gained);
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
    initGrid();
    draw();
    const interval = setInterval(() => {
      if (state !== 'playing') return;
      const head = headRef.current;
      const dir = dirRef.current;
      const next = {
        x: head.x + (dir === 'L' ? -1 : dir === 'R' ? 1 : 0),
        y: head.y + (dir === 'U' ? -1 : dir === 'D' ? 1 : 0),
      };
      if (
        next.x < 0 ||
        next.x >= COLS ||
        next.y < 0 ||
        next.y >= ROWS
      ) {
        setState('over');
        return;
      }
      const cell = gridRef.current[next.y][next.x];
      if (cell === 2) {
        setState('over');
        return;
      }
      headRef.current = next;
      if (cell === 0) {
        gridRef.current[next.y][next.x] = 2;
        trailRef.current.push(next);
      } else if (cell === 1 && trailRef.current.length > 0) {
        captureArea();
      }
      // move enemy
      const enemy = enemyRef.current;
      enemy.x += enemy.dx;
      enemy.y += enemy.dy;
      if (enemy.x < CELL / 2 || enemy.x > COLS * CELL - CELL / 2) enemy.dx *= -1;
      if (enemy.y < CELL / 2 || enemy.y > ROWS * CELL - CELL / 2) enemy.dy *= -1;
      // check collision with trail or player
      for (const p of trailRef.current) {
        if (Math.abs(p.x * CELL + CELL / 2 - enemy.x) < CELL / 2 &&
            Math.abs(p.y * CELL + CELL / 2 - enemy.y) < CELL / 2) {
          setState('over');
          break;
        }
      }
      if (Math.abs(headRef.current.x * CELL + CELL / 2 - enemy.x) < CELL / 2 &&
          Math.abs(headRef.current.y * CELL + CELL / 2 - enemy.y) < CELL / 2) {
        setState('over');
      }
      draw();
    }, 120);
    return () => clearInterval(interval);
  }, [draw, initGrid, state]);

  const resetGame = useCallback(() => {
    initGrid();
    draw();
  }, [draw, initGrid]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (['w', 'a', 's', 'd', 'r'].includes(key)) e.stopPropagation();
      if (key === 'r') {
        resetGame();
        return;
      }
      const dirMap: Record<string, Dir> = {
        arrowleft: 'L',
        a: 'L',
        arrowright: 'R',
        d: 'R',
        arrowup: 'U',
        w: 'U',
        arrowdown: 'D',
        s: 'D',
      };
      const nd = dirMap[key];
      if (nd) dirRef.current = nd;
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [resetGame]);

  return (
    <GameLayout
      title="❌ Qix"
      topInfo={<div>Score: {score} {state === 'over' && ' - Game Over'}</div>}
      bottomInfo={<div>WASD/Arrow 이동, R=Reset</div>}
    >
      <GameCanvas
        ref={canvasRef}
        gameTitle="Qix"
        width={COLS * CELL}
        height={ROWS * CELL}
      />
      <div style={{ marginTop: 16 }}>
        <GameButton onClick={resetGame}>Reset</GameButton>
      </div>
    </GameLayout>
  );
}
