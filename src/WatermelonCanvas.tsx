import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { layout } from './theme/gameTheme';

interface Fruit {
  x: number;
  y: number;
  vy: number;
  radius: number;
  level: number;
}

const CANVAS_WIDTH = layout.maxWidth;
const CANVAS_HEIGHT = Math.round(layout.maxWidth * 1.2);
const GRAVITY = 900; // px/s^2
const MOVE_SPEED = 200;
const FRUIT_RADII = [16, 24, 32, 44, 62, 88];
const COLORS = ['#ffb347', '#ffcc33', '#c1e1c5', '#ff9999', '#99ccff', '#ff7f7f'];

const createFruit = () => {
  const level = Math.random() < 0.5 ? 0 : 1;
  return {
    x: CANVAS_WIDTH / 2,
    y: 40,
    vy: 0,
    radius: FRUIT_RADII[level],
    level,
  };
};

const WatermelonCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const fruitsRef = useRef<Fruit[]>([]);
  const currentRef = useRef<Fruit>(createFruit());
  const keys = useRef({ left: false, right: false });
  const lastDropRef = useRef(0);
  const DROP_DELAY = 500; // ms

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const reset = useCallback(() => {
    fruitsRef.current = [];
    currentRef.current = createFruit();
    setScore(0);
    setGameOver(false);
  }, []);

  const dropCurrent = useCallback(() => {
    if (gameOver) return;
    const now = performance.now();
    if (now - lastDropRef.current < DROP_DELAY) return;
    lastDropRef.current = now;
    fruitsRef.current.push({ ...currentRef.current });
    currentRef.current = createFruit();
  }, [gameOver]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (['a', 'd', 'ArrowLeft', 'ArrowRight', ' ', 'r'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      switch (e.key) {
        case 'a':
        case 'ArrowLeft':
          keys.current.left = true;
          break;
        case 'd':
        case 'ArrowRight':
          keys.current.right = true;
          break;
        case ' ': // drop
          dropCurrent();
          break;
        case 'r':
          reset();
          break;
      }
    },
    [dropCurrent, reset]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (['a', 'd', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
    switch (e.key) {
      case 'a':
      case 'ArrowLeft':
        keys.current.left = false;
        break;
      case 'd':
      case 'ArrowRight':
        keys.current.right = false;
        break;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas?.addEventListener('click', dropCurrent);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      canvas?.removeEventListener('click', dropCurrent);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dropCurrent, handleKeyDown, handleKeyUp]);

  const update = useCallback(
    (dt: number) => {
      const current = currentRef.current;
      if (current) {
        if (keys.current.left) current.x -= MOVE_SPEED * dt;
        if (keys.current.right) current.x += MOVE_SPEED * dt;
        current.x = Math.max(
          current.radius,
          Math.min(CANVAS_WIDTH - current.radius, current.x)
        );
      }

      const fruits = fruitsRef.current;
      fruits.forEach((f) => {
        f.vy += GRAVITY * dt;
        f.y += f.vy * dt;
        if (f.y + f.radius > CANVAS_HEIGHT) {
          f.y = CANVAS_HEIGHT - f.radius;
          f.vy = 0;
        }
        if (f.x - f.radius < 0) f.x = f.radius;
        if (f.x + f.radius > CANVAS_WIDTH) f.x = CANVAS_WIDTH - f.radius;
      });

      // merging before collision resolution
      const remove = new Set<number>();
      const additions: Fruit[] = [];
      for (let i = 0; i < fruits.length; i++) {
        for (let j = i + 1; j < fruits.length; j++) {
          if (remove.has(i) || remove.has(j)) continue;
          const a = fruits[i];
          const b = fruits[j];
          if (a.level === b.level) {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            if (dist < a.radius + b.radius) {
              const level = a.level + 1;
              if (level < FRUIT_RADII.length) {
                additions.push({
                  x: (a.x + b.x) / 2,
                  y: (a.y + b.y) / 2,
                  vy: 0,
                  radius: FRUIT_RADII[level],
                  level,
                });
                remove.add(i);
                remove.add(j);
                setScore((s) => s + (level + 1) * 10);
              }
            }
          }
        }
      }
      if (remove.size > 0) {
        fruitsRef.current = fruits
          .filter((_, idx) => !remove.has(idx))
          .concat(additions);
      }

      const updated = fruitsRef.current;
      for (let i = 0; i < updated.length; i++) {
        for (let j = i + 1; j < updated.length; j++) {
          const a = updated[i];
          const b = updated[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          const minDist = a.radius + b.radius;
          if (dist < minDist && dist > 0) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            a.x -= nx * overlap / 2;
            a.y -= ny * overlap / 2;
            b.x += nx * overlap / 2;
            b.y += ny * overlap / 2;
            if (ny > 0) a.vy = 0;
            if (ny < 0) b.vy = 0;
          }
        }
      }

      // game over check
      for (const f of fruitsRef.current) {
        if (f.y - f.radius <= 0) {
          setGameOver(true);
          break;
        }
      }
    },
    [setScore]
  );

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    fruitsRef.current.forEach((f) => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[f.level % COLORS.length];
      ctx.fill();
    });

    const current = currentRef.current;
    if (current) {
      ctx.beginPath();
      ctx.arc(current.x, current.y, current.radius, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[current.level % COLORS.length];
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    let last = performance.now();

    const loop = (time: number) => {
      const dt = (time - last) / 1000;
      last = time;
      if (!gameOver) update(dt);
      draw(ctx);
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [update, draw, gameOver]);

  const gameStats = (
    <div style={{ textAlign: 'center' }}>점수: {score}</div>
  );
  const instructions =
    'A/D 또는 ←→로 이동, Space/클릭으로 과일을 떨어뜨리세요. 같은 과일을 합쳐 더 큰 수박을 만드세요. R로 재시작.';
  const actionButtons = (
    <GameButton onClick={reset} variant="primary" size="large">
      다시 시작
    </GameButton>
  );

  return (
    <GameManager
      title="Watermelon Game"
      gameIcon="🍉"
      gameStats={gameStats}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <GameCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        gameTitle="Watermelon Game"
      />
    </GameManager>
  );
};

export default WatermelonCanvas;

