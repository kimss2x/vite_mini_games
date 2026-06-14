import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

type GameState = 'ready' | 'playing' | 'gameOver';

interface Bird {
  x: number;
  y: number;
  velocity: number;
  width: number;
  height: number;
}

interface Pipe {
  id: number;
  x: number;
  topHeight: number;
  bottomY: number;
  width: number;
  passed: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 24;
const PIPE_WIDTH = 80;
const PIPE_GAP = 200;
const PIPE_SPEED = 3;
const PIPE_SPAWN_INTERVAL = 1500; // 1.5초마다 파이프 생성

// 물리 상수
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const MAX_FALL_SPEED = 10;

// 색상
const BIRD_COLOR = '#FFD700';
const PIPE_COLOR = '#4CAF50';
const BACKGROUND_COLOR = '#87CEEB';
const GROUND_COLOR = '#DEB887';

const FlappyBirdCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastPipeSpawnRef = useRef<number>(0);
  const pipeIdRef = useRef(0);
  
  const [gameState, setGameState] = useState<GameState>('ready');
  const [bird, setBird] = useState<Bird>({
    x: 150,
    y: CANVAS_HEIGHT / 2,
    velocity: 0,
    width: BIRD_WIDTH,
    height: BIRD_HEIGHT
  });
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [backgroundX, setBackgroundX] = useState(0);

  // 파이프 생성
  const createPipe = useCallback((x: number): Pipe => {
    const minTopHeight = 50;
    const maxTopHeight = CANVAS_HEIGHT - PIPE_GAP - 100; // 바닥 여유공간
    const topHeight = minTopHeight + Math.random() * (maxTopHeight - minTopHeight);
    
    return {
      id: pipeIdRef.current++,
      x,
      topHeight,
      bottomY: topHeight + PIPE_GAP,
      width: PIPE_WIDTH,
      passed: false
    };
  }, []);

  // AABB 충돌 감지
  const checkAABBCollision = useCallback((
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ) => {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }, []);

  // 새와 파이프 충돌 검사
  const checkBirdPipeCollision = useCallback((bird: Bird, pipe: Pipe) => {
    // 위쪽 파이프와 충돌
    const topCollision = checkAABBCollision(
      bird.x, bird.y, bird.width, bird.height,
      pipe.x, 0, pipe.width, pipe.topHeight
    );
    
    // 아래쪽 파이프와 충돌
    const bottomCollision = checkAABBCollision(
      bird.x, bird.y, bird.width, bird.height,
      pipe.x, pipe.bottomY, pipe.width, CANVAS_HEIGHT - pipe.bottomY
    );
    
    return topCollision || bottomCollision;
  }, [checkAABBCollision]);

  // 점프 함수
  const jump = useCallback(() => {
    if (gameState === 'ready') {
      setGameState('playing');
      lastPipeSpawnRef.current = performance.now();
    }
    
    if (gameState === 'playing') {
      setBird(prev => ({
        ...prev,
        velocity: JUMP_FORCE
      }));
    }
  }, [gameState]);

  // 게임 시작/재시작
  const startGame = useCallback(() => {
    setBird({
      x: 150,
      y: CANVAS_HEIGHT / 2,
      velocity: 0,
      width: BIRD_WIDTH,
      height: BIRD_HEIGHT
    });
    setPipes([]);
    setScore(0);
    setBackgroundX(0);
    setGameState('ready');
    pipeIdRef.current = 0;
    lastPipeSpawnRef.current = 0;
  }, []);

  // 게임 루프
  const gameLoop = useCallback(() => {
    const currentTime = performance.now();
    
    if (gameState === 'playing') {
      // 새 물리 업데이트
      setBird(prev => {
        let newBird = { ...prev };
        
        // 중력 적용
        newBird.velocity += GRAVITY;
        
        // 최대 낙하 속도 제한
        if (newBird.velocity > MAX_FALL_SPEED) {
          newBird.velocity = MAX_FALL_SPEED;
        }
        
        // 위치 업데이트
        newBird.y += newBird.velocity;
        
        // 바닥/천장 충돌 검사
        if (newBird.y + newBird.height >= CANVAS_HEIGHT - 50 || newBird.y <= 0) {
          setGameState('gameOver');
          setBestScore(prev => Math.max(prev, score));
          return prev;
        }
        
        return newBird;
      });

      // 배경 스크롤
      setBackgroundX(prev => prev - 1);

      // 파이프 스폰
      if (currentTime - lastPipeSpawnRef.current > PIPE_SPAWN_INTERVAL) {
        setPipes(prev => [...prev, createPipe(CANVAS_WIDTH)]);
        lastPipeSpawnRef.current = currentTime;
      }

      // 파이프 이동 및 충돌 검사
      setPipes(prev => {
        const updatedPipes = prev.map(pipe => ({
          ...pipe,
          x: pipe.x - PIPE_SPEED
        })).filter(pipe => pipe.x + pipe.width > -50); // 화면 밖 파이프 제거

        // 충돌 검사
        for (const pipe of updatedPipes) {
          if (checkBirdPipeCollision(bird, pipe)) {
            setGameState('gameOver');
            setBestScore(prev => Math.max(prev, score));
            break;
          }
        }

        return updatedPipes;
      });

      // 점수 업데이트 (파이프 통과)
      setPipes(prev => {
        const updatedPipes = prev.map(pipe => {
          if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            setScore(prevScore => prevScore + 1);
            return { ...pipe, passed: true };
          }
          return pipe;
        });
        return updatedPipes;
      });
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, bird, score, createPipe, checkBirdPipeCollision]);

  // 키보드 및 마우스 입력
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        jump();
      }
      if (e.key === 'r' && gameState === 'gameOver') {
        startGame();
      }
    };

    const handleClick = () => {
      if (gameState === 'gameOver') {
        startGame();
      } else {
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [gameState, jump, startGame]);

  // 게임 루프 시작/정지
  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [gameLoop]);

  // 캔버스 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, BACKGROUND_COLOR);
    gradient.addColorStop(1, '#98E4FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 구름 효과 (배경 스크롤)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 5; i++) {
      const x = (backgroundX + i * 200) % (CANVAS_WIDTH + 100) - 50;
      const y = 50 + i * 30;
      ctx.beginPath();
      ctx.arc(x, y, 30 + i * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 25, y, 40 + i * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 파이프 그리기
    pipes.forEach(pipe => {
      // 위쪽 파이프
      ctx.fillStyle = PIPE_COLOR;
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      
      // 파이프 캡 (위)
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, pipe.width + 10, 30);
      
      // 아래쪽 파이프
      ctx.fillStyle = PIPE_COLOR;
      ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, CANVAS_HEIGHT - pipe.bottomY);
      
      // 파이프 캡 (아래)
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 30);
      
      // 파이프 테두리
      ctx.strokeStyle = '#1B5E20';
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x, 0, pipe.width, pipe.topHeight);
      ctx.strokeRect(pipe.x, pipe.bottomY, pipe.width, CANVAS_HEIGHT - pipe.bottomY);
    });

    // 바닥
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
    
    // 바닥 패턴
    ctx.fillStyle = '#CD853F';
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      ctx.fillRect(i, CANVAS_HEIGHT - 45, 10, 5);
    }

    // 새 그리기
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    
    // 새의 회전 각도 (속도에 따라)
    const angle = Math.max(-0.5, Math.min(0.5, bird.velocity * 0.05));
    ctx.rotate(angle);
    
    // 새 몸체
    ctx.fillStyle = BIRD_COLOR;
    ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
    
    // 새 부리
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(bird.width / 2 - 5, -3, 12, 6);
    
    // 새 눈
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(5, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 새 테두리
    ctx.strokeStyle = '#FFB300';
    ctx.lineWidth = 2;
    ctx.strokeRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
    
    ctx.restore();

    // UI 텍스트
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.strokeText(score.toString(), CANVAS_WIDTH / 2, 60);
    ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 60);

    // 게임 상태별 메시지
    if (gameState === 'ready') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px Arial';
      ctx.strokeText('Flappy Bird', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillText('Flappy Bird', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = 'bold 24px Arial';
      ctx.strokeText('스페이스바나 클릭으로 점프!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText('스페이스바나 클릭으로 점프!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    } else if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 48px Arial';
      ctx.strokeText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Arial';
      ctx.strokeText(`점수: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText(`점수: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      
      ctx.strokeText(`최고 점수: ${bestScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      ctx.fillText(`최고 점수: ${bestScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      
      ctx.strokeText('클릭하거나 R키로 다시 시작', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
      ctx.fillText('클릭하거나 R키로 다시 시작', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    }

    ctx.textAlign = 'left';
  }, [bird, pipes, score, bestScore, gameState, backgroundX]);

  // 컴포넌트 시작 시 게임 초기화
  useEffect(() => {
    startGame();
  }, [startGame]);

  const gameStats = (
    <div>
      점수: {score} | 최고: {bestScore}
    </div>
  );

  const instructions =
    '스페이스바 또는 클릭: 점프\n파이프 사이를 통과하며 점수를 쌓으세요!';

  const actionButtons =
    gameState === 'gameOver' ? (
      <GameButton onClick={startGame} variant="primary" size="large">
        다시 시작
      </GameButton>
    ) : undefined;

  return (
    <GameManager
      title="Flappy Bird"
      gameIcon="🐦"
      gameStats={gameStats}
      gameStatus={gameState === 'gameOver' ? '게임 오버' : undefined}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <GameCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        gameTitle="Flappy Bird"
        style={{
          border: '2px solid #333',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      />
    </GameManager>
  );
};

export default FlappyBirdCanvas;
