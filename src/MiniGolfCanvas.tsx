import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { spacing, typography } from './theme/gameTheme';

interface Vector2 {
  x: number;
  y: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isMoving: boolean;
}

interface Hole {
  x: number;
  y: number;
  radius: number;
}

interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

enum GameState {
  AIMING = 'aiming',
  BALL_MOVING = 'ball_moving',
  HOLE_IN_ONE = 'hole_in_one',
  GAME_COMPLETE = 'game_complete'
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BALL_RADIUS = 8;
const HOLE_RADIUS = 20;
const FRICTION = 0.98;
const MIN_VELOCITY = 0.1;
const MAX_POWER = 15;
const POWER_SCALE = 0.3;

const MiniGolfCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<GameState>(GameState.AIMING);
  const [shots, setShots] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Vector2>({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState<Vector2>({ x: 0, y: 0 });
  
  // 볼 상태
  const [ball, setBall] = useState<Ball>({
    x: 100,
    y: 500,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    isMoving: false
  });

  // 홀 위치
  const hole: Hole = {
    x: 700,
    y: 100,
    radius: HOLE_RADIUS
  };

  // 코스 벽들
  const walls: Wall[] = [
    // 외곽 벽
    { x1: 20, y1: 20, x2: CANVAS_WIDTH - 20, y2: 20 }, // 상단
    { x1: CANVAS_WIDTH - 20, y1: 20, x2: CANVAS_WIDTH - 20, y2: CANVAS_HEIGHT - 20 }, // 우측
    { x1: CANVAS_WIDTH - 20, y1: CANVAS_HEIGHT - 20, x2: 20, y2: CANVAS_HEIGHT - 20 }, // 하단
    { x1: 20, y1: CANVAS_HEIGHT - 20, x2: 20, y2: 20 }, // 좌측
    
    // 장애물 벽들
    { x1: 200, y1: 150, x2: 300, y2: 150 }, // 수평 장애물 1
    { x1: 400, y1: 300, x2: 500, y2: 250 }, // 경사 장애물
    { x1: 300, y1: 400, x2: 300, y2: 350 }, // 수직 장애물
    { x1: 500, y1: 450, x2: 600, y2: 450 }, // 수평 장애물 2
  ];

  // 장애물들 (시각적 표현용)
  const obstacles: Obstacle[] = [
    { x: 200, y: 140, width: 100, height: 20 },
    { x: 290, y: 340, width: 20, height: 60 },
    { x: 500, y: 440, width: 100, height: 20 },
  ];

  // 벡터 길이 계산
  const vectorLength = useCallback((v: Vector2): number => {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  }, []);

  // 벡터 정규화
  const normalizeVector = useCallback((v: Vector2): Vector2 => {
    const len = vectorLength(v);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  }, [vectorLength]);

  // 점과 선분 사이의 최단거리 계산
  const distancePointToLine = useCallback((point: Vector2, line: Wall): { distance: number, closest: Vector2 } => {
    const A = point.x - line.x1;
    const B = point.y - line.y1;
    const C = line.x2 - line.x1;
    const D = line.y2 - line.y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      return {
        distance: Math.sqrt(A * A + B * B),
        closest: { x: line.x1, y: line.y1 }
      };
    }

    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const closest = {
      x: line.x1 + param * C,
      y: line.y1 + param * D
    };

    const dx = point.x - closest.x;
    const dy = point.y - closest.y;
    
    return {
      distance: Math.sqrt(dx * dx + dy * dy),
      closest
    };
  }, []);

  // 벽 충돌 처리
  const handleWallCollision = useCallback((currentBall: Ball): Ball => {
    let newBall = { ...currentBall };
    
    for (const wall of walls) {
      const ballPos = { x: newBall.x, y: newBall.y };
      const { distance, closest } = distancePointToLine(ballPos, wall);
      
      if (distance < newBall.radius) {
        // 충돌 발생
        const overlap = newBall.radius - distance;
        
        // 충돌 지점에서 볼로의 방향벡터
        const dx = newBall.x - closest.x;
        const dy = newBall.y - closest.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len > 0) {
          const normalX = dx / len;
          const normalY = dy / len;
          
          // 볼을 벽에서 밀어냄
          newBall.x += normalX * overlap;
          newBall.y += normalY * overlap;
          
          // 속도 반사 (벽의 법선벡터를 이용한 반사)
          const dotProduct = newBall.vx * normalX + newBall.vy * normalY;
          newBall.vx -= 2 * dotProduct * normalX * 0.8; // 에너지 손실
          newBall.vy -= 2 * dotProduct * normalY * 0.8;
        }
      }
    }
    
    return newBall;
  }, [walls, distancePointToLine]);

  // 홀 충돌 확인
  const checkHoleCollision = useCallback((currentBall: Ball): boolean => {
    const dx = currentBall.x - hole.x;
    const dy = currentBall.y - hole.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (hole.radius - currentBall.radius / 2);
  }, [hole]);

  // 볼 물리 업데이트
  const updateBall = useCallback(() => {
    setBall(prevBall => {
      if (!prevBall.isMoving) return prevBall;
      
      let newBall = { ...prevBall };
      
      // 위치 업데이트
      newBall.x += newBall.vx;
      newBall.y += newBall.vy;
      
      // 벽 충돌 처리
      newBall = handleWallCollision(newBall);
      
      // 마찰 적용
      newBall.vx *= FRICTION;
      newBall.vy *= FRICTION;
      
      // 속도가 너무 낮으면 정지
      const speed = vectorLength({ x: newBall.vx, y: newBall.vy });
      if (speed < MIN_VELOCITY) {
        newBall.vx = 0;
        newBall.vy = 0;
        newBall.isMoving = false;
        setGameState(GameState.AIMING);
      }
      
      // 홀 인 체크
      if (checkHoleCollision(newBall)) {
        newBall.isMoving = false;
        newBall.vx = 0;
        newBall.vy = 0;
        setGameState(GameState.HOLE_IN_ONE);
        
        setTimeout(() => {
          setGameState(GameState.GAME_COMPLETE);
        }, 2000);
      }
      
      return newBall;
    });
  }, [handleWallCollision, vectorLength, checkHoleCollision]);

  // 마우스/터치 이벤트 처리
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== GameState.AIMING || ball.isMoving) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 볼 근처에서만 드래그 시작
    const dx = x - ball.x;
    const dy = y - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 50) { // 볼 근처 50px 범위에서만 드래그 가능
      setIsDragging(true);
      setDragStart({ x, y });
      setDragCurrent({ x, y });
    }
  }, [gameState, ball]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setDragCurrent({ x, y });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // 파워 계산 (드래그 거리 기반)
    const dx = dragCurrent.x - dragStart.x;
    const dy = dragCurrent.y - dragStart.y;
    const power = Math.min(vectorLength({ x: dx, y: dy }) * POWER_SCALE, MAX_POWER);

    if (power > 1) { // 최소 파워 임계값
      const direction = normalizeVector({ x: -dx, y: -dy }); // 드래그 반대 방향

      setBall(prevBall => ({
        ...prevBall,
        vx: direction.x * power,
        vy: direction.y * power,
        isMoving: true
      }));

      setGameState(GameState.BALL_MOVING);
      setShots(prev => prev + 1);
    }
  }, [isDragging, dragCurrent, dragStart, vectorLength, normalizeVector]);

  // 게임 재시작
  const restartGame = useCallback(() => {
    setBall({
      x: 100,
      y: 500,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      isMoving: false
    });
    setGameState(GameState.AIMING);
    setShots(0);
    setIsDragging(false);
  }, []);

  // 게임 루프
  useEffect(() => {
    const gameLoop = () => {
      if (gameState === GameState.BALL_MOVING) {
        updateBall();
      }
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, updateBall]);

  // 캔버스 렌더링
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경 (골프 코스)
    ctx.fillStyle = '#228B22'; // 잔디 녹색
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 코스 경계
    ctx.fillStyle = '#8B4513'; // 갈색
    ctx.fillRect(0, 0, CANVAS_WIDTH, 40); // 상단
    ctx.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40); // 하단
    ctx.fillRect(0, 0, 40, CANVAS_HEIGHT); // 좌측
    ctx.fillRect(CANVAS_WIDTH - 40, 0, 40, CANVAS_HEIGHT); // 우측

    // 장애물 그리기
    ctx.fillStyle = '#654321';
    obstacles.forEach(obs => {
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      
      // 그림자 효과
      ctx.fillStyle = '#543c1a';
      ctx.fillRect(obs.x + 2, obs.y + 2, obs.width, obs.height);
      ctx.fillStyle = '#654321';
    });

    // 경사 장애물 (삼각형 형태)
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(400, 300);
    ctx.lineTo(500, 250);
    ctx.lineTo(500, 300);
    ctx.closePath();
    ctx.fill();

    // 홀 그리기
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
    ctx.fill();

    // 홀 테두리
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 홀 깊이감을 위한 내부 원
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, hole.radius - 5, 0, Math.PI * 2);
    ctx.fill();

    // 볼 그리기
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // 볼 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(ball.x + 2, ball.y + 2, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // 볼 하이라이트
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, ball.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // 조준선 그리기 (드래그 중일 때)
    if (isDragging && gameState === GameState.AIMING) {
      const dx = dragCurrent.x - dragStart.x;
      const dy = dragCurrent.y - dragStart.y;
      const power = Math.min(vectorLength({ x: dx, y: dy }) * POWER_SCALE, MAX_POWER);
      
      if (power > 1) {
        const direction = normalizeVector({ x: -dx, y: -dy });
        const lineLength = power * 10; // 시각적 길이
        
        // 조준선
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(
          ball.x + direction.x * lineLength,
          ball.y + direction.y * lineLength
        );
        ctx.stroke();
        ctx.setLineDash([]);

        // 파워 게이지
        const powerPercent = (power / MAX_POWER) * 100;
        ctx.fillStyle = powerPercent > 70 ? '#FF4444' : powerPercent > 40 ? '#FFAA44' : '#44FF44';
        ctx.fillRect(ball.x - 30, ball.y - 50, 60, 8);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(ball.x - 30, ball.y - 50, (60 * powerPercent) / 100, 8);
      }
    }

    // UI 텍스트
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Shots: ${shots}`, 20, 100);

    if (gameState === GameState.AIMING && !ball.isMoving) {
      ctx.font = '16px Arial';
      ctx.fillText('볼 근처에서 드래그하여 샷을 하세요!', 20, 140);
    }

    // 게임 완료 메시지
    if (gameState === GameState.HOLE_IN_ONE) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('홀 인 원! ⛳', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`${shots}번 만에 성공!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    if (gameState === GameState.GAME_COMPLETE) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#4CAF50';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('게임 완료! 🏆', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`총 ${shots}번의 샷으로 완료`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText('클릭하여 다시 시작', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }
  }, [ball, hole, obstacles, isDragging, dragCurrent, dragStart, gameState, shots, vectorLength, normalizeVector]);

  // 캔버스 렌더링 루프
  useEffect(() => {
    const renderLoop = () => {
      draw();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }, [draw]);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      event.stopPropagation();
      restartGame();
    }
  }, [restartGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);

  // 컴포넌트 포커스
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const getStatusText = () => {
    if (gameState === GameState.GAME_COMPLETE) {
      return `게임 완료! 🏆 (${shots}샷)`;
    }
    if (gameState === GameState.HOLE_IN_ONE) {
      return `홀 인 원! ⛳ (${shots}샷)`;
    }
    if (gameState === GameState.BALL_MOVING) {
      return `볼 이동 중... (현재: ${shots}샷)`;
    }
    return `조준 중 (현재: ${shots}샷)`;
  };

  // 상단 정보 (게임 목표/상태)
  const topInfo = (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        ...typography.gameStatus,
        fontSize: 18,
        marginBottom: spacing.sm
      }}>
        {getStatusText()}
      </div>
      <div style={{
        fontSize: 14,
        color: '#bcbcbe'
      }}>
        🎯 목표: 최소한의 샷으로 볼을 홀에 넣으세요!
      </div>
    </div>
  );

  // 하단 정보 (조작법)
  const bottomInfo = (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>조작법:</strong> 볼 근처에서 마우스를 드래그하여 방향과 파워를 설정
      </div>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>게임:</strong> R키 = 재시작, 게임 완료 시 화면 클릭으로 재시작
      </div>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>팁:</strong> 벽을 이용해 리바운드 샷을 활용해보세요
      </div>
      <div style={{ marginTop: spacing.sm }}>
        <GameButton 
          onClick={restartGame}
          variant="primary"
          size="large"
          style={{ minWidth: 120 }}
        >
          새 게임
        </GameButton>
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <GameLayout 
        title="⛳ 미니골프"
        topInfo={topInfo}
        bottomInfo={bottomInfo}
      >
        <GameCanvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={gameState === GameState.GAME_COMPLETE ? restartGame : undefined}
          gameTitle="Mini Golf"
          style={{ 
            cursor: gameState === GameState.AIMING ? 'crosshair' : 'default',
            backgroundColor: '#228B22'
          }}
        />
      </GameLayout>
    </div>
  );
};

export default MiniGolfCanvas;