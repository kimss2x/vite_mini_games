import React, { useRef, useState, useEffect, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const SIZE = 8;
const COLORS = ['#ff595e', '#1982c4', '#6a4c93', '#8ac926', '#ffca3a', '#ff924c'];
const TILE = 60;
const WIDTH = SIZE * TILE;
const HEIGHT = WIDTH;

type Board = number[][];

const randomGem = () => Math.floor(Math.random() * COLORS.length);

function findMatches(board: Board) {
  const matches = new Set<string>();
  // rows
  for (let r = 0; r < SIZE; r++) {
    let runColor = board[r][0];
    let runStart = 0;
    for (let c = 1; c <= SIZE; c++) {
      if (c < SIZE && board[r][c] === runColor) continue;
      if (runColor !== -1 && c - runStart >= 3) {
        for (let i = runStart; i < c; i++) matches.add(`${r},${i}`);
      }
      runColor = c < SIZE ? board[r][c] : -1;
      runStart = c;
    }
  }
  // columns
  for (let c = 0; c < SIZE; c++) {
    let runColor = board[0][c];
    let runStart = 0;
    for (let r = 1; r <= SIZE; r++) {
      if (r < SIZE && board[r][c] === runColor) continue;
      if (runColor !== -1 && r - runStart >= 3) {
        for (let i = runStart; i < r; i++) matches.add(`${i},${c}`);
      }
      runColor = r < SIZE ? board[r][c] : -1;
      runStart = r;
    }
  }
  return Array.from(matches).map(s => s.split(',').map(Number) as [number, number]);
}

function resolveBoard(board: Board) {
  let removed = 0;
  while (true) {
    const matches = findMatches(board);
    if (matches.length === 0) break;
    removed += matches.length;
    for (const [r, c] of matches) board[r][c] = -1;
    for (let c = 0; c < SIZE; c++) {
      let dest = SIZE - 1;
      for (let r = SIZE - 1; r >= 0; r--) {
        if (board[r][c] !== -1) {
          board[dest][c] = board[r][c];
          dest--;
        }
      }
      for (let r = dest; r >= 0; r--) {
        board[r][c] = randomGem();
      }
    }
  }
  return removed;
}

function createBoard(): Board {
  const board = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, randomGem));
  resolveBoard(board);
  return board;
}

const MatchThreeCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [board, setBoard] = useState<Board>(() => createBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [animating, setAnimating] = useState(false);

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setSelected(null);
    setScore(0);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (animating) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
      const c = Math.floor(x / TILE);
      const r = Math.floor(y / TILE);
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
      if (!selected) {
        setSelected([r, c]);
        return;
      }
      const [sr, sc] = selected;
      if (sr === r && sc === c) {
        setSelected(null);
        return;
      }
      if (Math.abs(sr - r) + Math.abs(sc - c) !== 1) {
        setSelected([r, c]);
        return;
      }
      const original = board.map(row => row.slice());
      const swapped = board.map(row => row.slice());
      [swapped[sr][sc], swapped[r][c]] = [swapped[r][c], swapped[sr][sc]];
      setSelected(null);
      setAnimating(true);
      const animate = () =>
        new Promise<void>(resolve => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!canvas || !ctx) {
            resolve();
            return;
          }
          const dpr = window.devicePixelRatio || 1;
          canvas.width = WIDTH * dpr;
          canvas.height = HEIGHT * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const [fr, fc] = [sr, sc];
          const [tr, tc] = [r, c];
          const fromColor = COLORS[board[fr][fc]];
          const toColor = COLORS[board[tr][tc]];
          let start: number | null = null;
          const duration = 200;
          const step = (timestamp: number) => {
            if (start === null) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            ctx.fillStyle = '#222';
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
            for (let rr = 0; rr < SIZE; rr++) {
              for (let cc = 0; cc < SIZE; cc++) {
                if ((rr === fr && cc === fc) || (rr === tr && cc === tc)) continue;
                const colorIndex = board[rr][cc];
                ctx.fillStyle = colorIndex >= 0 ? COLORS[colorIndex] : '#000';
                ctx.fillRect(cc * TILE, rr * TILE, TILE, TILE);
                ctx.strokeStyle = '#111';
                ctx.strokeRect(cc * TILE, rr * TILE, TILE, TILE);
              }
            }
            const fx = fc * TILE + (tc - fc) * TILE * progress;
            const fy = fr * TILE + (tr - fr) * TILE * progress;
            const tx = tc * TILE + (fc - tc) * TILE * progress;
            const ty = tr * TILE + (sr - tr) * TILE * progress;
            ctx.fillStyle = fromColor;
            ctx.fillRect(fx, fy, TILE, TILE);
            ctx.strokeStyle = '#111';
            ctx.strokeRect(fx, fy, TILE, TILE);
            ctx.fillStyle = toColor;
            ctx.fillRect(tx, ty, TILE, TILE);
            ctx.strokeStyle = '#111';
            ctx.strokeRect(tx, ty, TILE, TILE);
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              resolve();
            }
          };
          requestAnimationFrame(step);
        });
      animate().then(() => {
        const resolved = swapped.map(row => row.slice());
        const cleared = resolveBoard(resolved);
        if (cleared > 0) {
          setScore(s => s + cleared);
          setBoard(resolved);
        } else {
          setBoard(original);
        }
        setAnimating(false);
      });
    },
    [board, selected, animating]
  );

  useEffect(() => {
    if (animating) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const colorIndex = board[r][c];
        ctx.fillStyle = colorIndex >= 0 ? COLORS[colorIndex] : '#000';
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        ctx.strokeStyle = '#111';
        ctx.strokeRect(c * TILE, r * TILE, TILE, TILE);
      }
    }
    if (selected) {
      const [r, c] = selected;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.strokeRect(c * TILE + 2, r * TILE + 2, TILE - 4, TILE - 4);
    }
  }, [board, selected, animating]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'r'].includes(key)) {
        e.stopPropagation();
      }
      if (key === 'r') {
        e.preventDefault();
        resetGame();
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [resetGame]);

  return (
    <GameLayout
      title="💎 Match-3"
      topInfo={<div>Score: {score}</div>}
      bottomInfo={<div>인접한 보석을 클릭해 교환하세요. 3개 이상 매치하면 제거됩니다. R=Reset</div>}
    >
      <GameCanvas
        ref={canvasRef}
        gameTitle="Match-3"
        width={WIDTH}
        height={HEIGHT}
        onClick={handleClick}
      />
      <div style={{ marginTop: 16 }}>
        <GameButton onClick={resetGame}>Reset</GameButton>
      </div>
    </GameLayout>
  );
};

export default MatchThreeCanvas;

