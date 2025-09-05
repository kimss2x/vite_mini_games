import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { layout } from './theme/gameTheme';

const CANVAS_SIZE = layout.maxWidth;
const GRID = 4;
const TILE = CANVAS_SIZE / GRID;
const EMOJIS = {
  cat: ['🐱', '😺', '😸', '😹', '😻'],
  dog: ['🐶', '🐕', '🦮', '🐕‍🦺', '🐩'],
  hybrid: ['🐾'],
};
type Species = keyof typeof EMOJIS;
const HYBRID_LEVEL = 2; // min level before cat & dog can merge into hybrid
interface Cell {
  t: Species;
  l: number;
}

const MergeCatsDogsCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<(Cell | null)[][]>([]);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<'playing' | 'gameover'>('playing');

  const addRandom = useCallback((g: (Cell | null)[][]) => {
    const empties: Array<[number, number]> = [];
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) if (!g[y][x]) empties.push([x, y]);
    }
    if (!empties.length) return;
    const [x, y] = empties[Math.floor(Math.random() * empties.length)];
    const t: Species = Math.random() < 0.5 ? 'cat' : 'dog';
    g[y][x] = { t, l: 0 };
  }, []);

  const init = useCallback(() => {
    const g = Array.from({ length: GRID }, () => Array<Cell | null>(GRID).fill(null));
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
    (line: (Cell | null)[]) => {
      const arr = line.filter((v): v is Cell => v !== null);
      for (let i = 0; i < arr.length - 1; i++) {
        const a = arr[i];
        const b = arr[i + 1];
        if (a.t === b.t && a.l === b.l) {
          arr[i] = { t: a.t, l: Math.min(a.l + 1, EMOJIS[a.t].length - 1) };
          setScore((s) => s + (arr[i].l + 1) * 10);
          arr.splice(i + 1, 1);
          i--; // recheck new neighbor
        } else if (
          a.l === b.l &&
          a.l >= HYBRID_LEVEL &&
          ((a.t === 'cat' && b.t === 'dog') || (a.t === 'dog' && b.t === 'cat'))
        ) {
          arr[i] = { t: 'hybrid', l: 0 };
          setScore((s) => s + (a.l + 1) * 20);
          arr.splice(i + 1, 1);
          i--;
        }
      }
      const out: (Cell | null)[] = [...arr];
      while (out.length < GRID) out.push(null);
      return out;
    },
    []
  );

  const checkGameOver = useCallback((g: (Cell | null)[][]) => {
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const c = g[y][x];
        if (!c) return;
        if (x < GRID - 1) {
          const r = g[y][x + 1];
          if (
            !r ||
            (r.t === c.t && r.l === c.l) ||
            (r.l === c.l &&
              c.l >= HYBRID_LEVEL &&
              ((r.t === 'cat' && c.t === 'dog') || (r.t === 'dog' && c.t === 'cat')))
          )
            return;
        }
        if (y < GRID - 1) {
          const d = g[y + 1][x];
          if (
            !d ||
            (d.t === c.t && d.l === c.l) ||
            (d.l === c.l &&
              c.l >= HYBRID_LEVEL &&
              ((d.t === 'cat' && c.t === 'dog') || (d.t === 'dog' && c.t === 'cat')))
          )
            return;
        }
      }
    }
    setState('gameover');
  }, []);

  const move = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down') => {
      if (state !== 'playing') return;
      setGrid((prev) => {
        let moved = false;
        const g = prev.map((row) => row.slice());
        const apply = (
          getLine: (g: (Cell | null)[][], i: number) => (Cell | null)[],
          setLine: (g: (Cell | null)[][], i: number, line: (Cell | null)[]) => void
        ) => {
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
            apply((g, i) => g[i].slice().reverse(), (g, i, line) => (g[i] = line.reverse()));
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
          checkGameOver(g);
          return g.map((row) => row.slice());
        }
        return prev;
      });
    },
    [slide, addRandom, checkGameOver, state]
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.font = `${TILE * 0.8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          ctx.strokeStyle = '#555';
          ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
          const cell = grid[y][x];
          if (cell) ctx.fillText(EMOJIS[cell.t][cell.l], x * TILE + TILE / 2, y * TILE + TILE / 2);
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
        ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'r', 'R'].includes(e.key)
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
      title="Merge Cats & Dogs"
      gameIcon="🐱"
      gameStats={<div>Score: {score}</div>}
      gameStatus={status}
      instructions={
        <div>
          WASD/←→↑↓ 이동, 같은 동물을 합치고 높은 레벨의 고양이와 강아지를 합치면 🐾이
          됩니다. R 리셋
        </div>
      }
    >
      <GameCanvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} gameTitle="Merge Cats & Dogs" />
      <div style={{ marginTop: 12 }}>
        <GameButton onClick={init}>Reset</GameButton>
      </div>
    </GameManager>
  );
};

export default MergeCatsDogsCanvas;
