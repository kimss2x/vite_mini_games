import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { spacing, typography } from './theme/gameTheme';

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

const DodgeGameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [score, setScore] = useState(0);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const difficultyTimerRef = useRef<number>(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const INITIAL_SPAWN_INTERVAL = 1000; // 1초
  const INITIAL_BLOCK_SPEED = 100; // pixels per second
  const DIFFICULTY_INCREASE_INTERVAL = 5000; // 5초마다 난이도 증가

  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2 - 25,
    y: CANVAS_HEIGHT - 100,
    width: 50,
    height: 50,
    speed: 300
  });

  const blocksRef = useRef<Block[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const spawnIntervalRef = useRef<number>(INITIAL_SPAWN_INTERVAL);
  const blockSpeedRef = useRef<number>(INITIAL_BLOCK_SPEED);

  const spawnBlock = useCallback(() => {
    const blockWidth = 30 + Math.random() * 40; // 30-70px 너비
    const block: Block = {
      x: Math.random() * (CANVAS_WIDTH - blockWidth),
      y: -50,
      width: blockWidth,
      height: 30,
      speed: blockSpeedRef.current + Math.random() * 50 // 속도에 약간의 변화
    };
    blocksRef.current.push(block);
  }, []);

  const checkCollision = useCallback((player: Player, block: Block): boolean => {
    return player.x < block.x + block.width &&
           player.x + player.width > block.x &&
           player.y < block.y + block.height &&
           player.y + player.height > block.y;
  }, []);

  const updateGame = useCallback((deltaTime: number) => {
    if (gameState !== 'playing') return;

    const player = playerRef.current;
    
    // 플레이어 이동
    if (keysRef.current.has('KeyW') || keysRef.current.has('ArrowUp')) {
      player.y = Math.max(0, player.y - player.speed * deltaTime / 1000);
    }
    if (keysRef.current.has('KeyS') || keysRef.current.has('ArrowDown')) {
      player.y = Math.min(CANVAS_HEIGHT - player.height, player.y + player.speed * deltaTime / 1000);
    }
    if (keysRef.current.has('KeyA') || keysRef.current.has('ArrowLeft')) {
      player.x = Math.max(0, player.x - player.speed * deltaTime / 1000);
    }
    if (keysRef.current.has('KeyD') || keysRef.current.has('ArrowRight')) {
      player.x = Math.min(CANVAS_WIDTH - player.width, player.x + player.speed * deltaTime / 1000);
    }

    // 블록 스폰
    spawnTimerRef.current += deltaTime;
    if (spawnTimerRef.current >= spawnIntervalRef.current) {
      spawnBlock();
      spawnTimerRef.current = 0;
    }

    // 블록 이동 및 충돌 검사
    blocksRef.current = blocksRef.current.filter(block => {
      block.y += block.speed * deltaTime / 1000;
      
      // 충돌 검사
      if (checkCollision(player, block)) {
        setGameState('gameOver');
        return false;
      }
      
      // 화면을 벗어난 블록 제거 및 점수 증가
      if (block.y > CANVAS_HEIGHT) {
        setScore(prev => prev + 10);
        return false;
      }
      
      return true;
    });

    // 난이도 증가
    difficultyTimerRef.current += deltaTime;
    if (difficultyTimerRef.current >= DIFFICULTY_INCREASE_INTERVAL) {
      spawnIntervalRef.current = Math.max(300, spawnIntervalRef.current - 100); // 최소 0.3초
      blockSpeedRef.current += 20; // 속도 증가
      difficultyTimerRef.current = 0;
    }
  }, [gameState, spawnBlock, checkCollision]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // 배경
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === 'playing') {
      // 플레이어 그리기
      const player = playerRef.current;
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(player.x, player.y, player.width, player.height);
      
      // 플레이어에 간단한 디테일 추가
      ctx.fillStyle = '#00aa00';
      ctx.fillRect(player.x + 10, player.y + 10, player.width - 20, player.height - 20);

      // 블록들 그리기
      blocksRef.current.forEach(block => {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(block.x, block.y, block.width, block.height);
        
        // 블록에 그라데이션 효과
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);
      });

      // 점수 표시
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${score}`, 20, 40);
      
      // 난이도 정보 표시
      ctx.font = '16px Arial';
      ctx.fillText(`Speed: ${Math.round(blockSpeedRef.current)}`, 20, 70);
      ctx.fillText(`Spawn Rate: ${(1000 / spawnIntervalRef.current).toFixed(1)}/s`, 20, 90);
    } else if (gameState === 'gameOver') {
      // Game Over 화면
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff4444';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      ctx.textAlign = 'left';
    }
  }, [gameState, score]);

  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    updateGame(deltaTime);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      draw(ctx);
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [updateGame, draw]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    keysRef.current.add(event.code);
    
    if (event.code === 'KeyR' && gameState === 'gameOver') {
      restartGame();
    }
    
    // 게임 조작키들의 기본 동작 방지 및 전파 차단
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [gameState]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    keysRef.current.delete(event.code);
  }, []);

  const restartGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    blocksRef.current = [];
    spawnTimerRef.current = 0;
    difficultyTimerRef.current = 0;
    spawnIntervalRef.current = INITIAL_SPAWN_INTERVAL;
    blockSpeedRef.current = INITIAL_BLOCK_SPEED;
    
    // 플레이어 위치 초기화
    playerRef.current = {
      x: CANVAS_WIDTH / 2 - 25,
      y: CANVAS_HEIGHT - 100,
      width: 50,
      height: 50,
      speed: 300
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp, gameLoop]);

  // 상단 정보 (게임 목표/상태)
  const gameStats = (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        ...typography.gameStatus,
        fontSize: 18,
        marginBottom: spacing.sm
      }}>
        {gameState === 'playing' ? '플레이 중' : '게임 오버 💀'}
      </div>
      <div style={{
        fontSize: 16,
        color: '#bcbcbe',
        fontWeight: 600
      }}>
        점수: {score}
      </div>
    </div>
  );

  // 하단 정보 (조작법)
  const instructions = (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>조작법:</strong> WASD 또는 방향키로 움직여서 떨어지는 블록을 피하세요!
      </div>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>게임:</strong> R키 = 재시작, 시간이 지날수록 난이도가 증가합니다
      </div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        블록과 충돌하지 않도록 주의하세요!
      </div>
    </div>
  );

  const actionButtons = gameState === 'gameOver' ? (
    <GameButton
      onClick={restartGame}
      variant="primary"
      size="large"
      style={{ minWidth: 120 }}
    >
      다시 시작
    </GameButton>
  ) : null;

  return (
    <GameManager
      title="Dodge Game"
      gameIcon="🚫"
      gameStats={gameStats}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <GameCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        gameTitle="Dodge Game"
        style={{
          border: "2px solid rgba(255,255,255,0.1)"
        }}
        tabIndex={0}
      />
    </GameManager>
  );
};

export default DodgeGameCanvas;