import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { layout } from './theme/gameTheme';

const CANVAS_SIZE = layout.maxWidth;
const GRID = 4;
const TILE = CANVAS_SIZE / GRID;
const EMOJIS = ['🐱', '🐶', '🦊', '🐻', '🦁', '🐉'];

const MergePetsCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<number[][]>([]);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<'playing' | 'gameover'>('playing');

  const addRandom = useCallback((g: number[][]) => {
    const empties: Array<[number, number]> = [];
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) if (g[y][x] === -1) empties.push([x, y]);
    }
    if (!empties.length) return;
    const [x, y] = empties[Math.floor(Math.random() * empties.length)];
    g[y][x] = Math.random() < 0.5 ? 0 : 1;
  }, []);

  const init = useCallback(() => {
    const g = Array.from({ length: GRID }, () => Array(GRID).fill(-1));
    addRandom(g);
    addRandom(g);
    setGrid(g);
    setScore(0);
    setState('playing');
  }, [addRandom]);

  useEffect(() => {
    init();
  }, [init]);

  const slide = useCallback(
    (line: number[]) => {
      const arr = line.filter((v) => v !== -1);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] = Math.min(arr[i] + 1, EMOJIS.length - 1);
          setScore((s) => s + (arr[i] + 1) * 10);
          arr.splice(i + 1, 1);
        }
      }
      while (arr.length < GRID) arr.push(-1);
      return arr;
    },
    []
  );

  const move = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down') => {
      if (state !== 'playing') return;
      let moved = false;
      const g = grid.map((row) => [...row]);
      const apply = (getLine: (g: number[][], i: number) => number[], setLine: (g: number[][], i: number, line: number[]) => void) => {
        for (let i = 0; i < GRID; i++) {
          const line = getLine(g, i);
          const newLine = slide(line);
          if (JSON.stringify(line) !== JSON.stringify(newLine)) {
            moved = true;
            setLine(g, i, newLine);
          }
        }
      };
      switch (dir) {
        case 'left':
          apply((g, i) => g[i], (g, i, line) => (g[i] = line));
          break;
        case 'right':
          apply(
            (g, i) => g[i].slice().reverse(),
            (g, i, line) => (g[i] = line.reverse())
          );
          break;
        case 'up':
          apply(
            (g, i) => g.map((row) => row[i]),
            (g, i, line) => {
              for (let r = 0; r < GRID; r++) g[r][i] = line[r];
            }
          );
          break;
        case 'down':
          apply(
            (g, i) => g.map((row) => row[i]).reverse(),
            (g, i, line) => {
              const rev = line.reverse();
              for (let r = 0; r < GRID; r++) g[r][i] = rev[r];
            }
          );
          break;
      }
      if (moved) {
        addRandom(g);
        setGrid(g.map((row) => [...row]));
        checkGameOver(g);
      }
    },
    [grid, slide, addRandom, state]
  );

  const checkGameOver = useCallback((g: number[][]) => {
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (g[y][x] === -1) return;
        if (x < GRID - 1 && g[y][x] === g[y][x + 1]) return;
        if (y < GRID - 1 && g[y][x] === g[y + 1][x]) return;
      }
    }
    setState('gameover');
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.font = `${TILE * 0.8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          ctx.strokeStyle = '#555';
          ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
          const v = grid[y]?.[x];
          if (v !== -1) ctx.fillText(EMOJIS[v], x * TILE + TILE / 2, y * TILE + TILE / 2);
        }
      }
    },
    [grid]
  );

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);
  }, [draw]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'r', 'R'].includes(
          e.key
        )
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === 'r' || e.key === 'R') {
        init();
        return;
      }
      if (state !== 'playing') return;
      switch (e.key) {
        case 'a':
        case 'A':
        case 'ArrowLeft':
          move('left');
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          move('right');
          break;
        case 'w':
        case 'W':
        case 'ArrowUp':
          move('up');
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          move('down');
          break;
      }
    },
    [move, init, state]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);

  const status = state === 'gameover' ? '💀 게임 오버! R로 리셋' : undefined;

  return (
    <GameManager
      title="Merge Pets"
      gameIcon="🐾"
      gameStats={<div>Score: {score}</div>}
      gameStatus={status}
      instructions={<div>WASD/←→↑↓ 이동, 같은 동물 합치기, R 리셋</div>}
    >
      <GameCanvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        gameTitle="Merge Pets"
      />
      <div style={{ marginTop: 12 }}>
        <GameButton onClick={init}>Reset</GameButton>
      </div>
    </GameManager>
  );
};

export default MergePetsCanvas;

