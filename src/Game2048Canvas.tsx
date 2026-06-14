import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { spacing, typography } from './theme/gameTheme';

type GameState = 'playing' | 'gameOver' | 'won';
type Direction = 'up' | 'down' | 'left' | 'right';

interface GameStats {
  score: number;
  bestScore: number;
  moves: number;
}

const GRID_SIZE = 4;
const CANVAS_SIZE = 500;
const TILE_SIZE = (CANVAS_SIZE - 50) / GRID_SIZE; // 50px for gaps
const TILE_GAP = 10;

// 타일 색상 매핑
const TILE_COLORS: { [key: number]: { bg: string; text: string } } = {
  0: { bg: '#CDC1B4', text: '#776E65' },
  2: { bg: '#EEE4DA', text: '#776E65' },
  4: { bg: '#EDE0C8', text: '#776E65' },
  8: { bg: '#F2B179', text: '#F9F6F2' },
  16: { bg: '#F59563', text: '#F9F6F2' },
  32: { bg: '#F67C5F', text: '#F9F6F2' },
  64: { bg: '#F65E3B', text: '#F9F6F2' },
  128: { bg: '#EDCF72', text: '#F9F6F2' },
  256: { bg: '#EDCC61', text: '#F9F6F2' },
  512: { bg: '#EDC850', text: '#F9F6F2' },
  1024: { bg: '#EDC53F', text: '#F9F6F2' },
  2048: { bg: '#EDC22E', text: '#F9F6F2' },
  4096: { bg: '#3C3A32', text: '#F9F6F2' },
  8192: { bg: '#3C3A32', text: '#F9F6F2' }
};

const Game2048Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<number[][]>(() => 
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
  );
  const [gameState, setGameState] = useState<GameState>('playing');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    bestScore: parseInt(localStorage.getItem('2048-best') || '0'),
    moves: 0
  });
  const [animationTiles, setAnimationTiles] = useState<Array<{
    value: number;
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    progress: number;
  }>>([]);

  // 빈 셀 찾기
  const getEmptyCells = useCallback((grid: number[][]) => {
    const emptyCells: { row: number; col: number }[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }
    return emptyCells;
  }, []);

  // 랜덤 타일 생성
  const addRandomTile = useCallback((grid: number[][]) => {
    const emptyCells = getEmptyCells(grid);
    if (emptyCells.length === 0) return grid;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = grid.map(row => [...row]);
    newGrid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  }, [getEmptyCells]);

  // 라인 압축 (0 제거)
  const compressLine = useCallback((line: number[]) => {
    return line.filter(cell => cell !== 0);
  }, []);

  // 라인 병합
  const mergeLine = useCallback((line: number[]) => {
    const compressed = compressLine(line);
    const merged: number[] = [];
    let scoreIncrease = 0;
    
    for (let i = 0; i < compressed.length; i++) {
      if (i < compressed.length - 1 && compressed[i] === compressed[i + 1]) {
        const mergedValue = compressed[i] * 2;
        merged.push(mergedValue);
        scoreIncrease += mergedValue;
        i++; // 다음 타일 건너뛰기
      } else {
        merged.push(compressed[i]);
      }
    }
    
    // 빈 공간 채우기
    while (merged.length < GRID_SIZE) {
      merged.push(0);
    }
    
    return { line: merged, scoreIncrease };
  }, [compressLine]);

  // 그리드 회전 (방향 변환을 위해)
  const rotateGrid = useCallback((grid: number[][], clockwise: boolean = true) => {
    const size = grid.length;
    const rotated = Array(size).fill(null).map(() => Array(size).fill(0));
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (clockwise) {
          rotated[col][size - 1 - row] = grid[row][col];
        } else {
          rotated[size - 1 - col][row] = grid[row][col];
        }
      }
    }
    return rotated;
  }, []);

  // 이동 처리
  const move = useCallback((direction: Direction) => {
    if (gameState !== 'playing') return;

    let workingGrid = grid.map(row => [...row]);
    let totalScoreIncrease = 0;
    let moved = false;

    // 방향에 따라 그리드 회전
    switch (direction) {
      case 'up':
        workingGrid = rotateGrid(workingGrid, false);
        break;
      case 'down':
        workingGrid = rotateGrid(workingGrid, true);
        break;
      case 'right':
        workingGrid = workingGrid.map(row => [...row].reverse());
        break;
      // left는 기본 상태
    }

    // 각 행에 대해 병합 수행
    const processedGrid = workingGrid.map(row => {
      const originalLine = [...row];
      const { line: mergedLine, scoreIncrease } = mergeLine(row);
      totalScoreIncrease += scoreIncrease;
      
      // 움직임이 있었는지 확인
      if (JSON.stringify(originalLine) !== JSON.stringify(mergedLine)) {
        moved = true;
      }
      
      return mergedLine;
    });

    // 그리드를 원래 방향으로 복원
    let finalGrid = processedGrid;
    switch (direction) {
      case 'up':
        finalGrid = rotateGrid(processedGrid, true);
        break;
      case 'down':
        finalGrid = rotateGrid(processedGrid, false);
        break;
      case 'right':
        finalGrid = processedGrid.map(row => [...row].reverse());
        break;
    }

    if (moved) {
      // 랜덤 타일 추가
      const gridWithNewTile = addRandomTile(finalGrid);
      setGrid(gridWithNewTile);
      setStats(prev => ({
        ...prev,
        score: prev.score + totalScoreIncrease,
        moves: prev.moves + 1,
        bestScore: Math.max(prev.bestScore, prev.score + totalScoreIncrease)
      }));

      // 2048 달성 체크
      const has2048 = gridWithNewTile.some(row => row.some(cell => cell === 2048));
      if (has2048 && gameState === 'playing') {
        setGameState('won');
      }

      // 게임 오버 체크
      setTimeout(() => checkGameOver(gridWithNewTile), 100);
    }
  }, [grid, gameState, addRandomTile, mergeLine, rotateGrid]);

  // 게임 오버 체크
  const checkGameOver = useCallback((currentGrid: number[][]) => {
    // 빈 셀이 있으면 게임 계속
    if (getEmptyCells(currentGrid).length > 0) return;

    // 병합 가능한 셀이 있는지 체크
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const currentValue = currentGrid[row][col];
        
        // 오른쪽 셀과 비교
        if (col < GRID_SIZE - 1 && currentValue === currentGrid[row][col + 1]) {
          return;
        }
        
        // 아래쪽 셀과 비교
        if (row < GRID_SIZE - 1 && currentValue === currentGrid[row + 1][col]) {
          return;
        }
      }
    }

    // 더 이상 움직일 수 없으면 게임 오버
    setGameState('gameOver');
  }, [getEmptyCells]);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        event.preventDefault();
        event.stopPropagation();
        move('up');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        event.stopPropagation();
        move('down');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault();
        event.stopPropagation();
        move('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        event.preventDefault();
        event.stopPropagation();
        move('right');
        break;
      case 'r':
      case 'R':
        if (gameState !== 'playing') {
          event.preventDefault();
          event.stopPropagation();
          restartGame();
        }
        break;
    }
  }, [move, gameState]);

  // 게임 재시작
  const restartGame = useCallback(() => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    const gridWithTiles = addRandomTile(addRandomTile(newGrid));
    
    setGrid(gridWithTiles);
    setGameState('playing');
    setStats(prev => ({
      score: 0,
      bestScore: prev.bestScore,
      moves: 0
    }));
    setAnimationTiles([]);
  }, [addRandomTile]);

  // 캔버스 렌더링
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경
    ctx.fillStyle = '#FAF8EF';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 그리드 배경
    ctx.fillStyle = '#BBADA0';
    ctx.fillRect(10, 10, CANVAS_SIZE - 20, CANVAS_SIZE - 20);

    // 타일 그리기
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = 15 + col * (TILE_SIZE + TILE_GAP);
        const y = 15 + row * (TILE_SIZE + TILE_GAP);
        const value = grid[row][col];
        
        // 타일 배경
        const colors = TILE_COLORS[value] || TILE_COLORS[0];
        ctx.fillStyle = colors.bg;
        ctx.fillRect(x, y, TILE_SIZE - 5, TILE_SIZE - 5);
        
        // 타일 값
        if (value > 0) {
          ctx.fillStyle = colors.text;
          ctx.font = value >= 1000 ? 'bold 32px Arial' : 'bold 40px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            value.toString(),
            x + (TILE_SIZE - 5) / 2,
            y + (TILE_SIZE - 5) / 2
          );
        }
      }
    }

    // 게임 오버/승리 오버레이
    if (gameState !== 'playing') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      ctx.fillStyle = gameState === 'won' ? '#EDC22E' : '#776E65';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const message = gameState === 'won' ? 'You Win!' : 'Game Over!';
      ctx.fillText(message, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 30);
      
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#776E65';
      ctx.fillText('Press R to restart', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 30);
    }
  }, [grid, gameState]);

  // 게임 초기화
  useEffect(() => {
    if (grid.flat().every(cell => cell === 0)) {
      const initialGrid = addRandomTile(addRandomTile(grid));
      setGrid(initialGrid);
    }
  }, [grid, addRandomTile]);

  // 컴포넌트 마운트 시 포커스 설정
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // 이벤트 리스너 등록
  useEffect(() => {
    // 더 높은 우선순위로 캡처 단계에서 이벤트 처리
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);

  // 캔버스 렌더링
  useEffect(() => {
    draw();
  }, [draw]);

  // 최고 점수 저장
  useEffect(() => {
    localStorage.setItem('2048-best', stats.bestScore.toString());
  }, [stats.bestScore]);

  const handleBackToMenu = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  };

  const getGameStatus = () => {
    if (gameState === 'won') return '승리! 🎉';
    if (gameState === 'gameOver') return '게임 오버 💀';
    return '플레이 중';
  };

  // 상단 정보 (게임 목표/상태)
  const topInfo = (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        ...typography.gameStatus,
        fontSize: 18,
        marginBottom: spacing.sm
      }}>
        {getGameStatus()}
      </div>
      <div style={{ 
        display: 'flex', 
        gap: spacing.lg, 
        justifyContent: 'center',
        fontSize: 14 
      }}>
        <span><strong>점수:</strong> {stats.score}</span>
        <span><strong>최고:</strong> {stats.bestScore}</span>
        <span><strong>움직임:</strong> {stats.moves}</span>
      </div>
    </div>
  );

  // 하단 정보 (조작법)
  const bottomInfo = (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>조작법:</strong> WASD 또는 방향키로 타일을 움직이세요
      </div>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>목표:</strong> 같은 숫자 타일을 합쳐서 2048을 만드세요!
      </div>
      {(gameState === 'won' || gameState === 'gameOver') && (
        <div style={{ marginTop: spacing.sm }}>
          <GameButton 
            onClick={restartGame}
            variant="primary"
            size="large"
          >
            새 게임 시작
          </GameButton>
        </div>
      )}
    </div>
  );

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <GameLayout
      gameStatus={gameState === 'won' ? '승리!' : gameState === 'gameOver' ? '게임 오버' : undefined} 
        title="🔢 2048"
        topInfo={topInfo}
        bottomInfo={bottomInfo}
      >
        <GameCanvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          gameTitle="2048"
        />
      </GameLayout>
    </div>
  );
};

export default Game2048Canvas;