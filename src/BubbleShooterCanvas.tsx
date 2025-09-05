import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';

const WIDTH = 480;
const HEIGHT = 640;
const RADIUS = 16;
const COLS = 12;
const ROWS = 20;
const START_ROWS = 5;
const COLORS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];

interface Bubble {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: number;
  moving: boolean;
}

const BubbleShooterCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<number[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(-1))
  );
  const bubbleRef = useRef<Bubble>({
    x: WIDTH / 2,
    y: HEIGHT - RADIUS - 10,
    dx: 0,
    dy: 0,
    color: Math.floor(Math.random() * COLORS.length),
    moving: false,
  });
  const angleRef = useRef(-Math.PI / 2);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<'aim' | 'over'>('aim');

  const reset = useCallback(() => {
    gridRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
    for (let r = 0; r < START_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        gridRef.current[r][c] = Math.floor(Math.random() * COLORS.length);
      }
    }
    bubbleRef.current = {
      x: WIDTH / 2,
      y: HEIGHT - RADIUS - 10,
      dx: 0,
      dy: 0,
      color: Math.floor(Math.random() * COLORS.length),
      moving: false,
    };
    angleRef.current = -Math.PI / 2;
    setScore(0);
    setState('aim');
  }, []);

  const neighbors = (r: number, c: number) => {
    const dirs = r % 2 === 0
      ? [
          [-1, 0],
          [1, 0],
          [0, -1],
          [-1, -1],
          [0, 1],
          [-1, 1],
        ]
      : [
          [-1, 0],
          [1, 0],
          [0, -1],
          [1, -1],
          [0, 1],
          [1, 1],
        ];
    return dirs
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS);
  };

  const removeMatches = (r: number, c: number) => {
    const color = gridRef.current[r][c];
    const stack = [[r, c]];
    const cells: [number, number][] = [];
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    visited[r][c] = true;
    while (stack.length) {
      const [cr, cc] = stack.pop()!;
      cells.push([cr, cc]);
      for (const [nr, nc] of neighbors(cr, cc)) {
        if (!visited[nr][nc] && gridRef.current[nr][nc] === color) {
          visited[nr][nc] = true;
          stack.push([nr, nc]);
        }
      }
    }
    if (cells.length >= 3) {
      cells.forEach(([rr, cc]) => (gridRef.current[rr][cc] = -1));
      setScore((s) => s + cells.length);
      return true;
    }
    return false;
  };

  const removeFloating = () => {
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const stack: [number, number][] = [];
    for (let c = 0; c < COLS; c++) {
      if (gridRef.current[0][c] !== -1) {
        visited[0][c] = true;
        stack.push([0, c]);
      }
    }
    while (stack.length) {
      const [r, c] = stack.pop()!;
      for (const [nr, nc] of neighbors(r, c)) {
        if (!visited[nr][nc] && gridRef.current[nr][nc] !== -1) {
          visited[nr][nc] = true;
          stack.push([nr, nc]);
        }
      }
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (gridRef.current[r][c] !== -1 && !visited[r][c]) {
          gridRef.current[r][c] = -1;
          setScore((s) => s + 1);
        }
      }
    }
  };

  const checkGameOver = () => {
    const bottom = HEIGHT - 80;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (gridRef.current[r][c] !== -1) {
          const y = r * RADIUS * 2 + RADIUS;
          if (y >= bottom) {
            setState('over');
            return;
          }
        }
      }
    }
  };

  const shoot = () => {
    if (bubbleRef.current.moving || state === 'over') return;
    const speed = 6;
    bubbleRef.current.dx = Math.cos(angleRef.current) * speed;
    bubbleRef.current.dy = Math.sin(angleRef.current) * speed;
    bubbleRef.current.moving = true;
  };

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let angle = Math.atan2(y - (HEIGHT - RADIUS - 10), x - WIDTH / 2);
      if (angle > -0.1) angle = -0.1;
      if (angle < -Math.PI + 0.1) angle = -Math.PI + 0.1;
      angleRef.current = angle;
    };
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      shoot();
    };
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [state]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        e.stopPropagation();
        reset();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;

    const startX = (WIDTH - COLS * RADIUS * 2) / 2;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // update moving bubble
      const b = bubbleRef.current;
      if (b.moving) {
        b.x += b.dx;
        b.y += b.dy;
        if (b.x <= startX + RADIUS || b.x >= startX + COLS * RADIUS * 2 - RADIUS) {
          b.dx *= -1;
        }
        if (b.y <= RADIUS) {
          b.moving = false;
        }
        // collision with grid
        if (!b.moving) {
          const row = Math.round(b.y / (RADIUS * 2));
          const col = Math.round((b.x - startX - (row % 2 ? RADIUS : 0)) / (RADIUS * 2));
          if (row >= ROWS || col < 0 || col >= COLS) {
            setState('over');
          } else {
            gridRef.current[row][col] = b.color;
            if (removeMatches(row, col)) {
              removeFloating();
            }
            checkGameOver();
            bubbleRef.current = {
              x: WIDTH / 2,
              y: HEIGHT - RADIUS - 10,
              dx: 0,
              dy: 0,
              color: Math.floor(Math.random() * COLORS.length),
              moving: false,
            };
          }
        }
      }

      // draw grid
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const color = gridRef.current[r][c];
          if (color === -1) continue;
          const cx = startX + c * RADIUS * 2 + (r % 2 ? RADIUS : 0);
          const cy = r * RADIUS * 2 + RADIUS;
          ctx.beginPath();
          ctx.arc(cx, cy, RADIUS - 1, 0, Math.PI * 2);
          ctx.fillStyle = COLORS[color];
          ctx.fill();
        }
      }

      // draw shooter direction
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, HEIGHT - RADIUS - 10);
      ctx.lineTo(
        WIDTH / 2 + Math.cos(angleRef.current) * 40,
        HEIGHT - RADIUS - 10 + Math.sin(angleRef.current) * 40
      );
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // draw current bubble
      const drawX = b.moving ? b.x : WIDTH / 2;
      const drawY = b.moving ? b.y : HEIGHT - RADIUS - 10;
      ctx.beginPath();
      ctx.arc(drawX, drawY, RADIUS - 1, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[b.color];
      ctx.fill();

      if (state === 'over') {
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.fillText('Game Over', WIDTH / 2 - 60, HEIGHT / 2);
      }
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [state]);

  const topInfo = (
    <div style={{ textAlign: 'center', color: '#bcbcbe' }}>점수: {score}</div>
  );

  const instructions = '마우스로 조준하고 클릭하여 버블을 발사하세요. R로 리셋.';

  return (
    <GameLayout title="Bubble Shooter" topInfo={topInfo} bottomInfo={instructions}>
      <GameCanvas
        ref={canvasRef}
        gameTitle="Bubble Shooter"
        width={WIDTH}
        height={HEIGHT}
      />
    </GameLayout>
  );
};

export default BubbleShooterCanvas;

