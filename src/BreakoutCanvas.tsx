import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

type GameState = 'ready' | 'playing' | 'paused' | 'gameOver' | 'levelComplete';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hits: number;
  maxHits: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const BALL_SPEED = 5;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 25;
const BRICK_ROWS = 8;
const BRICK_COLS = 10;
const BRICK_PADDING = 5;
const BRICK_OFFSET_TOP = 60;

// 벽돌 색상 (내구도별)
const BRICK_COLORS = [
  '#ff4444', // 1회 타격
  '#ff8844', // 2회 타격  
  '#ffff44', // 3회 타격
  '#44ff44', // 4회 타격
  '#44ffff', // 5회 타격
];

const BreakoutCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  
  const [gameState, setGameState] = useState<GameState>('ready');
  const [ball, setBall] = useState<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 100,
    vx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    vy: -BALL_SPEED,
    radius: BALL_RADIUS
  });
  const [paddle, setPaddle] = useState<Paddle>({
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - 30,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  });
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);

  // 레벨별 벽돌 생성
  const generateBricks = useCallback((levelNum: number): Brick[] => {
    const newBricks: Brick[] = [];
    const startX = (CANVAS_WIDTH - (BRICK_COLS * (BRICK_WIDTH + BRICK_PADDING) - BRICK_PADDING)) / 2;

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        // 레벨이 높을수록 더 강한 벽돌
        const maxHits = Math.min(1 + Math.floor((row + levelNum - 1) / 2), BRICK_COLORS.length);
        
        newBricks.push({
          x: startX + col * (BRICK_WIDTH + BRICK_PADDING),
          y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING),
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          color: BRICK_COLORS[maxHits - 1],
          hits: maxHits,
          maxHits
        });
      }
    }
    return newBricks;
  }, []);

  // AABB 충돌 감지
  const checkAABBCollision = useCallback((
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ) => {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }, []);

  // 공과 사각형의 충돌 감지 (원-사각형)
  const checkBallRectCollision = useCallback((ball: Ball, rect: { x: number; y: number; width: number; height: number }) => {
    const distX = Math.abs(ball.x - rect.x - rect.width / 2);
    const distY = Math.abs(ball.y - rect.y - rect.height / 2);

    if (distX > (rect.width / 2 + ball.radius) || distY > (rect.height / 2 + ball.radius)) {
      return null;
    }

    if (distX <= rect.width / 2 || distY <= rect.height / 2) {
      // 충돌 방향 계산 (법선 벡터)
      const dx = ball.x - (rect.x + rect.width / 2);
      const dy = ball.y - (rect.y + rect.height / 2);
      
      if (Math.abs(dx / rect.width) > Math.abs(dy / rect.height)) {
        return { normal: { x: dx > 0 ? 1 : -1, y: 0 } };
      } else {
        return { normal: { x: 0, y: dy > 0 ? 1 : -1 } };
      }
    }

    return null;
  }, []);

  // 속도 반사 (법선 벡터 기준)
  const reflectVelocity = useCallback((vx: number, vy: number, normalX: number, normalY: number) => {
    const dot = vx * normalX + vy * normalY;
    return {
      vx: vx - 2 * dot * normalX,
      vy: vy - 2 * dot * normalY
    };
  }, []);

  // 게임 시작
  const startGame = useCallback(() => {
    setBricks(generateBricks(level));
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      vx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      vy: -BALL_SPEED,
      radius: BALL_RADIUS
    });
    setPaddle({
      x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
      y: CANVAS_HEIGHT - 30,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    });
    setGameState('playing');
  }, [level, generateBricks]);

  // 다음 레벨
  const nextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    setGameState('ready');
  }, []);

  // 게임 오버 처리
  const gameOver = useCallback(() => {
    setGameState('gameOver');
  }, []);

  // 생명 잃기
  const loseLife = useCallback(() => {
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        gameOver();
        return 0;
      }
      
      // 공 리셋
      setBall({
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - 100,
        vx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
        vy: -BALL_SPEED,
        radius: BALL_RADIUS
      });
      
      return newLives;
    });
  }, [gameOver]);

  // 게임 루프
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    setBall(prevBall => {
      let newBall = { ...prevBall };
      
      // 공 이동
      newBall.x += newBall.vx;
      newBall.y += newBall.vy;

      // 벽 충돌
      if (newBall.x - newBall.radius <= 0 || newBall.x + newBall.radius >= CANVAS_WIDTH) {
        newBall.vx = -newBall.vx;
        newBall.x = Math.max(newBall.radius, Math.min(CANVAS_WIDTH - newBall.radius, newBall.x));
      }
      if (newBall.y - newBall.radius <= 0) {
        newBall.vy = -newBall.vy;
        newBall.y = newBall.radius;
      }

      // 바닥 충돌 (생명 잃기)
      if (newBall.y + newBall.radius >= CANVAS_HEIGHT) {
        loseLife();
        return prevBall;
      }

      // 패들 충돌
      const paddleCollision = checkBallRectCollision(newBall, paddle);
      if (paddleCollision) {
        const hitPos = (newBall.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        const angle = hitPos * Math.PI / 3; // 최대 60도 각도
        
        newBall.vx = BALL_SPEED * Math.sin(angle);
        newBall.vy = -BALL_SPEED * Math.cos(angle);
        newBall.y = paddle.y - newBall.radius;
      }

      // 벽돌 충돌
      setBricks(prevBricks => {
        let newBricks = [...prevBricks];
        let ballChanged = false;

        for (let i = 0; i < newBricks.length; i++) {
          const brick = newBricks[i];
          const collision = checkBallRectCollision(newBall, brick);
          
          if (collision && !ballChanged) {
            // 속도 반사
            const reflected = reflectVelocity(newBall.vx, newBall.vy, collision.normal.x, collision.normal.y);
            newBall.vx = reflected.vx;
            newBall.vy = reflected.vy;
            ballChanged = true;

            // 벽돌 데미지
            brick.hits--;
            if (brick.hits <= 0) {
              // 벽돌 파괴
              newBricks.splice(i, 1);
              setScore(prev => prev + brick.maxHits * 10);
            } else {
              // 색상 변경
              brick.color = BRICK_COLORS[brick.hits - 1];
            }
            break;
          }
        }

        // 모든 벽돌 파괴 시 레벨 완료
        if (newBricks.length === 0) {
          setGameState('levelComplete');
        }

        return newBricks;
      });

      return newBall;
    });

    // 패들 이동
    setPaddle(prevPaddle => {
      let newPaddle = { ...prevPaddle };
      const moveSpeed = 8;

      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        newPaddle.x = Math.max(0, newPaddle.x - moveSpeed);
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        newPaddle.x = Math.min(CANVAS_WIDTH - newPaddle.width, newPaddle.x + moveSpeed);
      }

      return newPaddle;
    });

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, paddle, checkBallRectCollision, reflectVelocity, loseLife]);

  // 키보드 입력
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      
      if (e.key === ' ') {
        e.preventDefault();
        if (gameState === 'ready') {
          startGame();
        } else if (gameState === 'levelComplete') {
          nextLevel();
        } else if (gameState === 'playing') {
          setGameState('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startGame, nextLevel]);

  // 게임 루프 시작/정지
  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [gameState, gameLoop]);

  // 캔버스 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 벽돌 그리기
    bricks.forEach(brick => {
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      
      // 테두리
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    });

    // 패들 그리기
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#cccccc');
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // 공 그리기
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // UI 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(`점수: ${score}`, 10, 30);
    ctx.fillText(`레벨: ${level}`, 150, 30);
    ctx.fillText(`생명: ${lives}`, 250, 30);

    // 게임 상태별 메시지
    if (gameState === 'ready') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('BREAKOUT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.font = '20px Arial';
      ctx.fillText('스페이스바를 눌러 시작', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText('← → 또는 A D 키로 패들 이동', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.textAlign = 'left';
    } else if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('일시정지', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '20px Arial';
      ctx.fillText('스페이스바로 계속', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      ctx.textAlign = 'left';
    } else if (gameState === 'levelComplete') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#4CAF50';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('레벨 완료!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.font = '20px Arial';
      ctx.fillText('스페이스바로 다음 레벨', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.textAlign = 'left';
    } else if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ff4444';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('게임 오버', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.font = '20px Arial';
      ctx.fillText(`최종 점수: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.textAlign = 'left';
    }
  }, [ball, paddle, bricks, score, level, lives, gameState]);

  // 게임 리셋
  const resetGame = useCallback(() => {
    setScore(0);
    setLevel(1);
    setLives(3);
    setGameState('ready');
  }, []);

  const gameStats = (
    <div>
      점수: {score} | 레벨: {level} | 목숨: {lives}
    </div>
  );

  const instructions =
    '← → 또는 A/D : 패들 이동\n스페이스바: 시작/일시정지';

  const actionButtons =
    gameState === 'gameOver' ? (
      <GameButton onClick={resetGame} variant="primary" size="large">
        다시 시작
      </GameButton>
    ) : undefined;

  return (
    <GameManager
      title="Breakout"
      gameIcon="🧱"
      gameStats={gameStats}
      gameStatus={gameState === 'gameOver' ? '게임 오버' : gameState === 'levelComplete' ? '클리어!' : undefined}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <GameCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        gameTitle="Breakout"
        style={{
          border: '2px solid #333',
          borderRadius: '8px',
          backgroundColor: '#0a0a0a'
        }}
      />
    </GameManager>
  );
};

export default BreakoutCanvas;
