import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { layout } from './theme/gameTheme';

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CANVAS_WIDTH = layout.maxWidth;
const CANVAS_HEIGHT = Math.round(layout.maxWidth * 0.75);
const GRAVITY = 1500; // px/s^2
const SPEED = 200; // horizontal speed
const JUMP_VELOCITY = -600; // jump impulse

const platforms: Platform[] = [
  { x: 0, y: CANVAS_HEIGHT - 40, width: CANVAS_WIDTH, height: 40 },
  { x: 80, y: CANVAS_HEIGHT - 140, width: 120, height: 20 },
  { x: 260, y: CANVAS_HEIGHT - 220, width: 120, height: 20 },
  { x: 460, y: CANVAS_HEIGHT - 180, width: 120, height: 20 },
];

const PenguinJumpCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const [score, setScore] = useState(0);

  const playerRef = useRef({
    x: 40,
    y: CANVAS_HEIGHT - 80,
    vx: 0,
    vy: 0,
    width: 40,
    height: 40,
    onGround: false,
  });

  const keys = useRef({ left: false, right: false });

  const resetPlayer = useCallback(() => {
    playerRef.current = {
      x: 40,
      y: CANVAS_HEIGHT - 80,
      vx: 0,
      vy: 0,
      width: 40,
      height: 40,
      onGround: false,
    };
  }, []);

  const reset = useCallback(() => {
    setScore(0);
    resetPlayer();
  }, [resetPlayer]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (['a', 'd', 'w', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(e.key)) {
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
      case 'w':
      case 'ArrowUp':
      case ' ': // space
        if (playerRef.current.onGround) {
          playerRef.current.vy = JUMP_VELOCITY;
          playerRef.current.onGround = false;
        }
        break;
    }
  }, []);

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
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const update = useCallback((dt: number) => {
    const player = playerRef.current;

    // horizontal movement
    if (keys.current.left) player.vx = -SPEED;
    else if (keys.current.right) player.vx = SPEED;
    else player.vx = 0;

    // apply gravity
    player.vy += GRAVITY * dt;

    // update position
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // bounds
    player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));

    // collision detection
    player.onGround = false;
    for (const p of platforms) {
      const prevBottom = player.y - player.vy * dt + player.height;
      const currBottom = player.y + player.height;
      if (
        player.x < p.x + p.width &&
        player.x + player.width > p.x &&
        prevBottom <= p.y &&
        currBottom >= p.y &&
        player.vy >= 0
      ) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.onGround = true;
      }
    }

    // fell off
    if (player.y > CANVAS_HEIGHT) {
      resetPlayer();
    }

    // goal flag at right
    if (player.x + player.width >= CANVAS_WIDTH - 30 && player.onGround) {
      setScore((s) => s + 1);
      resetPlayer();
    }
  }, [resetPlayer]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // platforms
    ctx.fillStyle = '#654321';
    platforms.forEach((p) => {
      ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    // goal flag
    const ground = platforms[0];
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(CANVAS_WIDTH - 20, ground.y - 60, 5, 60);
    ctx.fillRect(CANVAS_WIDTH - 20, ground.y - 60, 20, 15);

    // penguin character
    const player = playerRef.current;
    ctx.font = `${player.width}px serif`;
    ctx.textBaseline = 'bottom';
    ctx.fillText('🐧', player.x, player.y + player.height);
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    let last = performance.now();

    const loop = (time: number) => {
      const dt = (time - last) / 1000;
      last = time;
      update(dt);
      draw(ctx);
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [update, draw]);

  const gameStats = <div style={{ textAlign: 'center' }}>점수: {score}</div>;
  const instructions = 'A/D 또는 ←→로 이동, W/Space/↑로 점프하세요. 오른쪽 끝 깃발에 닿으면 점수를 얻습니다.';
  const actionButtons = (
    <GameButton onClick={reset} variant="primary" size="large">
      다시 시작
    </GameButton>
  );

  return (
    <GameManager
      title="Penguin Jump"
      gameIcon="🐧"
      gameStats={gameStats}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <GameCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        gameTitle="Penguin Jump"
      />
    </GameManager>
  );
};

export default PenguinJumpCanvas;

