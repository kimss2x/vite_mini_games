import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { layout } from './theme/gameTheme';

// Use shared layout width so the game matches the rest of the catalog
const CANVAS_WIDTH = layout.maxWidth;
const CANVAS_HEIGHT = Math.round(layout.maxWidth * 0.75);
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 300; // px per second
const BULLET_SPEED = 500;
const ALIEN_ROWS = 5;
const ALIEN_COLS = 8;
const ALIEN_WIDTH = 40;
const ALIEN_HEIGHT = 30;
const ALIEN_GAP = 10;
const ALIEN_X_SPEED = 40;
const ALIEN_DROP = 20;

interface Bullet {
  x: number;
  y: number;
}

interface Alien {
  x: number;
  y: number;
  alive: boolean;
}

const SpaceInvadersCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const bulletsRef = useRef<Bullet[]>([]);
  const aliensRef = useRef<Alien[]>([]);
  const directionRef = useRef(1);
  const playerXRef = useRef(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2);

  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'gameover'>('playing');

  const initAliens = useCallback(() => {
    const aliens: Alien[] = [];
    const startX = (CANVAS_WIDTH - (ALIEN_COLS * (ALIEN_WIDTH + ALIEN_GAP) - ALIEN_GAP)) / 2;
    for (let r = 0; r < ALIEN_ROWS; r++) {
      for (let c = 0; c < ALIEN_COLS; c++) {
        aliens.push({
          x: startX + c * (ALIEN_WIDTH + ALIEN_GAP),
          y: 60 + r * (ALIEN_HEIGHT + ALIEN_GAP),
          alive: true
        });
      }
    }
    aliensRef.current = aliens;
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setGameState('playing');
    playerXRef.current = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
    bulletsRef.current = [];
    directionRef.current = 1;
    initAliens();
  }, [initAliens]);

  const update = useCallback((dt: number) => {
    if (gameState !== 'playing') return;

    // player movement
    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('KeyA')) {
      playerXRef.current = Math.max(0, playerXRef.current - PLAYER_SPEED * dt);
    }
    if (keysRef.current.has('ArrowRight') || keysRef.current.has('KeyD')) {
      playerXRef.current = Math.min(CANVAS_WIDTH - PLAYER_WIDTH, playerXRef.current + PLAYER_SPEED * dt);
    }

    // bullets
    bulletsRef.current = bulletsRef.current.filter(b => {
      b.y -= BULLET_SPEED * dt;
      return b.y > -10;
    });

    // aliens
    let hitEdge = false;
    aliensRef.current.forEach(alien => {
      if (!alien.alive) return;
      alien.x += directionRef.current * ALIEN_X_SPEED * dt;
      if (alien.x < 20 || alien.x + ALIEN_WIDTH > CANVAS_WIDTH - 20) {
        hitEdge = true;
      }
    });
    if (hitEdge) {
      directionRef.current *= -1;
      aliensRef.current.forEach(a => (a.y += ALIEN_DROP));
    }

    // collisions
    bulletsRef.current.forEach(b => {
      aliensRef.current.forEach(a => {
        if (a.alive && b.x > a.x && b.x < a.x + ALIEN_WIDTH && b.y > a.y && b.y < a.y + ALIEN_HEIGHT) {
          a.alive = false;
          b.y = -20;
          setScore(s => s + 10);
        }
      });
    });

    // win/lose check
    const playerY = CANVAS_HEIGHT - PLAYER_HEIGHT - 10;
    if (aliensRef.current.every(a => !a.alive)) {
      setGameState('won');
    } else if (aliensRef.current.some(a => a.alive && a.y + ALIEN_HEIGHT >= playerY)) {
      setGameState('gameover');
    }
  }, [gameState]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const playerY = CANVAS_HEIGHT - PLAYER_HEIGHT - 10;
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(playerXRef.current, playerY, PLAYER_WIDTH, PLAYER_HEIGHT);

    ctx.fillStyle = '#ffff00';
    bulletsRef.current.forEach(b => {
      ctx.fillRect(b.x - 2, b.y, 4, 10);
    });

    ctx.fillStyle = '#ff4444';
    aliensRef.current.forEach(a => {
      if (a.alive) ctx.fillRect(a.x, a.y, ALIEN_WIDTH, ALIEN_HEIGHT);
    });

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 20, 30);

    if (gameState === 'gameover' || gameState === 'won') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.textAlign = 'center';
      ctx.fillStyle = gameState === 'won' ? '#00ff00' : '#ff4444';
      ctx.font = '48px Arial';
      ctx.fillText(gameState === 'won' ? 'YOU WIN!' : 'GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      ctx.textAlign = 'left';
    }
  }, [score, gameState]);

  const loop = useCallback((time: number) => {
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;
    update(dt);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);
    animationRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'KeyR'].includes(e.code)) {
        e.preventDefault();
        e.stopPropagation();
      }
      keysRef.current.add(e.code);
      if (e.code === 'Space' && gameState === 'playing') {
        bulletsRef.current.push({ x: playerXRef.current + PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - PLAYER_HEIGHT - 15 });
      }
      if (e.code === 'KeyR' && gameState !== 'playing') {
        startGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [gameState, startGame]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [loop]);

  const gameStats = <div>점수: {score}</div>;
  const instructions = '←/→ 또는 A/D 이동, Space 발사, R 재시작';
  const actionButtons = (
    <GameButton onClick={startGame} variant="primary" size="large">
      다시 시작
    </GameButton>
  );

  return (
    <GameManager
      title="Space Invaders"
      gameIcon="👾"
      gameStats={gameStats}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <GameCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        gameTitle="Space Invaders"
      />
    </GameManager>
  );
};

export default SpaceInvadersCanvas;

