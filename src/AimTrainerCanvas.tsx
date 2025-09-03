import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameManager from './components/GameManager';
import PureGameCanvas from './components/PureGameCanvas';
import GameButton from './components/GameButton';

type GameState = 'ready' | 'playing' | 'finished';

interface Target {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  createdAt: number;
}

interface GameStats {
  hits: number;
  misses: number;
  totalClicks: number;
  averageReactionTime: number;
  bestReactionTime: number;
}

const GAME_DURATION = 30; // 30초
const TARGET_LIFETIME = 2000; // 2초 후 자동 사라짐
const MIN_RADIUS = 20;
const MAX_RADIUS = 40;
const CANVAS_MARGIN = 50;

const TARGET_COLORS = [
  '#ff4444', '#44ff44', '#4444ff', '#ffff44', 
  '#ff44ff', '#44ffff', '#ff8844'
];

const AimTrainerCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const targetIdRef = useRef(0);
  const lastTargetSpawnRef = useRef(0);
  
  const [gameState, setGameState] = useState<GameState>('ready');
  const [targets, setTargets] = useState<Target[]>([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [stats, setStats] = useState<GameStats>({
    hits: 0,
    misses: 0,
    totalClicks: 0,
    averageReactionTime: 0,
    bestReactionTime: Infinity
  });
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);

  const canvasWidth = 800;
  const canvasHeight = 600;

  // 랜덤 타겟 생성
  const createTarget = useCallback((): Target => {
    const radius = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
    const x = CANVAS_MARGIN + radius + Math.random() * (canvasWidth - 2 * (CANVAS_MARGIN + radius));
    const y = CANVAS_MARGIN + radius + Math.random() * (canvasHeight - 2 * (CANVAS_MARGIN + radius));
    
    return {
      id: targetIdRef.current++,
      x,
      y,
      radius,
      color: TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)],
      createdAt: performance.now()
    };
  }, [canvasWidth, canvasHeight]);

  // 타겟과 마우스 클릭 위치 거리 체크
  const isClickInTarget = useCallback((clickX: number, clickY: number, target: Target): boolean => {
    const dx = clickX - target.x;
    const dy = clickY - target.y;
    return dx * dx + dy * dy <= target.radius * target.radius;
  }, []);

  // 캔버스 클릭 처리
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const currentTime = performance.now();

    setStats(prev => ({
      ...prev,
      totalClicks: prev.totalClicks + 1
    }));

    // 클릭한 타겟 찾기
    const hitTarget = targets.find(target => isClickInTarget(clickX, clickY, target));

    if (hitTarget) {
      // 타겟 히트
      const reactionTime = currentTime - hitTarget.createdAt;
      const newReactionTimes = [...reactionTimes, reactionTime];
      setReactionTimes(newReactionTimes);
      
      setStats(prev => ({
        hits: prev.hits + 1,
        misses: prev.misses,
        totalClicks: prev.totalClicks,
        averageReactionTime: newReactionTimes.reduce((a, b) => a + b, 0) / newReactionTimes.length,
        bestReactionTime: Math.min(prev.bestReactionTime, reactionTime)
      }));

      // 히트한 타겟 제거
      setTargets(prev => prev.filter(target => target.id !== hitTarget.id));
    } else {
      // 미스
      setStats(prev => ({
        ...prev,
        misses: prev.misses + 1
      }));
    }
  }, [gameState, targets, isClickInTarget, reactionTimes]);

  // 게임 시작
  const startGame = useCallback(() => {
    setGameState('playing');
    setTargets([]);
    setTimeLeft(GAME_DURATION);
    setStats({
      hits: 0,
      misses: 0,
      totalClicks: 0,
      averageReactionTime: 0,
      bestReactionTime: Infinity
    });
    setReactionTimes([]);
    targetIdRef.current = 0;
    lastTargetSpawnRef.current = performance.now();
  }, []);

  // 게임 루프
  const gameLoop = useCallback(() => {
    const currentTime = performance.now();

    if (gameState === 'playing') {
      // 새 타겟 생성 (0.8-1.5초 간격)
      if (currentTime - lastTargetSpawnRef.current > 800 + Math.random() * 700) {
        setTargets(prev => [...prev, createTarget()]);
        lastTargetSpawnRef.current = currentTime;
      }

      // 오래된 타겟 제거 (시간 초과)
      setTargets(prev => 
        prev.filter(target => currentTime - target.createdAt < TARGET_LIFETIME)
      );

      // 시간 초과로 사라진 타겟은 미스로 카운트
      setTargets(prev => {
        const expiredTargets = prev.filter(target => currentTime - target.createdAt >= TARGET_LIFETIME);
        if (expiredTargets.length > 0) {
          setStats(prevStats => ({
            ...prevStats,
            misses: prevStats.misses + expiredTargets.length
          }));
        }
        return prev.filter(target => currentTime - target.createdAt < TARGET_LIFETIME);
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState, createTarget]);

  // 타이머
  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('finished');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState]);

  // 게임 루프 시작/정지
  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [gameState, gameLoop]);

  // Canvas 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경 클리어
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 격자 그리기 (조준선 역할)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvasWidth; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasHeight);
      ctx.stroke();
    }
    for (let i = 0; i <= canvasHeight; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasWidth, i);
      ctx.stroke();
    }

    // 타겟 그리기
    targets.forEach(target => {
      const currentTime = performance.now();
      const age = currentTime - target.createdAt;
      const opacity = Math.max(0.3, 1 - age / TARGET_LIFETIME);
      
      // 외곽선 (더 넓은 원)
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 메인 타겟
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      ctx.fillStyle = target.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
      ctx.fill();

      // 중앙점
      ctx.beginPath();
      ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });

    // 크로스헤어 (중앙)
    if (gameState === 'playing') {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY);
      ctx.lineTo(centerX + 10, centerY);
      ctx.moveTo(centerX, centerY - 10);
      ctx.lineTo(centerX, centerY + 10);
      ctx.stroke();
    }
  }, [targets, gameState, canvasWidth, canvasHeight]);

  // 정확도 계산
  const accuracy = stats.totalClicks > 0 ? (stats.hits / stats.totalClicks * 100).toFixed(1) : '0.0';

  const getGameStatus = () => {
    if (gameState === 'finished') {
      return `게임 완료! 🎯 (${stats.hits}회 적중)`;
    }
    if (gameState === 'playing') {
      return '게임 진행 중';
    }
    return '게임 준비 중';
  };

  const gameStats = (
    <div style={{ 
      display: 'flex', 
      gap: '20px', 
      justifyContent: 'center',
      fontSize: '16px'
    }}>
      <span>시간: <span style={{ color: timeLeft <= 10 ? '#ff4444' : '#44ff44' }}>{timeLeft}s</span></span>
      <span>점수: <span style={{ color: '#4CAF50' }}>{stats.hits}</span></span>
      <span>정확도: <span style={{ color: '#2196F3' }}>{accuracy}%</span></span>
      {gameState === 'playing' && (
        <span>타겟: <span style={{ color: '#FF9800' }}>{targets.length}</span></span>
      )}
    </div>
  );

  const getInstructions = () => {
    if (gameState === 'ready') {
      return "나타나는 원을 클릭하세요! 2초 안에 클릭하지 않으면 사라집니다.";
    }
    if (gameState === 'playing') {
      return "화면에 나타나는 원형 타겟을 빠르게 클릭하세요!";
    }
    return "정확성과 반응속도를 향상시키는 에임 훈련 게임입니다.";
  };

  const actionButtons = (
    <>
      {gameState === 'ready' && (
        <GameButton
          onClick={startGame}
          variant="primary"
          size="large"
        >
          게임 시작
        </GameButton>
      )}

      {gameState === 'finished' && (
        <div>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <div style={{ marginBottom: '10px' }}>🎯 총 적중: <strong>{stats.hits}</strong></div>
            <div style={{ marginBottom: '10px' }}>❌ 실패: <strong>{stats.misses}</strong></div>
            <div style={{ marginBottom: '10px' }}>📊 정확도: <strong>{accuracy}%</strong></div>
            {stats.bestReactionTime !== Infinity && (
              <>
                <div style={{ marginBottom: '10px' }}>⚡ 최고 반응속도: <strong>{Math.round(stats.bestReactionTime)}ms</strong></div>
                <div style={{ marginBottom: '10px' }}>📈 평균 반응속도: <strong>{Math.round(stats.averageReactionTime)}ms</strong></div>
              </>
            )}
          </div>
          <GameButton
            onClick={startGame}
            variant="primary"
            size="large"
          >
            다시 플레이
          </GameButton>
        </div>
      )}
    </>
  );

  return (
    <GameManager
      title="Aim Trainer"
      gameIcon="🎯"
      gameStats={gameStats}
      gameStatus={getGameStatus()}
      instructions={getInstructions()}
      actionButtons={actionButtons}
    >
      <PureGameCanvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleCanvasClick}
        gameTitle="Aim Trainer"
        style={{
          cursor: gameState === 'playing' ? 'crosshair' : 'pointer',
          backgroundColor: '#1a1a1a',
          border: '2px solid #333',
          borderRadius: '8px'
        }}
      />
    </GameManager>
  );
};

export default AimTrainerCanvas;