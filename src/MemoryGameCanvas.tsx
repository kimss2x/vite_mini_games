import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameManager from './components/GameManager';
import GameButton from './components/GameButton';
import './MemoryGameCanvas.css';

type CardState = 'hidden' | 'flipped' | 'matched';
type GameState = 'ready' | 'playing' | 'won';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Card {
  id: number;
  symbol: string;
  state: CardState;
  pairId: number;
}

interface GameStats {
  moves: number;
  matches: number;
  time: number;
  bestTime: number;
}

const DIFFICULTIES = {
  easy: { rows: 3, cols: 4, name: '쉬움 (3×4)' },
  medium: { rows: 4, cols: 4, name: '보통 (4×4)' },
  hard: { rows: 4, cols: 6, name: '어려움 (4×6)' }
};

// 카드 심볼들 (이모지)
const CARD_SYMBOLS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
  '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
  '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
  '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎',
  '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡'
];

const CARD_WIDTH = 80;
const CARD_HEIGHT = 100;
const CARD_GAP = 10;
const FLIP_DELAY = 1000; // 1초 후 카드 뒤집기

const MemoryGameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const flipTimeoutRef = useRef<number | null>(null);

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameState, setGameState] = useState<GameState>('ready');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [stats, setStats] = useState<GameStats>({
    moves: 0,
    matches: 0,
    time: 0,
    bestTime: Infinity
  });

  const { rows, cols } = DIFFICULTIES[difficulty];
  const totalCards = rows * cols;
  const pairsCount = totalCards / 2;

  // 피셔-예이츠 셔플 알고리즘
  const fisherYatesShuffle = useCallback(<T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // 카드 덱 생성
  const createCardDeck = useCallback((): Card[] => {
    const symbols = CARD_SYMBOLS.slice(0, pairsCount);
    const cardPairs: { symbol: string; pairId: number }[] = [];
    
    // 각 심볼마다 2장의 카드 생성
    symbols.forEach((symbol, index) => {
      cardPairs.push({ symbol, pairId: index });
      cardPairs.push({ symbol, pairId: index });
    });

    // 피셔-예이츠 셔플로 카드 섞기
    const shuffledPairs = fisherYatesShuffle(cardPairs);

    // Card 객체 생성
    return shuffledPairs.map((pair, index) => ({
      id: index,
      symbol: pair.symbol,
      state: 'hidden' as CardState,
      pairId: pair.pairId
    }));
  }, [pairsCount, fisherYatesShuffle]);

  // 게임 시작
  const startGame = useCallback(() => {
    const newCards = createCardDeck();
    setCards(newCards);
    setFlippedCards([]);
    setStats(prev => ({
      moves: 0,
      matches: 0,
      time: 0,
      bestTime: prev.bestTime
    }));
    setGameState('playing');
    gameStartTimeRef.current = performance.now();
    
    if (flipTimeoutRef.current) {
      clearTimeout(flipTimeoutRef.current);
    }
  }, [createCardDeck]);

  // 카드 클릭 처리
  const handleCardClick = useCallback((cardId: number) => {
    if (gameState !== 'playing') return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.state !== 'hidden' || flippedCards.length >= 2) return;

    // 카드 뒤집기
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    setCards(prev => {
      const updatedCards = prev.map(c => 
        c.id === cardId ? { ...c, state: 'flipped' as CardState } : c
      );

      // 2장의 카드가 뒤집혔을 때
      if (newFlippedCards.length === 2) {
        const [firstCardId, secondCardId] = newFlippedCards;
        const firstCard = updatedCards.find(c => c.id === firstCardId);
        const secondCard = updatedCards.find(c => c.id === secondCardId);

        setStats(prev => ({ ...prev, moves: prev.moves + 1 }));

        // 같은 그림인지 확인
        if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
          // 매칭 성공
          const matchedCards = updatedCards.map(c => 
            (c.id === firstCardId || c.id === secondCardId) 
              ? { ...c, state: 'matched' as CardState } 
              : c
          );
          
          setFlippedCards([]);
          setStats(prev => ({ ...prev, matches: prev.matches + 1 }));

          // 모든 카드가 매칭되었는지 확인
          if (matchedCards.every(c => c.state === 'matched')) {
            setTimeout(() => {
              const gameTime = Math.round((performance.now() - gameStartTimeRef.current) / 1000);
              setStats(prev => ({
                ...prev,
                time: gameTime,
                bestTime: Math.min(prev.bestTime, gameTime)
              }));
              setGameState('won');
            }, 500); // 약간의 지연으로 매칭 효과를 보여줌
          }
          
          return matchedCards;
        } else {
          // 매칭 실패 - 1초 후 카드 뒤집기
          flipTimeoutRef.current = setTimeout(() => {
            setCards(prev => prev.map(c => 
              (c.id === firstCardId || c.id === secondCardId) 
                ? { ...c, state: 'hidden' as CardState } 
                : c
            ));
            setFlippedCards([]);
          }, FLIP_DELAY);
        }
      }
      
      return updatedCards;
    });
  }, [gameState, cards, flippedCards]);

  // 캔버스에서 클릭 위치를 카드 ID로 변환
  const getCardFromPosition = useCallback((x: number, y: number): number | null => {
    const startX = (800 - (cols * (CARD_WIDTH + CARD_GAP) - CARD_GAP)) / 2;
    const startY = 100;

    const col = Math.floor((x - startX) / (CARD_WIDTH + CARD_GAP));
    const row = Math.floor((y - startY) / (CARD_HEIGHT + CARD_GAP));

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      // 카드 영역 내부인지 확인
      const cardX = startX + col * (CARD_WIDTH + CARD_GAP);
      const cardY = startY + row * (CARD_HEIGHT + CARD_GAP);
      
      if (x >= cardX && x < cardX + CARD_WIDTH && 
          y >= cardY && y < cardY + CARD_HEIGHT) {
        return row * cols + col;
      }
    }
    
    return null;
  }, [rows, cols]);

  // 캔버스 클릭 처리
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const cardId = getCardFromPosition(x, y);
    if (cardId !== null) {
      handleCardClick(cardId);
    }
  }, [getCardFromPosition, handleCardClick]);

  // 시간 업데이트
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (gameState === 'playing') {
      intervalId = setInterval(() => {
        const currentTime = Math.round((performance.now() - gameStartTimeRef.current) / 1000);
        setStats(prev => ({ ...prev, time: currentTime }));
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [gameState]);

  // 캔버스 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 800, 600);

    // 카드 그리기
    const startX = (800 - (cols * (CARD_WIDTH + CARD_GAP) - CARD_GAP)) / 2;
    const startY = 100;

    cards.forEach((card, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = startX + col * (CARD_WIDTH + CARD_GAP);
      const y = startY + row * (CARD_HEIGHT + CARD_GAP);

      // 카드 배경
      let cardColor = '#16213e';
      if (card.state === 'flipped' || card.state === 'matched') {
        cardColor = card.state === 'matched' ? '#4CAF50' : '#2196F3';
      }

      // 카드 본체 - 둥근 모서리 (fallback for browsers without roundRect)
      ctx.fillStyle = cardColor;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, CARD_WIDTH, CARD_HEIGHT, 8);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);
      }

      // 카드 테두리
      ctx.strokeStyle = card.state === 'matched' ? '#66BB6A' : card.state === 'flipped' ? '#42A5F5' : '#333';
      ctx.lineWidth = card.state === 'matched' ? 3 : 2;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, CARD_WIDTH - 2, CARD_HEIGHT - 2, 6);
        ctx.stroke();
      } else {
        ctx.strokeRect(x + 1, y + 1, CARD_WIDTH - 2, CARD_HEIGHT - 2);
      }

      // 카드 내용
      if (card.state === 'flipped' || card.state === 'matched') {
        // 심볼 표시
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        
        // 매칭된 카드에 그림자 효과
        if (card.state === 'matched') {
          ctx.shadowColor = 'rgba(255,255,255,0.5)';
          ctx.shadowBlur = 4;
        }
        
        ctx.fillText(card.symbol, x + CARD_WIDTH / 2, y + CARD_HEIGHT / 2);
        
        // 그림자 초기화
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      } else {
        // 카드 뒷면 패턴 - 더 세련된 디자인
        ctx.fillStyle = '#0f3460';
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x + 8, y + 8, CARD_WIDTH - 16, CARD_HEIGHT - 16, 4);
          ctx.fill();
        } else {
          ctx.fillRect(x + 8, y + 8, CARD_WIDTH - 16, CARD_HEIGHT - 16);
        }
        
        // 물음표 패턴
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#16213e';
        ctx.fillText('?', x + CARD_WIDTH / 2, y + CARD_HEIGHT / 2);
        
        // 작은 장식 점들
        ctx.fillStyle = '#16213e';
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 2; j++) {
            const dotX = x + 15 + i * 25;
            const dotY = y + 20 + j * 60;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    });

    // UI 텍스트
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`움직임: ${stats.moves}`, 50, 30);
    ctx.fillText(`매칭: ${stats.matches}/${pairsCount}`, 200, 30);
    ctx.fillText(`시간: ${stats.time}s`, 400, 30);
    
    if (stats.bestTime !== Infinity) {
      ctx.fillText(`최고 기록: ${stats.bestTime}s`, 550, 30);
    }

    // 게임 상태별 메시지
    if (gameState === 'ready') {
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, 800, 600);
      
      // 제목
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🧠 Memory Card Matching', 400, 220);
      
      // 설명
      ctx.font = 'bold 22px Arial';
      ctx.fillStyle = '#4CAF50';
      ctx.fillText('같은 그림의 카드 2장을 찾아서 매칭하세요!', 400, 280);
      
      ctx.font = '18px Arial';
      ctx.fillStyle = '#ccc';
      ctx.fillText('카드를 클릭해서 뒤집고, 모든 쌍을 찾아보세요.', 400, 320);
      ctx.fillText('최소한의 움직임과 시간으로 도전해보세요!', 400, 350);
      
    } else if (gameState === 'won') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillRect(0, 0, 800, 600);
      
      // 축하 메시지
      ctx.fillStyle = '#4CAF50';
      ctx.font = 'bold 52px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(76, 175, 80, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText('축하합니다! 🎉', 400, 230);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      // 결과 정보
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 26px Arial';
      ctx.fillText(`${stats.moves}번의 움직임으로 완료!`, 400, 290);
      ctx.fillText(`완료 시간: ${stats.time}초`, 400, 330);
      
      // 최고 기록 표시
      if (stats.time === stats.bestTime) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.fillText('🏆 새로운 최고 기록! 🏆', 400, 370);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
    }

    ctx.textAlign = 'left';
  }, [cards, stats, gameState, rows, cols, pairsCount]);

  // 컴포넌트 정리
  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) {
        clearTimeout(flipTimeoutRef.current);
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const gameStats = (
    <div>
      이동: {stats.moves} | 매칭: {stats.matches}/{pairsCount} | 시간: {stats.time}s
      {stats.bestTime !== Infinity && <> | 최고: {stats.bestTime}s</>}
    </div>
  );

  const controls = (
    <div className="memory-game-difficulty-section">
      <label htmlFor="difficulty-select" className="memory-game-difficulty-label">
        난이도:
      </label>
      <select
        id="difficulty-select"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
        disabled={gameState === 'playing'}
        className="memory-game-difficulty-select"
        title="게임 난이도를 선택하세요"
        aria-label="난이도 선택"
      >
        {Object.entries(DIFFICULTIES).map(([key, value]) => (
          <option key={key} value={key}>{value.name}</option>
        ))}
      </select>
    </div>
  );

  const instructions = (
    <div className="memory-game-instructions">
      <p>🎯 목표: 모든 카드 쌍을 찾아서 매칭하세요!</p>
      <p>🔄 규칙: 카드 2장을 뒤집어서 같은 그림이면 매칭 성공, 다르면 다시 뒤집힙니다.</p>
      <p>⏱️ 최소한의 움직임과 시간으로 완료해보세요!</p>
    </div>
  );

  const actionButtons = (
    <GameButton
      onClick={startGame}
      variant="primary"
      size="large"
    >
      {gameState === 'ready' ? '게임 시작' : '새 게임'}
    </GameButton>
  );

  return (
    <GameManager
      title="Memory Card Matching"
      gameIcon="🧠"
      gameStats={gameStats}
      gameStatus={gameState === 'won' ? '클리어!' : undefined}
      controls={controls}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
        className="memory-game-canvas"
        aria-label="메모리 카드 게임 보드"
        role="application"
        tabIndex={0}
      />
    </GameManager>
  );
};

export default MemoryGameCanvas;
