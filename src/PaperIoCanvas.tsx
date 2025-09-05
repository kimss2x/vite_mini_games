import React, { useEffect, useRef, useState, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const COLS = 30;
const ROWS = 20;
const CELL = 20;

type Cell = 0 | 1 | 2; // 0 empty, 1 territory, 2 trail

type Dir = 'L' | 'R' | 'U' | 'D';
interface Pt { x: number; y: number; }

export default function PaperIoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<Cell[][]>(
    Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0))
  );
  const headRef = useRef<Pt>({ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) });
  const dirRef = useRef<Dir>('R');
  const trailRef = useRef<Pt[]>([]);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<'playing' | 'over'>('playing');

  const initGrid = useCallback(() => {
    const grid = gridRef.current;
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) grid[y][x] = 0;
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    for (let y = cy - 2; y <= cy + 2; y++)
      for (let x = cx - 2; x <= cx + 2; x++) grid[y][x] = 1;
    headRef.current = { x: cx, y: cy };
    dirRef.current = 'R';
    trailRef.current = [];
    setScore(25);
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
        if (cell === 1) ctx.fillStyle = '#ffd166';
        else if (cell === 2) ctx.fillStyle = '#ef476f';
        else ctx.fillStyle = '#073b4c';
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    ctx.fillStyle = '#06d6a0';
    const h = headRef.current;
    ctx.fillRect(h.x * CELL, h.y * CELL, CELL, CELL);
  }, []);

  const captureArea = () => {
    const grid = gridRef.current;
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const q: Pt[] = [];
    const push = (p: Pt) => {
      if (
        p.x >= 0 && p.x < COLS &&
        p.y >= 0 && p.y < ROWS &&
        !visited[p.y][p.x] &&
        grid[p.y][p.x] === 0
      ) {
        visited[p.y][p.x] = true;
        q.push(p);
      }
    };
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
      const next = { x: head.x + (dir === 'L' ? -1 : dir === 'R' ? 1 : 0), y: head.y + (dir === 'U' ? -1 : dir === 'D' ? 1 : 0) };
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
      title="📄 Paper.io"
      topInfo={<div>Score: {score}</div>}
      bottomInfo={<div>WASD/Arrow 이동, R=Reset</div>}
    >
      <GameCanvas
        ref={canvasRef}
        gameTitle="Paper.io"
        width={COLS * CELL}
        height={ROWS * CELL}
      />
      <div style={{ marginTop: 16 }}>
        <GameButton onClick={resetGame}>Reset</GameButton>
      </div>
    </GameLayout>
  );
}
