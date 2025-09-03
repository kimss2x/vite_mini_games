import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameManager from './components/GameManager';
import GameButton from './components/GameButton';

type GameState = 'ready' | 'waiting' | 'action' | 'result' | 'tooEarly';

const COLORS = [
  '#ff4444', '#44ff44', '#4444ff', '#ffff44', 
  '#ff44ff', '#44ffff', '#ff8844', '#8844ff'
];

const MIN_WAIT_TIME = 2000; // 최소 대기 시간 (2초)
const MAX_WAIT_TIME = 7000; // 최대 대기 시간 (7초)

const ReactionTestCanvas: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [backgroundColor, setBackgroundColor] = useState('#333333');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const [message, setMessage] = useState('클릭해서 시작하세요');
  
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);

  // 평균 반응속도 계산
  const averageTime = attempts.length > 0 
    ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)
    : null;

  // 랜덤 색상 선택
  const getRandomColor = useCallback(() => {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }, []);

  // 게임 시작
  const startRound = useCallback(() => {
    setGameState('waiting');
    setBackgroundColor('#cc4444'); // 빨간색 대기 화면
    setMessage('초록색으로 바뀌면 즉시 클릭하세요!');
    setReactionTime(null);
    
    // 랜덤 시간 후 색상 변경
    const waitTime = MIN_WAIT_TIME + Math.random() * (MAX_WAIT_TIME - MIN_WAIT_TIME);
    
    timeoutRef.current = setTimeout(() => {
      setGameState('action');
      setBackgroundColor('#44cc44'); // 초록색으로 변경
      setMessage('지금! 클릭하세요!');
      startTimeRef.current = performance.now();
    }, waitTime);
  }, []);

  // 클릭 처리
  const handleClick = useCallback(() => {
    const currentTime = performance.now();
    
    switch (gameState) {
      case 'ready':
        setRound(1);
        startRound();
        break;
        
      case 'waiting':
        // 너무 일찍 클릭함
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setGameState('tooEarly');
        setBackgroundColor('#ff8844');
        setMessage('너무 일찍 클릭했습니다! 다시 시도하세요.');
        break;
        
      case 'action':
        // 정확한 타이밍에 클릭
        const reaction = Math.round(currentTime - startTimeRef.current);
        setReactionTime(reaction);
        setGameState('result');
        setBackgroundColor(getRandomColor());
        
        // 기록 업데이트
        const newAttempts = [...attempts, reaction];
        setAttempts(newAttempts);
        
        // 최고 기록 업데이트
        if (!bestTime || reaction < bestTime) {
          setBestTime(reaction);
          setMessage(`새 기록! ${reaction}ms (라운드 ${round})`);
        } else {
          setMessage(`${reaction}ms (라운드 ${round})`);
        }
        break;
        
      case 'tooEarly':
        // 다시 시작
        startRound();
        break;
        
      case 'result':
        // 다음 라운드
        setRound(prev => prev + 1);
        startRound();
        break;
    }
  }, [gameState, startRound, getRandomColor, attempts, bestTime, round]);

  // 리셋 기능
  const resetGame = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setGameState('ready');
    setBackgroundColor('#333333');
    setReactionTime(null);
    setBestTime(null);
    setAttempts([]);
    setRound(1);
    setMessage('클릭해서 시작하세요');
  }, []);

  // 키보드 스페이스바 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClick]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 반응속도 평가
  const getReactionRating = (time: number): { text: string; color: string } => {
    if (time < 200) return { text: '번개 같은 반응!', color: '#4CAF50' };
    if (time < 250) return { text: '매우 빠름', color: '#8BC34A' };
    if (time < 300) return { text: '빠름', color: '#CDDC39' };
    if (time < 400) return { text: '보통', color: '#FFC107' };
    if (time < 500) return { text: '느림', color: '#FF9800' };
    return { text: '매우 느림', color: '#F44336' };
  };

  const gameStats = (
    <div style={{ textAlign: 'center', color: '#bcbcbe' }}>
      <div>라운드: {round}</div>
      {bestTime !== null && <div>최고 기록: {bestTime}ms</div>}
      {averageTime !== null && <div>평균: {averageTime}ms ({attempts.length}회)</div>}
    </div>
  );

  const actionButtons = attempts.length > 0 ? (
    <GameButton onClick={resetGame} variant="primary" size="large">
      처음부터 다시
    </GameButton>
  ) : undefined;

  const instructions =
    '화면이 초록색으로 바뀌면 즉시 클릭하세요.\n빨간색일 때 클릭하면 실격입니다.';

  return (
    <GameManager
      title="Reaction Test"
      gameIcon="⚡"
      gameStats={gameStats}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <div
        onClick={handleClick}
        style={{
          width: 400,
          height: 300,
          backgroundColor,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          color: '#ffffff',
          fontSize: 24,
          fontWeight: 700,
          textAlign: 'center',
          padding: 20
        }}
      >
        {message}
        {reactionTime && gameState === 'result' && (
          <div
            style={{
              marginTop: 16,
              fontSize: 20,
              fontWeight: 600,
              color: getReactionRating(reactionTime).color
            }}
          >
            {getReactionRating(reactionTime).text}
          </div>
        )}
      </div>
    </GameManager>
  );
};

export default ReactionTestCanvas;