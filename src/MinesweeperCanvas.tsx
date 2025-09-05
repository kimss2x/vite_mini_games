import React, { useRef, useState, useEffect, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const SIZE = 10;
const MINES = 10;
const CELL = 32;
const WIDTH = SIZE * CELL;
const HEIGHT = SIZE * CELL;

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

function createBoard(): Cell[][] {
  const board: Cell[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  );
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    if (board[r][c].mine) continue;
    board[r][c].mine = true;
    placed++;
  }
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
          if (board[nr][nc].mine) count++;
        }
      }
      board[r][c].adjacent = count;
    }
  }
  return board;
}

const MinesweeperCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [board, setBoard] = useState<Cell[][]>(() => createBoard());
  const [state, setState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [flags, setFlags] = useState(0);

  const resetGame = useCallback(() => {
    setBoard(createBoard());
    setState('playing');
    setFlags(0);
  }, []);

  const flood = useCallback((b: Cell[][], r: number, c: number) => {
    const cell = b[r][c];
    if (cell.revealed || cell.flagged) return;
    cell.revealed = true;
    if (cell.mine) {
      setState('lost');
      return;
    }
    if (cell.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
          flood(b, nr, nc);
        }
      }
    }
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (state !== 'playing') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      const newBoard = board.map(row => row.map(cell => ({ ...cell })));
      flood(newBoard, r, c);
      const cleared = newBoard.every(row => row.every(cell => cell.revealed || cell.mine));
      if (cleared && state === 'playing') setState('won');
      setBoard(newBoard);
    },
    [board, flood, state]
  );

  const handleRightClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (state !== 'playing') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      const newBoard = board.map(row => row.map(cell => ({ ...cell })));
      const cell = newBoard[r][c];
      if (cell.revealed) return;
      cell.flagged = !cell.flagged;
      setFlags(f => f + (cell.flagged ? 1 : -1));
      setBoard(newBoard);
    },
    [board, state]
  );

  useEffect(() => {
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
        const cell = board[r][c];
        const x = c * CELL;
        const y = r * CELL;
        ctx.strokeStyle = '#555';
        ctx.strokeRect(x, y, CELL, CELL);
        if (cell.revealed) {
          ctx.fillStyle = '#333';
          ctx.fillRect(x, y, CELL, CELL);
          if (cell.mine) {
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(x + CELL / 2, y + CELL / 2, CELL / 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell.adjacent > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(cell.adjacent), x + CELL / 2, y + CELL / 2);
          }
        } else {
          ctx.fillStyle = '#444';
          ctx.fillRect(x, y, CELL, CELL);
          if (cell.flagged) {
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.moveTo(x + CELL * 0.3, y + CELL * 0.7);
            ctx.lineTo(x + CELL * 0.5, y + CELL * 0.3);
            ctx.lineTo(x + CELL * 0.7, y + CELL * 0.7);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    }
    if (state === 'won' || state === 'lost') {
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      const msg = state === 'won' ? '승리!' : '실패!';
      ctx.fillText(msg, WIDTH / 2, HEIGHT / 2);
    }
  }, [board, state]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        e.stopPropagation();
        resetGame();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [resetGame]);

  return (
    <GameLayout
      title="💣 Minesweeper"
      topInfo={<div>Flags: {flags}/{MINES}</div>}
      bottomInfo={<div>좌클릭: 열기, 우클릭: 깃발, R=Reset</div>}
    >
      <GameCanvas
        ref={canvasRef}
        gameTitle="Minesweeper"
        width={WIDTH}
        height={HEIGHT}
        onClick={handleClick}
        onContextMenu={handleRightClick}
      />
      <div style={{ marginTop: 16 }}>
        <GameButton onClick={resetGame}>Reset</GameButton>
      </div>
    </GameLayout>
  );
};

export default MinesweeperCanvas;
