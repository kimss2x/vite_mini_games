import React, { useRef, useState, useEffect, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const SIZE = 8;
const CELL = 60;
const WIDTH = SIZE * CELL;
const HEIGHT = WIDTH;

type Cell = 0 | 1 | -1; // 1: black, -1: white

function initBoard(): Cell[][] {
  const b: Cell[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  b[3][3] = b[4][4] = -1;
  b[3][4] = b[4][3] = 1;
  return b;
}

const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1]
];

const OthelloCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<Cell[][]>(() => initBoard());
  const [turn, setTurn] = useState<Cell>(1);
  const [gameOver, setGameOver] = useState(false);

  const reset = useCallback(() => {
    setBoard(initBoard());
    setTurn(1);
    setGameOver(false);
  }, []);

  const validMoves = useCallback((b: Cell[][], player: Cell) => {
    const moves: [number, number, [number, number][]][] = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] !== 0) continue;
        const flips: [number, number][] = [];
        for (const [dr, dc] of directions) {
          let nr = r + dr;
          let nc = c + dc;
          const line: [number, number][] = [];
          while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && b[nr][nc] === -player) {
            line.push([nr, nc]);
            nr += dr; nc += dc;
          }
          if (line.length && nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && b[nr][nc] === player) {
            flips.push(...line);
          }
        }
        if (flips.length) moves.push([r, c, flips]);
      }
    }
    return moves;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameOver) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
      const y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      const moves = validMoves(board, turn);
      const move = moves.find(m => m[0] === r && m[1] === c);
      if (!move) return;
      const newBoard = board.map(row => row.slice());
      newBoard[r][c] = turn;
      for (const [fr, fc] of move[2]) newBoard[fr][fc] = turn;
      setBoard(newBoard);
      const opponent = -turn as Cell;
      const nextMoves = validMoves(newBoard, opponent);
      if (nextMoves.length) {
        setTurn(opponent);
      } else if (validMoves(newBoard, turn).length === 0) {
        setGameOver(true);
      }
    },
    [board, turn, validMoves, gameOver]
  );

  useEffect(() => {
    if (gameOver) return;
    const moves = validMoves(board, turn);
    if (moves.length === 0) {
      const opponentMoves = validMoves(board, -turn as Cell);
      if (opponentMoves.length) {
        setTurn(-turn as Cell);
      } else {
        setGameOver(true);
      }
    }
  }, [board, turn, validMoves, gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = '#000';
    for (let i = 0; i <= SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, HEIGHT);
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(WIDTH, i * CELL);
      ctx.stroke();
    }
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = board[r][c];
        if (cell !== 0) {
          ctx.beginPath();
          ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, CELL * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = cell === 1 ? '#000' : '#FFF';
          ctx.fill();
          ctx.stroke();
        }
      }
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

  const blackCount = board.reduce((sum, row) => sum + row.filter(c => c === 1).length, 0);
  const whiteCount = board.reduce((sum, row) => sum + row.filter(c => c === -1).length, 0);
  const result =
    blackCount === whiteCount
      ? '무승부'
      : blackCount > whiteCount
      ? '흑돌 승'
      : '백돌 승';
  const status = gameOver
    ? result
    : `${turn === 1 ? '흑' : '백'} 차례`;

  return (
    <GameLayout
      title="Othello"
      bottomInfo={[`흑: ${blackCount} 백: ${whiteCount}`, status, '돌을 놓아 뒤집으세요. R: 리셋']}
    >
      <GameCanvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onClick={handleClick}
        gameTitle="Othello"
      />
      <GameButton onClick={reset}>Reset</GameButton>
    </GameLayout>
  );
};

export default OthelloCanvas;
