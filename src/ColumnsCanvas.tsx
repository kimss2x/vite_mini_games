import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const COLS = 6;
const ROWS = 13;
const CELL = 30;
const COLORS = ['#ff595e', '#1982c4', '#8ac926'];

interface Piece {
  x: number;
  y: number; // top cell row
  colors: [number, number, number];
}

const randColor = () => Math.floor(Math.random() * COLORS.length);

const ColumnsCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<number[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(-1))
  );
  const pieceRef = useRef<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<'playing' | 'over'>('playing');

  const canMove = (dx: number, dy: number) => {
    const p = pieceRef.current;
    if (!p) return false;
    const nx = p.x + dx;
    for (let i = 0; i < 3; i++) {
      const ny = p.y + dy + i;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
      if (ny >= 0 && gridRef.current[ny][nx] !== -1) return false;
    }
    return true;
  };

  const spawnPiece = useCallback(() => {
    pieceRef.current = {
      x: Math.floor(COLS / 2),
      y: -3,
      colors: [randColor(), randColor(), randColor()],
    };
    if (!canMove(0, 0)) setState('over');
  }, []);

  const applyGravity = () => {
    for (let x = 0; x < COLS; x++) {
      let write = ROWS - 1;
      for (let y = ROWS - 1; y >= 0; y--) {
        const color = gridRef.current[y][x];
        if (color !== -1) {
          gridRef.current[write][x] = color;
          if (write !== y) gridRef.current[y][x] = -1;
          write--;
        }
      }
      for (let y = write; y >= 0; y--) gridRef.current[y][x] = -1;
    }
  };

  const clearMatches = () => {
    let removedTotal = 0;
    while (true) {
      const toClear = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
      let found = 0;
      const dirs = [
        [1, 0],
        [0, 1],
        [1, 1],
        [1, -1],
      ];
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const color = gridRef.current[y][x];
          if (color === -1) continue;
          for (const [dx, dy] of dirs) {
            const cells: [number, number][] = [[x, y]];
            let nx = x + dx;
            let ny = y + dy;
            while (
              nx >= 0 &&
              nx < COLS &&
              ny >= 0 &&
              ny < ROWS &&
              gridRef.current[ny][nx] === color
            ) {
              cells.push([nx, ny]);
              nx += dx;
              ny += dy;
            }
            nx = x - dx;
            ny = y - dy;
            while (
              nx >= 0 &&
              nx < COLS &&
              ny >= 0 &&
              ny < ROWS &&
              gridRef.current[ny][nx] === color
            ) {
              cells.push([nx, ny]);
              nx -= dx;
              ny -= dy;
            }
            if (cells.length >= 3) {
              cells.forEach(([cx, cy]) => (toClear[cy][cx] = true));
            }
          }
        }
      }
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (toClear[y][x]) {
            gridRef.current[y][x] = -1;
            found++;
          }
        }
      }
      if (!found) break;
      removedTotal += found;
      applyGravity();
    }
    if (removedTotal) setScore((s) => s + removedTotal);
  };

  const lockPiece = () => {
    const p = pieceRef.current!;
    for (let i = 0; i < 3; i++) {
      const y = p.y + i;
      if (y < 0) {
        setState('over');
        return;
      }
      gridRef.current[y][p.x] = p.colors[i];
    }
    pieceRef.current = null;
    clearMatches();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const color = gridRef.current[y][x];
        if (color !== -1) {
          ctx.fillStyle = COLORS[color];
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
        ctx.strokeStyle = '#333';
        ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    const p = pieceRef.current;
    if (p) {
      for (let i = 0; i < 3; i++) {
        const y = p.y + i;
        if (y >= 0) {
          ctx.fillStyle = COLORS[p.colors[i]];
          ctx.fillRect(p.x * CELL, y * CELL, CELL, CELL);
          ctx.strokeStyle = '#333';
          ctx.strokeRect(p.x * CELL, y * CELL, CELL, CELL);
        }
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
    draw();
    const interval = setInterval(() => {
      if (state !== 'playing') return;
      if (!pieceRef.current) spawnPiece();
      else if (canMove(0, 1)) pieceRef.current.y++;
      else lockPiece();
      draw();
    }, 500);
    return () => clearInterval(interval);
  }, [draw, spawnPiece, state]);

  const resetGame = useCallback(() => {
    gridRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
    pieceRef.current = null;
    setScore(0);
    setState('playing');
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowdown', 'arrowup'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (['a', 'd', 's', 'w', 'r', ' '].includes(key)) e.stopPropagation();
      if (key === 'r') {
        resetGame();
        return;
      }
      if (state !== 'playing' || !pieceRef.current) return;
      if (key === 'a' && canMove(-1, 0)) pieceRef.current.x--;
      else if (key === 'd' && canMove(1, 0)) pieceRef.current.x++;
      else if (key === 's' && canMove(0, 1)) pieceRef.current.y++;
      else if (key === ' ') {
        while (canMove(0, 1)) pieceRef.current.y++;
        lockPiece();
      } else if (key === 'w') {
        const colors = pieceRef.current.colors;
        colors.unshift(colors.pop()!);
      }
      draw();
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [draw, resetGame, state, lockPiece]);

  return (
    <GameLayout
      title="🔶 Columns"
      topInfo={<div>Score: {score}</div>}
      bottomInfo={<div>A/D 좌우, S 아래, W 색순환, Space 즉시드랍, R=Reset</div>}
    >
      <GameCanvas
        ref={canvasRef}
        gameTitle="Columns"
        width={COLS * CELL}
        height={ROWS * CELL}
      />
      <div style={{ marginTop: 16 }}>
        <GameButton onClick={resetGame}>Reset</GameButton>
      </div>
    </GameLayout>
  );
};

export default ColumnsCanvas;

