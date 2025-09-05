import React, {
  useRef,
  useEffect,
  useState,
  useCallback
} from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const COLS = 6;
const ROWS = 12;
const CELL = 30;
const COLORS = ['#ff595e', '#1982c4', '#6a4c93', '#8ac926'];

interface Pair {
  x: number;
  y: number;
  rotation: number; // 0 up, 1 right, 2 down, 3 left
  colors: [number, number];
}

const randColor = () => Math.floor(Math.random() * COLORS.length);

const PuyoPuyoCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<number[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(-1))
  );
  const pairRef = useRef<Pair | null>(null);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<'playing' | 'over'>('playing');

  const getBlocks = (p: Pair) => {
    const blocks = [{ x: p.x, y: p.y, color: p.colors[0] }];
    let dx = 0,
      dy = -1;
    if (p.rotation % 4 === 1) {
      dx = 1;
      dy = 0;
    } else if (p.rotation % 4 === 2) {
      dy = 1;
    } else if (p.rotation % 4 === 3) {
      dx = -1;
      dy = 0;
    }
    blocks.push({ x: p.x + dx, y: p.y + dy, color: p.colors[1] });
    return blocks;
  };

  const canMove = (dx: number, dy: number, rotDelta: number) => {
    const p = pairRef.current;
    if (!p) return false;
    const newPair: Pair = {
      x: p.x + dx,
      y: p.y + dy,
      rotation: (p.rotation + rotDelta + 4) % 4,
      colors: p.colors,
    };
    const blocks = getBlocks(newPair);
    return blocks.every(
      (b) =>
        b.x >= 0 &&
        b.x < COLS &&
        b.y < ROWS &&
        (b.y < 0 || gridRef.current[b.y][b.x] === -1)
    );
  };

  const spawnPair = useCallback(() => {
    pairRef.current = {
      x: 2,
      y: 0,
      rotation: 0,
      colors: [randColor(), randColor()],
    };
    if (!canMove(0, 0, 0)) setState('over');
  }, [canMove]);

  const clearMatches = useCallback(() => {
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const toClear = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    let removed = false;

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const color = gridRef.current[y][x];
        if (color === -1 || visited[y][x]) continue;
        const stack = [[x, y]];
        const cells = [[x, y]];
        visited[y][x] = true;
        while (stack.length) {
          const [cx, cy] = stack.pop()!;
          for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (
              nx >= 0 &&
              nx < COLS &&
              ny >= 0 &&
              ny < ROWS &&
              !visited[ny][nx] &&
              gridRef.current[ny][nx] === color
            ) {
              visited[ny][nx] = true;
              stack.push([nx, ny]);
              cells.push([nx, ny]);
            }
          }
        }
        if (cells.length >= 4) {
          removed = true;
          cells.forEach(([cx, cy]) => (toClear[cy][cx] = true));
          setScore((s) => s + cells.length);
        }
      }
    }

    if (removed) {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (toClear[y][x]) gridRef.current[y][x] = -1;
        }
      }
      for (let x = 0; x < COLS; x++) {
        const col: number[] = [];
        for (let y = ROWS - 1; y >= 0; y--) {
          const val = gridRef.current[y][x];
          if (val !== -1) col.push(val);
        }
        for (let y = 0; y < ROWS; y++) gridRef.current[y][x] = -1;
        for (let y = 0; y < col.length; y++) {
          gridRef.current[ROWS - 1 - y][x] = col[y];
        }
      }
      clearMatches();
    }
  }, []);

  const lockPair = useCallback(() => {
    const p = pairRef.current!;
    const blocks = getBlocks(p);
    blocks.forEach((b) => {
      if (b.y >= 0 && b.y < ROWS) gridRef.current[b.y][b.x] = b.color;
    });
    pairRef.current = null;
    clearMatches();
  }, [clearMatches]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const val = gridRef.current[y][x];
        if (val !== -1) {
          ctx.fillStyle = COLORS[val];
          ctx.beginPath();
          ctx.arc(
            x * CELL + CELL / 2,
            y * CELL + CELL / 2,
            CELL / 2 - 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
    if (pairRef.current) {
      const blocks = getBlocks(pairRef.current);
      blocks.forEach((b) => {
        ctx.fillStyle = COLORS[b.color];
        ctx.beginPath();
        ctx.arc(
          b.x * CELL + CELL / 2,
          b.y * CELL + CELL / 2,
          CELL / 2 - 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
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
      if (!pairRef.current) spawnPair();
      else if (canMove(0, 1, 0)) pairRef.current.y++;
      else lockPair();
      draw();
    }, 500);
    return () => clearInterval(interval);
  }, [draw, lockPair, spawnPair, state]);

  const resetGame = useCallback(() => {
    gridRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
    pairRef.current = null;
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
      if (['a', 'd', 's', 'w', 'r'].includes(key)) {
        e.stopPropagation();
      }
      if (key === 'r') {
        resetGame();
        return;
      }
      if (state !== 'playing' || !pairRef.current) return;
      if (key === 'a' && canMove(-1, 0, 0)) {
        pairRef.current.x--;
      } else if (key === 'd' && canMove(1, 0, 0)) {
        pairRef.current.x++;
      } else if (key === 's' && canMove(0, 1, 0)) {
        pairRef.current.y++;
      } else if (key === 'w' && canMove(0, 0, 1)) {
        pairRef.current.rotation = (pairRef.current.rotation + 1) % 4;
      }
      draw();
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [canMove, draw, resetGame, state]);

  return (
    <GameLayout
      title="🍡 Puyo Puyo"
      topInfo={<div>Score: {score}</div>}
      bottomInfo={<div>A/D 좌우, S 아래, W 회전, R=Reset</div>}
    >
      <GameCanvas
        ref={canvasRef}
        gameTitle="Puyo Puyo"
        width={COLS * CELL}
        height={ROWS * CELL}
      />
      <div style={{ marginTop: 16 }}>
        <GameButton onClick={resetGame}>Reset</GameButton>
      </div>
    </GameLayout>
  );
};

export default PuyoPuyoCanvas;

