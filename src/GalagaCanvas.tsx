import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { layout } from './theme/gameTheme';

const CANVAS_WIDTH = layout.maxWidth;
const CANVAS_HEIGHT = Math.round(layout.maxWidth * 0.75);
const PLAYER_SPEED = 300;
const BULLET_SPEED = 500;
const FIRE_DELAY = 300; // ms
const ENEMY_SPEED = 40;

interface Bullet {
  x: number;
  y: number;
}

interface Enemy {
  baseX: number;
  x: number;
  y: number;
  t: number;
  alive: boolean;
}

const GalagaCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const playerXRef = useRef(CANVAS_WIDTH / 2);
  const lastShotRef = useRef(0);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<'playing' | 'won' | 'gameover'>('playing');

  const initEnemies = useCallback(() => {
    const enemies: Enemy[] = [];
    for (let i = 0; i < 15; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const baseX = 80 + col * 80;
      enemies.push({ baseX, x: baseX, y: 40 + row * 60, t: Math.random() * Math.PI * 2, alive: true });
    }
    enemiesRef.current = enemies;
  }, []);

  const start = useCallback(() => {
    setScore(0);
    setState('playing');
    bulletsRef.current = [];
    playerXRef.current = CANVAS_WIDTH / 2;
    lastShotRef.current = 0;
    initEnemies();
  }, [initEnemies]);

  const update = useCallback(
    (dt: number) => {
      if (state !== 'playing') return;

      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) {
        playerXRef.current = Math.max(20, playerXRef.current - PLAYER_SPEED * dt);
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) {
        playerXRef.current = Math.min(CANVAS_WIDTH - 20, playerXRef.current + PLAYER_SPEED * dt);
      }

      bulletsRef.current = bulletsRef.current.filter((b) => {
        b.y -= BULLET_SPEED * dt;
        return b.y > -10;
      });

      enemiesRef.current.forEach((e) => {
        if (!e.alive) return;
        e.t += dt;
        e.x = e.baseX + Math.sin(e.t * 2) * 40;
        e.y += ENEMY_SPEED * dt;
      });

      bulletsRef.current.forEach((b) => {
        enemiesRef.current.forEach((e) => {
          if (
            e.alive &&
            Math.abs(b.x - e.x) < 20 &&
            Math.abs(b.y - e.y) < 20
          ) {
            e.alive = false;
            b.y = -20;
            setScore((s) => s + 10);
          }
        });
      });

      if (enemiesRef.current.every((e) => !e.alive)) setState('won');
      if (enemiesRef.current.some((e) => e.alive && e.y > CANVAS_HEIGHT - 60)) setState('gameover');
    },
    [state]
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#0f0';
      ctx.fillRect(playerXRef.current - 20, CANVAS_HEIGHT - 40, 40, 20);

      ctx.fillStyle = '#ff0';
      bulletsRef.current.forEach((b) => ctx.fillRect(b.x - 2, b.y - 10, 4, 10));

      ctx.fillStyle = '#f00';
      enemiesRef.current.forEach((e) => {
        if (e.alive) ctx.fillRect(e.x - 20, e.y - 20, 40, 20);
      });

      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${score}`, 20, 30);

      if (state !== 'playing') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.textAlign = 'center';
        ctx.fillStyle = state === 'won' ? '#0f0' : '#f00';
        ctx.font = '48px Arial';
        ctx.fillText(state === 'won' ? 'YOU WIN!' : 'GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        ctx.textAlign = 'left';
      }
    },
    [score, state]
  );

  const loop = useCallback(
    (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      update(dt);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) draw(ctx);
      animationRef.current = requestAnimationFrame(loop);
    },
    [update, draw]
  );

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'KeyR'].includes(e.code)) {
        e.preventDefault();
        e.stopPropagation();
      }
      keysRef.current.add(e.code);
      if (e.code === 'Space' && state === 'playing') {
        const now = performance.now();
        if (now - lastShotRef.current > FIRE_DELAY) {
          bulletsRef.current.push({ x: playerXRef.current, y: CANVAS_HEIGHT - 40 });
          lastShotRef.current = now;
        }
      }
      if (e.code === 'KeyR' && state !== 'playing') start();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    window.addEventListener('keyup', onKeyUp, { capture: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      window.removeEventListener('keyup', onKeyUp, { capture: true });
    };
  }, [state, start]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [loop]);

  const gameStats = <div>점수: {score}</div>;
  const instructions = 'A/D 또는 ←/→ 이동, Space 발사, R 재시작';
  const actionButtons = (
    <GameButton onClick={start} variant="primary" size="large">
      다시 시작
    </GameButton>
  );

  return (
    <GameManager
      title="Galaga"
      gameIcon="🚀"
      gameStats={gameStats}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <GameCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        gameTitle="Galaga"
      />
    </GameManager>
  );
};

export default GalagaCanvas;

