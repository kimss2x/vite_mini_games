import React, { useRef, useState, useEffect, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const SIZE = 8;
const CELL = 60;
const WIDTH = SIZE * CELL;
const HEIGHT = WIDTH;

type Piece = { type: string; color: 'w' | 'b'; moved?: boolean };
type Board = (Piece | null)[][];

const symbols: Record<string, string> = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚'
};

function initBoard(): Board {
  const b: Board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < SIZE; c++) {
    b[0][c] = { type: back[c], color: 'b', moved: false };
    b[1][c] = { type: 'p', color: 'b', moved: false };
    b[SIZE - 2][c] = { type: 'p', color: 'w', moved: false };
    b[SIZE - 1][c] = { type: back[c], color: 'w', moved: false };
  }
  return b;
}

const ChessCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<Board>(() => initBoard());
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);

  const reset = useCallback(() => {
    setBoard(initBoard());
    setTurn('w');
    setSelected(null);
  }, []);

  const inBounds = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

  const pathClear = (sr: number, sc: number, dr: number, dc: number): boolean => {
    const stepR = Math.sign(dr - sr);
    const stepC = Math.sign(dc - sc);
    let r = sr + stepR;
    let c = sc + stepC;
    while (r !== dr || c !== dc) {
      if (board[r][c]) return false;
      r += stepR;
      c += stepC;
    }
    return true;
  };

  const canMove = (sr: number, sc: number, dr: number, dc: number): boolean => {
    if (!inBounds(dr, dc)) return false;
    const piece = board[sr][sc];
    if (!piece) return false;
    const target = board[dr][dc];
    if (target && target.color === piece.color) return false;
    const dR = dr - sr;
    const dC = dc - sc;
    switch (piece.type) {
      case 'p': {
        const dir = piece.color === 'w' ? -1 : 1;
        const startRow = piece.color === 'w' ? SIZE - 2 : 1;
        if (dC === 0) {
          if (dR === dir && !target) return true;
          if (sr === startRow && dR === 2 * dir && !target && !board[sr + dir][sc]) return true;
        }
        if (Math.abs(dC) === 1 && dR === dir && target) return true;
        return false;
      }
      case 'r':
        if (dR !== 0 && dC !== 0) return false;
        return pathClear(sr, sc, dr, dc);
      case 'b':
        if (Math.abs(dR) !== Math.abs(dC)) return false;
        return pathClear(sr, sc, dr, dc);
      case 'q':
        if (dR === 0 || dC === 0) return pathClear(sr, sc, dr, dc);
        if (Math.abs(dR) === Math.abs(dC)) return pathClear(sr, sc, dr, dc);
        return false;
      case 'n':
        return (
          (Math.abs(dR) === 2 && Math.abs(dC) === 1) ||
          (Math.abs(dR) === 1 && Math.abs(dC) === 2)
        );
      case 'k':
        if (Math.max(Math.abs(dR), Math.abs(dC)) === 1) return true;
        if (dR === 0 && Math.abs(dC) === 2 && !piece.moved) {
          const rookCol = dC > 0 ? SIZE - 1 : 0;
          const rook = board[sr][rookCol];
          if (
            rook &&
            rook.type === 'r' &&
            rook.color === piece.color &&
            !rook.moved &&
            pathClear(sr, sc, sr, rookCol)
          )
            return true;
        }
        return false;
      default:
        return false;
    }
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      if (!selected) {
        const piece = board[r][c];
        if (piece && piece.color === turn) setSelected({ r, c });
        return;
      }
      if (selected.r === r && selected.c === c) {
        setSelected(null);
        return;
      }
      if (canMove(selected.r, selected.c, r, c)) {
        const newBoard = board.map(row => row.slice());
        const piece = newBoard[selected.r][selected.c];
        if (piece?.type === 'k' && Math.abs(selected.c - c) === 2) {
          const rookCol = c > selected.c ? SIZE - 1 : 0;
          const rookDest = c > selected.c ? c - 1 : c + 1;
          newBoard[r][c] = { ...piece, moved: true };
          newBoard[selected.r][selected.c] = null;
          const rook = newBoard[r][rookCol];
          if (rook) {
            newBoard[r][rookDest] = { ...rook, moved: true };
            newBoard[r][rookCol] = null;
          }
        } else {
          newBoard[r][c] = { ...piece!, moved: true };
          newBoard[selected.r][selected.c] = null;
        }
        setBoard(newBoard);
        setTurn(turn === 'w' ? 'b' : 'w');
      }
      setSelected(null);
    },
    [board, selected, turn]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#EEE' : '#999';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        const piece = board[r][c];
        if (piece) {
          ctx.fillStyle = piece.color === 'w' ? '#FFF' : '#000';
          ctx.font = '48px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(symbols[piece.type], c * CELL + CELL / 2, r * CELL + CELL / 2);
        }
      }
    }
    if (selected) {
      ctx.strokeStyle = '#00F';
      ctx.lineWidth = 3;
      ctx.strokeRect(selected.c * CELL + 2, selected.r * CELL + 2, CELL - 4, CELL - 4);
    }
  }, [board, selected]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        e.stopPropagation();
        reset();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reset]);

  return (
    <GameLayout title="Chess" bottomInfo={["말 클릭 후 이동할 칸 클릭, R: 리셋, 왕 두 칸 이동: 캐슬링"]}>
      <GameCanvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onClick={handleClick}
        gameTitle="Chess"
      />
      <GameButton onClick={reset}>Reset</GameButton>
    </GameLayout>
  );
};

export default ChessCanvas;
