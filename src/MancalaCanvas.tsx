import React, { useRef, useState, useEffect, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const PITS = 6;
const CELL = 80;
const WIDTH = CELL * (PITS + 2);
const HEIGHT = CELL * 2;

type Board = number[]; // length 14

function initBoard(): Board {
  const b = Array(14).fill(4);
  b[6] = b[13] = 0; // stores
  return b;
}

const MancalaCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<Board>(() => initBoard());
  const [turn, setTurn] = useState<0 | 1>(0); // 0 bottom, 1 top

  const reset = useCallback(() => {
    setBoard(initBoard());
    setTurn(0);
  }, []);

  const handlePit = useCallback(
    (index: number) => {
      if ((turn === 0 && (index < 0 || index >= PITS)) || (turn === 1 && (index < 7 || index >= 7 + PITS))) return;
      const b = board.slice();
      let i = index;
      let stones = b[i];
      if (stones === 0) return;
      b[i] = 0;
      while (stones > 0) {
        i = (i + 1) % 14;
        if (turn === 0 && i === 13) continue;
        if (turn === 1 && i === 6) continue;
        b[i]++;
        stones--;
      }
      const myStore = turn === 0 ? 6 : 13;
      if (turn === 0 && i >= 0 && i < PITS && b[i] === 1) {
        const opposite = 12 - i;
        b[myStore] += b[i] + b[opposite];
        b[i] = b[opposite] = 0;
      }
      if (turn === 1 && i >= 7 && i < 7 + PITS && b[i] === 1) {
        const opposite = 12 - i;
        b[myStore] += b[i] + b[opposite];
        b[i] = b[opposite] = 0;
      }
      const end = b.slice(0, PITS).every(v => v === 0) || b.slice(7, 7 + PITS).every(v => v === 0);
      if (end) {
        for (let p = 0; p < PITS; p++) b[6] += b[p], b[p] = 0;
        for (let p = 7; p < 7 + PITS; p++) b[13] += b[p], b[p] = 0;
      }
      setBoard(b);
      if (i !== myStore && !end) setTurn(turn === 0 ? 1 : 0);
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
      if (r === 1 && c > 0 && c <= PITS) handlePit(c - 1);
      else if (r === 0 && c > 0 && c <= PITS) handlePit(12 - (c - 1));
    },
    [handlePit]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    // stores
    ctx.strokeRect(0, 0, CELL, HEIGHT);
    ctx.strokeRect(WIDTH - CELL, 0, CELL, HEIGHT);
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(String(board[13]), CELL / 2, HEIGHT / 2);
    ctx.fillText(String(board[6]), WIDTH - CELL / 2, HEIGHT / 2);
    // top row pits
    for (let p = 0; p < PITS; p++) {
      const x = CELL + p * CELL;
      ctx.strokeRect(x, 0, CELL, CELL);
      ctx.fillText(String(board[12 - p]), x + CELL / 2, CELL / 2);
    }
    // bottom row pits
    for (let p = 0; p < PITS; p++) {
      const x = CELL + p * CELL;
      ctx.strokeRect(x, CELL, CELL, CELL);
      ctx.fillText(String(board[p]), x + CELL / 2, CELL + CELL / 2);
    }
  }, [board]);

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
    <GameLayout title="Mancala" bottomInfo={['자기 구멍 클릭, R: 리셋']}>
      <GameCanvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onClick={handleClick}
        gameTitle="Mancala"
      />
      <GameButton onClick={reset}>Reset</GameButton>
    </GameLayout>
  );
};

export default MancalaCanvas;
