import React, { useRef, useState, useEffect, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const SIZE = 8;
const CELL = 60;
const WIDTH = SIZE * CELL;
const HEIGHT = WIDTH;

type Piece = 0 | 1 | -1; // 1: red, -1: black

function initBoard(): Piece[][] {
  const b: Piece[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) b[r][c] = -1;
    }
  }
  for (let r = SIZE - 3; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r + c) % 2 === 1) b[r][c] = 1;
    }
  }
  return b;
}

const CheckersCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<Piece[][]>(() => initBoard());
  const [turn, setTurn] = useState<Piece>(1);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);

  const reset = useCallback(() => {
    setBoard(initBoard());
    setTurn(1);
    setSelected(null);
  }, []);

  const validMove = useCallback(
    (sr: number, sc: number, dr: number, dc: number) => {
      if (dr < 0 || dr >= SIZE || dc < 0 || dc >= SIZE) return null;
      if (board[dr][dc] !== 0) return null;
      const dir = turn === 1 ? -1 : 1;
      if (dr - sr === dir && Math.abs(dc - sc) === 1) {
        return { capture: null };
      }
      if (dr - sr === dir * 2 && Math.abs(dc - sc) === 2) {
        const mr = (sr + dr) / 2;
        const mc = (sc + dc) / 2;
        if (board[mr][mc] === -turn) return { capture: { r: mr, c: mc } };
      }
      return null;
    },
    [board, turn]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      if (!selected) {
        if (board[r][c] === turn) setSelected({ r, c });
        return;
      }
      if (selected.r === r && selected.c === c) {
        setSelected(null);
        return;
      }
      const move = validMove(selected.r, selected.c, r, c);
      if (move) {
        const newBoard = board.map(row => row.slice());
        newBoard[r][c] = board[selected.r][selected.c];
        newBoard[selected.r][selected.c] = 0;
        if (move.capture) newBoard[move.capture.r][move.capture.c] = 0;
        setBoard(newBoard);
        setTurn(-turn as Piece);
      }
      setSelected(null);
    },
    [board, selected, turn, validMove]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#F0D9B5' : '#B58863';
        ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
        const piece = board[r][c];
        if (piece !== 0) {
          ctx.beginPath();
          ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, CELL * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = piece === 1 ? '#FF4444' : '#4444FF';
          ctx.fill();
        }
      }
    }
    if (selected) {
      ctx.strokeStyle = '#00FF00';
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
    <GameLayout
      title="Checkers"
      bottomInfo={['클릭으로 이동, R: 리셋']}
    >
      <GameCanvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onClick={handleClick}
        gameTitle="Checkers"
      />
      <GameButton onClick={reset}>Reset</GameButton>
    </GameLayout>
  );
};

export default CheckersCanvas;
