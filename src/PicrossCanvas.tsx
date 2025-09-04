import React, { useRef, useState, useEffect, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const SIZE = 10;
const CELL = 32;
const HINT = 40;
const WIDTH = HINT + SIZE * CELL;
const HEIGHT = HINT + SIZE * CELL;

type CellState = 0 | 1 | 2; // empty, filled, marked

function createPuzzle(): boolean[][] {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => Math.random() < 0.5)
  );
}

function createBoard(): CellState[][] {
  return Array.from({ length: SIZE }, () => Array<CellState>(SIZE).fill(0));
}

function computeHints(puzzle: boolean[][]) {
  const rows = puzzle.map((row) => {
    const hints: number[] = [];
    let count = 0;
    for (const cell of row) {
      if (cell) count++;
      else if (count) {
        hints.push(count);
        count = 0;
      }
    }
    if (count) hints.push(count);
    return hints.length ? hints : [0];
  });
  const cols = Array.from({ length: SIZE }, (_, c) => {
    const hints: number[] = [];
    let count = 0;
    for (let r = 0; r < SIZE; r++) {
      if (puzzle[r][c]) count++;
      else if (count) {
        hints.push(count);
        count = 0;
      }
    }
    if (count) hints.push(count);
    return hints.length ? hints : [0];
  });
  return { rows, cols };
}

const PicrossCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [puzzle, setPuzzle] = useState<boolean[][]>(() => createPuzzle());
  const [board, setBoard] = useState<CellState[][]>(() => createBoard());
  const [hints, setHints] = useState(() => computeHints(puzzle));
  const [state, setState] = useState<'playing' | 'won'>('playing');

  const resetGame = useCallback(() => {
    const p = createPuzzle();
    setPuzzle(p);
    setBoard(createBoard());
    setHints(computeHints(p));
    setState('playing');
  }, []);

  const checkWin = useCallback((b: CellState[][], p: boolean[][]) => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const filled = b[r][c] === 1;
        if (filled !== p[r][c]) return false;
      }
    }
    return true;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (state !== 'playing') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * WIDTH - HINT;
      const y = ((e.clientY - rect.top) / rect.height) * HEIGHT - HINT;
      if (x < 0 || y < 0) return;
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
      const newBoard = board.map((row) => row.slice());
      newBoard[r][c] = newBoard[r][c] === 1 ? 0 : 1;
      if (checkWin(newBoard, puzzle)) setState('won');
      setBoard(newBoard);
    },
    [board, checkWin, puzzle, state]
  );

  const handleRightClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (state !== 'playing') return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * WIDTH - HINT;
      const y = ((e.clientY - rect.top) / rect.height) * HEIGHT - HINT;
      if (x < 0 || y < 0) return;
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
      const newBoard = board.map((row) => row.slice());
      newBoard[r][c] = newBoard[r][c] === 2 ? 0 : 2;
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

    // draw hints
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < SIZE; r++) {
      const rowHints = hints.rows[r];
      for (let i = 0; i < rowHints.length; i++) {
        const num = rowHints[rowHints.length - 1 - i];
        ctx.fillText(String(num), HINT - 4 - i * 14, HINT + r * CELL + CELL / 2);
      }
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let c = 0; c < SIZE; c++) {
      const colHints = hints.cols[c];
      for (let i = 0; i < colHints.length; i++) {
        const num = colHints[colHints.length - 1 - i];
        ctx.fillText(String(num), HINT + c * CELL + CELL / 2, HINT - 4 - i * 14);
      }
    }

    // draw grid and cells
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const x = HINT + c * CELL;
        const y = HINT + r * CELL;
        ctx.strokeStyle = '#555';
        ctx.strokeRect(x, y, CELL, CELL);
        const val = board[r][c];
        if (val === 1) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
        } else if (val === 2) {
          ctx.strokeStyle = '#888';
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 4);
          ctx.lineTo(x + CELL - 4, y + CELL - 4);
          ctx.moveTo(x + CELL - 4, y + 4);
          ctx.lineTo(x + 4, y + CELL - 4);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#333';
          ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        }
      }
    }

    if (state === 'won') {
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('완료!', WIDTH / 2, HEIGHT / 2);
    }
  }, [board, hints, state]);

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
      title="🖼️ Picross"
      bottomInfo={<div>좌클릭: 칸 채우기, 우클릭: X, R=Reset</div>}
    >
      <GameCanvas
        ref={canvasRef}
        gameTitle="Picross"
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

export default PicrossCanvas;
