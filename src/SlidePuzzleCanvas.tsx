import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { spacing, typography } from './theme/gameTheme';

type GameState = 'playing' | 'won';

interface GameStats {
  moves: number;
  bestMoves: number;
  time: number;
  bestTime: number;
}

const GRID_SIZE = 4;
const CANVAS_SIZE = 480;
const TILE_GAP = 10;
const TILE_SIZE = (CANVAS_SIZE - (GRID_SIZE + 1) * TILE_GAP) / GRID_SIZE;
const BOARD_SIZE = GRID_SIZE * TILE_SIZE + (GRID_SIZE - 1) * TILE_GAP;
const START = (CANVAS_SIZE - BOARD_SIZE) / 2;

// 타일 색상
const TILE_COLORS = {
  normal: { bg: '#4A90E2', text: '#FFFFFF', border: '#357ABD' },
  empty: { bg: '#F5F5F5', text: '#999999', border: '#DDDDDD' },
  hover: { bg: '#5BA0F2', text: '#FFFFFF', border: '#4A90E2' }
};

const SlidePuzzleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameStartTimeRef = useRef<number>(0);
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);
  
  // 완성된 상태 (1~15, 16은 빈 칸)
  const solvedPuzzle = Array.from({ length: 16 }, (_, i) => i + 1);
  
  const [puzzle, setPuzzle] = useState<number[]>(solvedPuzzle.slice());
  const [gameState, setGameState] = useState<GameState>('playing');
  const [stats, setStats] = useState<GameStats>({
    moves: 0,
    bestMoves: parseInt(localStorage.getItem('slide-puzzle-best-moves') || '999'),
    time: 0,
    bestTime: parseInt(localStorage.getItem('slide-puzzle-best-time') || '999')
  });

  // 인버전 카운트 계산 (퍼즐 가용성 체크)
  const countInversions = useCallback((arr: number[]): number => {
    let inversions = 0;
    const filtered = arr.filter(num => num !== 16); // 빈 칸 제외
    
    for (let i = 0; i < filtered.length - 1; i++) {
      for (let j = i + 1; j < filtered.length; j++) {
        if (filtered[i] > filtered[j]) {
          inversions++;
        }
      }
    }
    return inversions;
  }, []);

  // 퍼즐 가용성 체크
  const isSolvable = useCallback((arr: number[]): boolean => {
    const inversions = countInversions(arr);
    const emptyRow = Math.floor(arr.indexOf(16) / GRID_SIZE) + 1; // 1부터 시작
    
    // 4x4 퍼즐에서 가용성 규칙:
    // - 빈 칸이 홀수 행에 있으면 인버전 수가 짝수여야 함
    // - 빈 칸이 짝수 행에 있으면 인버전 수가 홀수여야 함
    if (emptyRow % 2 === 1) {
      return inversions % 2 === 0;
    } else {
      return inversions % 2 === 1;
    }
  }, [countInversions]);

  // 퍼즐 셔플 (가용 가능한 상태로만)
  const shufflePuzzle = useCallback(() => {
    let newPuzzle: number[];
    let attempts = 0;
    
    do {
      newPuzzle = [...solvedPuzzle];
      // Fisher-Yates 셔플
      for (let i = newPuzzle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newPuzzle[i], newPuzzle[j]] = [newPuzzle[j], newPuzzle[i]];
      }
      attempts++;
      
      // 무한 루프 방지
      if (attempts > 1000) {
        // 안전한 셔플: 해결된 상태에서 유효한 움직임만 사용
        newPuzzle = [...solvedPuzzle];
        for (let i = 0; i < 1000; i++) {
          const emptyIndex = newPuzzle.indexOf(16);
          const neighbors = getValidMoves(newPuzzle, emptyIndex);
          if (neighbors.length > 0) {
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            [newPuzzle[emptyIndex], newPuzzle[randomNeighbor]] = 
            [newPuzzle[randomNeighbor], newPuzzle[emptyIndex]];
          }
        }
        break;
      }
    } while (!isSolvable(newPuzzle) || JSON.stringify(newPuzzle) === JSON.stringify(solvedPuzzle));
    
    return newPuzzle;
  }, [solvedPuzzle, isSolvable]);

  // 유효한 움직임 가능한 타일들 반환
  const getValidMoves = useCallback((currentPuzzle: number[], emptyIndex: number): number[] => {
    const row = Math.floor(emptyIndex / GRID_SIZE);
    const col = emptyIndex % GRID_SIZE;
    const validMoves: number[] = [];

    // 상하좌우 인접 타일 체크
    const directions = [
      { dr: -1, dc: 0 }, // 위
      { dr: 1, dc: 0 },  // 아래
      { dr: 0, dc: -1 }, // 왼쪽
      { dr: 0, dc: 1 }   // 오른쪽
    ];

    directions.forEach(({ dr, dc }) => {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
        validMoves.push(newRow * GRID_SIZE + newCol);
      }
    });

    return validMoves;
  }, []);

  // 타일 클릭/이동 처리
  const handleTileClick = useCallback((index: number) => {
    if (gameState !== 'playing') return;

    const emptyIndex = puzzle.indexOf(16);
    const validMoves = getValidMoves(puzzle, emptyIndex);
    
    if (validMoves.includes(index)) {
      const newPuzzle = [...puzzle];
      [newPuzzle[emptyIndex], newPuzzle[index]] = [newPuzzle[index], newPuzzle[emptyIndex]];
      
      setPuzzle(newPuzzle);
      setStats(prev => ({ ...prev, moves: prev.moves + 1 }));

      // 승리 체크
      if (JSON.stringify(newPuzzle) === JSON.stringify(solvedPuzzle)) {
        const gameTime = Math.round((performance.now() - gameStartTimeRef.current) / 1000);
        setStats(prev => ({
          ...prev,
          time: gameTime,
          bestMoves: Math.min(prev.bestMoves, prev.moves + 1),
          bestTime: Math.min(prev.bestTime, gameTime)
        }));
        setGameState('won');
      }
    }
  }, [puzzle, gameState, getValidMoves, solvedPuzzle]);

  // 캔버스에서 클릭된 타일 인덱스 계산
  const getTileFromPosition = useCallback((x: number, y: number): number | null => {
    const startX = START;
    const startY = START;
    
    const col = Math.floor((x - startX) / (TILE_SIZE + TILE_GAP));
    const row = Math.floor((y - startY) / (TILE_SIZE + TILE_GAP));
    
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      const tileX = startX + col * (TILE_SIZE + TILE_GAP);
      const tileY = startY + row * (TILE_SIZE + TILE_GAP);
      
      if (x >= tileX && x < tileX + TILE_SIZE && y >= tileY && y < tileY + TILE_SIZE) {
        return row * GRID_SIZE + col;
      }
    }
    
    return null;
  }, []);

  // 캔버스 클릭 처리
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const tileIndex = getTileFromPosition(x, y);
    if (tileIndex !== null) {
      handleTileClick(tileIndex);
    }
  }, [getTileFromPosition, handleTileClick]);

  // 마우스 이동 처리 (호버 효과)
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const tileIndex = getTileFromPosition(x, y);
    const emptyIndex = puzzle.indexOf(16);
    const validMoves = getValidMoves(puzzle, emptyIndex);

    if (tileIndex !== null && validMoves.includes(tileIndex) && puzzle[tileIndex] !== 16) {
      setHoveredTile(tileIndex);
      canvas.style.cursor = 'pointer';
    } else {
      setHoveredTile(null);
      canvas.style.cursor = 'default';
    }
  }, [getTileFromPosition, puzzle, getValidMoves]);

  // 게임 재시작
  const restartGame = useCallback(() => {
    const newPuzzle = shufflePuzzle();
    setPuzzle(newPuzzle);
    setGameState('playing');
    setStats(prev => ({
      moves: 0,
      bestMoves: prev.bestMoves,
      time: 0,
      bestTime: prev.bestTime
    }));
    setHoveredTile(null);
    gameStartTimeRef.current = performance.now();
  }, [shufflePuzzle]);

  // 시간 업데이트
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (gameState === 'playing' && stats.moves > 0) {
      intervalId = setInterval(() => {
        const currentTime = Math.round((performance.now() - gameStartTimeRef.current) / 1000);
        setStats(prev => ({ ...prev, time: currentTime }));
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [gameState, stats.moves]);

  // 캔버스 렌더링
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 그리드 배경
    ctx.fillStyle = '#E9ECEF';
    ctx.fillRect(START, START, BOARD_SIZE, BOARD_SIZE);

    // 타일 그리기
    for (let i = 0; i < 16; i++) {
      const row = Math.floor(i / GRID_SIZE);
      const col = i % GRID_SIZE;
      const x = START + col * (TILE_SIZE + TILE_GAP);
      const y = START + row * (TILE_SIZE + TILE_GAP);
      const value = puzzle[i];
      
      if (value === 16) continue; // 빈 칸은 그리지 않음
      
      // 타일 색상 결정
      const isHovered = hoveredTile === i;
      const emptyIndex = puzzle.indexOf(16);
      const validMoves = getValidMoves(puzzle, emptyIndex);
      const isMovable = validMoves.includes(i);
      
      let colors = TILE_COLORS.normal;
      if (isHovered && isMovable) {
        colors = TILE_COLORS.hover;
      }
      
      // 타일 배경
      ctx.fillStyle = colors.bg;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      
      // 타일 테두리
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      
      // 숫자 텍스트
      ctx.fillStyle = colors.text;
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        value.toString(),
        x + TILE_SIZE / 2,
        y + TILE_SIZE / 2
      );
    }

    // 게임 완료 오버레이
    if (gameState === 'won') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      ctx.fillStyle = '#28A745';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('축하합니다! 🎉', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 30);
      
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#495057';
      ctx.fillText(`${stats.moves}번의 움직임으로 완료!`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
      ctx.fillText(`완료 시간: ${stats.time}초`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 50);
    }
  }, [puzzle, gameState, stats, hoveredTile, getValidMoves]);

  // 초기 게임 설정
  useEffect(() => {
    restartGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 캔버스 렌더링
  useEffect(() => {
    draw();
  }, [draw]);

  // 최고 기록 저장
  useEffect(() => {
    localStorage.setItem('slide-puzzle-best-moves', stats.bestMoves.toString());
    localStorage.setItem('slide-puzzle-best-time', stats.bestTime.toString());
  }, [stats.bestMoves, stats.bestTime]);

  // 컴포넌트 포커스
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const getStatusText = () => {
    if (gameState === 'won') {
      return `축하합니다! 🎉`;
    }
    return `움직임: ${stats.moves} | 시간: ${stats.time}초`;
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
        display: 'flex', 
        gap: spacing.lg, 
        justifyContent: 'center',
        fontSize: 14,
        flexWrap: 'wrap'
      }}>
        <span><strong>현재 움직임:</strong> {stats.moves}</span>
        <span><strong>현재 시간:</strong> {stats.time}초</span>
        <span><strong>최고 움직임:</strong> {stats.bestMoves === 999 ? '-' : stats.bestMoves}</span>
        <span><strong>최고 시간:</strong> {stats.bestTime === 999 ? '-' : `${stats.bestTime}초`}</span>
      </div>
    </div>
  );

  // 하단 정보 (조작법)
  const bottomInfo = (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>게임 방법:</strong> 빈 칸 옆의 숫자 타일을 클릭하여 이동시키세요
      </div>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>목표:</strong> 타일들을 1부터 15까지 순서대로 정렬하면 승리합니다!
      </div>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>팁:</strong> 최소한의 움직임으로 퍼즐을 완성해보세요
      </div>
      <div style={{ marginTop: spacing.sm }}>
        <GameButton 
          onClick={restartGame}
          variant="primary"
          size="large"
          style={{ minWidth: 140 }}
        >
          새로운 퍼즐
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
        title="🧩 15퍼즐"
        topInfo={topInfo}
        bottomInfo={bottomInfo}
      >
        <GameCanvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          gameTitle="15 Puzzle"
          style={{ cursor: 'default' }}
        />
      </GameLayout>
    </div>
  );
};

export default SlidePuzzleCanvas;