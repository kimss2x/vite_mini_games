import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameManager from './components/GameManager';
import GameButton from './components/GameButton';

type GameState = 'ready' | 'demo' | 'input' | 'success' | 'gameover';
type Color = 'red' | 'blue' | 'green' | 'yellow';

const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];
const COLOR_MAP: Record<Color, { normal: string; active: string; sound: number }> = {
  red: { normal: '#cc4444', active: '#ff6666', sound: 440 },
  blue: { normal: '#4444cc', active: '#6666ff', sound: 554 },
  green: { normal: '#44cc44', active: '#66ff66', sound: 659 },
  yellow: { normal: '#cccc44', active: '#ffff66', sound: 784 }
};

const DEMO_DELAY = 600;
const FLASH_DURATION = 400;

const SimonSaysCanvas: React.FC = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [gameState, setGameState] = useState<GameState>('ready');
  const [pattern, setPattern] = useState<Color[]>([]);
  const [userInput, setUserInput] = useState<Color[]>([]);
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState('시작하려면 START를 누르세요');

  // 오디오 컨텍스트 초기화
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // 사운드 재생
  const playSound = useCallback((frequency: number, duration: number = FLASH_DURATION) => {
    initAudioContext();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, [initAudioContext]);

  // 색상 활성화 (시각적 + 사운드)
  const activateColor = useCallback((color: Color) => {
    setActiveColor(color);
    playSound(COLOR_MAP[color].sound);
    setTimeout(() => setActiveColor(null), FLASH_DURATION);
  }, [playSound]);

  // 새로운 패턴 추가
  const addToPattern = useCallback(() => {
    const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setPattern(prev => [...prev, newColor]);
  }, []);

  // 데모 시연
  const startDemo = useCallback(() => {
    setGameState('demo');
    setCurrentDemoIndex(0);
    setUserInput([]);
    setMessage(`레벨 ${level} - 패턴을 기억하세요!`);
  }, [level]);

  // 데모 진행
  useEffect(() => {
    if (gameState === 'demo' && currentDemoIndex < pattern.length) {
      const timer = setTimeout(() => {
        activateColor(pattern[currentDemoIndex]);
        setCurrentDemoIndex(prev => prev + 1);
      }, currentDemoIndex === 0 ? 500 : DEMO_DELAY);

      return () => clearTimeout(timer);
    } else if (gameState === 'demo' && currentDemoIndex >= pattern.length) {
      const timer = setTimeout(() => {
        setGameState('input');
        setMessage('패턴을 따라 클릭하세요!');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState, currentDemoIndex, pattern, activateColor]);

  // 사용자 입력 처리
  const handleColorClick = useCallback((color: Color) => {
    if (gameState !== 'input') return;

    activateColor(color);
    
    const newUserInput = [...userInput, color];
    setUserInput(newUserInput);

    // 즉시 검증 - 현재 입력이 패턴과 맞는지
    const currentIndex = newUserInput.length - 1;
    if (newUserInput[currentIndex] !== pattern[currentIndex]) {
      // 틀렸음
      setGameState('gameover');
      setMessage(`게임 오버! 최종 점수: ${score}`);
      return;
    }

    // 패턴을 모두 맞췄는지 확인
    if (newUserInput.length === pattern.length) {
      // 레벨 클리어
      setScore(prev => prev + level * 10);
      setLevel(prev => prev + 1);
      setGameState('success');
      setMessage('성공! 다음 레벨로...');
      
      setTimeout(() => {
        addToPattern();
        startDemo();
      }, 1500);
    }
  }, [gameState, userInput, pattern, activateColor, score, level, addToPattern, startDemo]);

  // 게임 시작
  const startGame = useCallback(() => {
    setGameState('ready');
    setPattern([]);
    setUserInput([]);
    setScore(0);
    setLevel(1);
    setCurrentDemoIndex(0);
    
    // 첫 번째 패턴 생성하고 데모 시작
    const firstColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setPattern([firstColor]);
    
    setTimeout(() => {
      startDemo();
    }, 500);
  }, [startDemo]);

  // 키보드 입력 (1,2,3,4 = 빨강, 파랑, 초록, 노랑)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'input') return;
      
      const keyColorMap: Record<string, Color> = {
        '1': 'red',
        '2': 'blue', 
        '3': 'green',
        '4': 'yellow'
      };
      
      const color = keyColorMap[e.key];
      if (color) {
        handleColorClick(color);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleColorClick]);

  const gameStats = (
    <div>
      레벨: {level} | 점수: {score}
      {gameState === 'input' && (
        <div style={{ fontSize: '14px', color: '#aaa' }}>
          진행: {userInput.length}/{pattern.length}
        </div>
      )}
    </div>
  );

  const instructions =
    '키보드: 1=빨강, 2=파랑, 3=초록, 4=노랑\n패턴을 기억했다가 같은 순서로 클릭하세요!';

  const actionButtons =
    gameState === 'ready' || gameState === 'gameover' ? (
      <GameButton onClick={startGame} variant="primary" size="large">
        {gameState === 'ready' ? 'START' : 'RESTART'}
      </GameButton>
    ) : undefined;

  return (
    <GameManager
      title="Simon Says"
      gameIcon="🧩"
      gameStats={gameStats}
      gameStatus={message}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          width: '300px',
          height: '300px',
          margin: '0 auto',
          padding: '20px',
          background: '#333',
          borderRadius: '15px'
        }}
      >
        {COLORS.map((color, index) => (
          <button
            key={color}
            onClick={() => handleColorClick(color)}
            disabled={gameState !== 'input'}
            style={{
              border: 'none',
              borderRadius: '10px',
              cursor: gameState === 'input' ? 'pointer' : 'default',
              backgroundColor: activeColor === color
                ? COLOR_MAP[color].active
                : COLOR_MAP[color].normal,
              transition: 'background-color 0.1s',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
            }}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </GameManager>
  );
};

export default SimonSaysCanvas;
