import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';
import { spacing, typography } from './theme/gameTheme';

enum Player {
  NONE = 0,
  HUMAN = 1,
  AI = 2
}

enum GameState {
  PLAYING = 'playing',
  HUMAN_WIN = 'human_win',
  AI_WIN = 'ai_win',
  DRAW = 'draw'
}

interface GameStats {
  humanWins: number;
  aiWins: number;
  draws: number;
}

const ROWS = 6;
const COLS = 7;
const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 600;
const CELL_SIZE = 80;
const CHIP_RADIUS = 30;
const MARGIN_X = (CANVAS_WIDTH - COLS * CELL_SIZE) / 2;
const MARGIN_Y = (CANVAS_HEIGHT - ROWS * CELL_SIZE) / 2;

// 칩 색상
const CHIP_COLORS = {
  [Player.NONE]: '#F5F5F5',
  [Player.HUMAN]: '#FF4444',
  [Player.AI]: '#4444FF'
};

const ConnectFourCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  
  const [board, setBoard] = useState<Player[][]>(() => 
    Array(ROWS).fill(null).map(() => Array(COLS).fill(Player.NONE))
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.HUMAN);
  const [gameState, setGameState] = useState<GameState>(GameState.PLAYING);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [winningCells, setWinningCells] = useState<{row: number, col: number}[]>([]);
  const [droppingChip, setDroppingChip] = useState<{col: number, row: number, progress: number} | null>(null);
  const [stats, setStats] = useState<GameStats>(() => ({
    humanWins: parseInt(localStorage.getItem('connect4-human-wins') || '0'),
    aiWins: parseInt(localStorage.getItem('connect4-ai-wins') || '0'),
    draws: parseInt(localStorage.getItem('connect4-draws') || '0')
  }));

  // 유효한 열인지 확인 (맨 위가 비어있는지)
  const isValidMove = useCallback((board: Player[][], col: number): boolean => {
    return col >= 0 && col < COLS && board[0][col] === Player.NONE;
  }, []);

  // 칩을 놓을 수 있는 가장 아래 행 찾기
  const getDropRow = useCallback((board: Player[][], col: number): number => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === Player.NONE) {
        return row;
      }
    }
    return -1;
  }, []);

  // 4개 연속 체크 (4방향)
  const checkWin = useCallback((board: Player[][], row: number, col: number, player: Player): {row: number, col: number}[] | null => {
    const directions = [
      [0, 1],   // 수평
      [1, 0],   // 수직
      [1, 1],   // 대각선 \
      [1, -1]   // 대각선 /
    ];

    for (const [dRow, dCol] of directions) {
      const cells: {row: number, col: number}[] = [{row, col}];
      
      // 한 방향으로 확장
      for (let i = 1; i < 4; i++) {
        const newRow = row + dRow * i;
        const newCol = col + dCol * i;
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && 
            board[newRow][newCol] === player) {
          cells.push({row: newRow, col: newCol});
        } else {
          break;
        }
      }
      
      // 반대 방향으로 확장
      for (let i = 1; i < 4; i++) {
        const newRow = row - dRow * i;
        const newCol = col - dCol * i;
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && 
            board[newRow][newCol] === player) {
          cells.unshift({row: newRow, col: newCol});
        } else {
          break;
        }
      }
      
      if (cells.length >= 4) {
        return cells.slice(0, 4); // 처음 4개만 반환
      }
    }
    
    return null;
  }, []);

  // 보드가 가득 찼는지 확인
  const isBoardFull = useCallback((board: Player[][]): boolean => {
    return board[0].every(cell => cell !== Player.NONE);
  }, []);

  // AI 움직임 평가 (미니맥스 알고리즘 간소화 버전)
  const evaluateMove = useCallback((board: Player[][], col: number, player: Player, depth: number = 3): number => {
    if (!isValidMove(board, col)) return -1000;
    
    const newBoard = board.map(row => [...row]);
    const row = getDropRow(newBoard, col);
    newBoard[row][col] = player;
    
    // 승리 체크
    if (checkWin(newBoard, row, col, player)) {
      return player === Player.AI ? 1000 : -1000;
    }
    
    // 상대방의 승리를 막는지 체크
    const opponent = player === Player.AI ? Player.HUMAN : Player.AI;
    for (let c = 0; c < COLS; c++) {
      if (isValidMove(newBoard, c)) {
        const testRow = getDropRow(newBoard, c);
        newBoard[testRow][c] = opponent;
        if (checkWin(newBoard, testRow, c, opponent)) {
          newBoard[testRow][c] = Player.NONE;
          return player === Player.AI ? 500 : -500;
        }
        newBoard[testRow][c] = Player.NONE;
      }
    }
    
    // 중앙 열 선호
    const centerPreference = Math.abs(col - 3);
    let score = 5 - centerPreference;
    
    // 깊이가 있으면 재귀적으로 평가
    if (depth > 0) {
      let bestScore = player === Player.AI ? -2000 : 2000;
      for (let c = 0; c < COLS; c++) {
        if (isValidMove(newBoard, c)) {
          const moveScore = evaluateMove(newBoard, c, opponent, depth - 1);
          if (player === Player.AI) {
            bestScore = Math.max(bestScore, -moveScore);
          } else {
            bestScore = Math.min(bestScore, -moveScore);
          }
        }
      }
      score += bestScore * 0.1;
    }
    
    return score;
  }, [isValidMove, getDropRow, checkWin]);

  // AI 움직임 결정
  const getAIMove = useCallback((board: Player[][]): number => {
    let bestCol = 3; // 기본적으로 중앙
    let bestScore = -2000;
    
    // 모든 가능한 움직임 평가
    for (let col = 0; col < COLS; col++) {
      if (isValidMove(board, col)) {
        const score = evaluateMove(board, col, Player.AI);
        if (score > bestScore) {
          bestScore = score;
          bestCol = col;
        }
      }
    }
    
    return bestCol;
  }, [isValidMove, evaluateMove]);

  // 칩 드랍 애니메이션
  const animateChipDrop = useCallback((col: number, targetRow: number, player: Player) => {
    let progress = 0;
    const animate = () => {
      progress += 0.15;
      setDroppingChip({ col, row: targetRow, progress: Math.min(progress, 1) });
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDroppingChip(null);
        // 애니메이션 완료 후 실제 보드 업데이트
        setBoard(prevBoard => {
          const newBoard = prevBoard.map(row => [...row]);
          newBoard[targetRow][col] = player;
          
          // 승리 체크
          const winCells = checkWin(newBoard, targetRow, col, player);
          if (winCells) {
            setWinningCells(winCells);
            setGameState(player === Player.HUMAN ? GameState.HUMAN_WIN : GameState.AI_WIN);
            
            // 통계 업데이트
            setStats(prev => {
              const newStats = {
                ...prev,
                [player === Player.HUMAN ? 'humanWins' : 'aiWins']: prev[player === Player.HUMAN ? 'humanWins' : 'aiWins'] + 1
              };
              localStorage.setItem('connect4-human-wins', newStats.humanWins.toString());
              localStorage.setItem('connect4-ai-wins', newStats.aiWins.toString());
              return newStats;
            });
          } else if (isBoardFull(newBoard)) {
            setGameState(GameState.DRAW);
            setStats(prev => {
              const newStats = { ...prev, draws: prev.draws + 1 };
              localStorage.setItem('connect4-draws', newStats.draws.toString());
              return newStats;
            });
          } else {
            setCurrentPlayer(player === Player.HUMAN ? Player.AI : Player.HUMAN);
          }
          
          return newBoard;
        });
      }
    };
    animate();
  }, [checkWin, isBoardFull]);

  // 움직임 실행
  const makeMove = useCallback((col: number) => {
    if (gameState !== GameState.PLAYING || !isValidMove(board, col) || droppingChip) return;
    
    const targetRow = getDropRow(board, col);
    animateChipDrop(col, targetRow, currentPlayer);
  }, [gameState, isValidMove, board, getDropRow, currentPlayer, animateChipDrop, droppingChip]);

  // AI 턴 처리
  useEffect(() => {
    if (currentPlayer === Player.AI && gameState === GameState.PLAYING && !droppingChip) {
      const timer = setTimeout(() => {
        const aiCol = getAIMove(board);
        makeMove(aiCol);
      }, 500); // AI 사고 시간
      
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameState, board, getAIMove, makeMove, droppingChip]);

  // 게임 재시작
  const restartGame = useCallback(() => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(Player.NONE)));
    setCurrentPlayer(Player.HUMAN);
    setGameState(GameState.PLAYING);
    setWinningCells([]);
    setDroppingChip(null);
    setHoveredCol(null);
  }, []);

  // 캔버스 클릭 처리
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== GameState.PLAYING || currentPlayer !== Player.HUMAN || droppingChip) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const col = Math.floor((x - MARGIN_X) / CELL_SIZE);

    if (col >= 0 && col < COLS) {
      makeMove(col);
    }
  }, [gameState, currentPlayer, makeMove, droppingChip]);

  // 마우스 이동 처리 (호버 효과)
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== GameState.PLAYING || currentPlayer !== Player.HUMAN || droppingChip) {
      setHoveredCol(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const col = Math.floor((x - MARGIN_X) / CELL_SIZE);

    if (col >= 0 && col < COLS && isValidMove(board, col)) {
      setHoveredCol(col);
    } else {
      setHoveredCol(null);
    }
  }, [gameState, currentPlayer, board, isValidMove, droppingChip]);

  // 캔버스 렌더링
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경
    ctx.fillStyle = '#0066CC';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 그리드 그리기
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = MARGIN_X + col * CELL_SIZE;
        const y = MARGIN_Y + row * CELL_SIZE;
        const centerX = x + CELL_SIZE / 2;
        const centerY = y + CELL_SIZE / 2;

        // 셀 배경 (보드 구멍)
        ctx.fillStyle = '#004499';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        
        // 구멍 (원)
        ctx.fillStyle = CHIP_COLORS[board[row][col]];
        ctx.beginPath();
        ctx.arc(centerX, centerY, CHIP_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // 승리 하이라이트
        if (winningCells.some(cell => cell.row === row && cell.col === col)) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        // 칩에 그라데이션 효과
        if (board[row][col] !== Player.NONE) {
          const gradient = ctx.createRadialGradient(
            centerX - 10, centerY - 10, 0,
            centerX, centerY, CHIP_RADIUS
          );
          gradient.addColorStop(0, board[row][col] === Player.HUMAN ? '#FF6666' : '#6666FF');
          gradient.addColorStop(1, CHIP_COLORS[board[row][col]]);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, CHIP_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }

        // 테두리
        ctx.strokeStyle = '#003366';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    // 호버된 열 하이라이트
    if (hoveredCol !== null && gameState === GameState.PLAYING) {
      const x = MARGIN_X + hoveredCol * CELL_SIZE;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x, MARGIN_Y, CELL_SIZE, ROWS * CELL_SIZE);
    }

    // 드랍 애니메이션
    if (droppingChip) {
      const { col, row, progress } = droppingChip;
      const x = MARGIN_X + col * CELL_SIZE + CELL_SIZE / 2;
      const startY = MARGIN_Y - CHIP_RADIUS;
      const endY = MARGIN_Y + row * CELL_SIZE + CELL_SIZE / 2;
      const currentY = startY + (endY - startY) * progress;

      ctx.fillStyle = CHIP_COLORS[currentPlayer];
      ctx.beginPath();
      ctx.arc(x, currentY, CHIP_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // 그라데이션 효과
      const gradient = ctx.createRadialGradient(
        x - 10, currentY - 10, 0,
        x, currentY, CHIP_RADIUS
      );
      gradient.addColorStop(0, currentPlayer === Player.HUMAN ? '#FF6666' : '#6666FF');
      gradient.addColorStop(1, CHIP_COLORS[currentPlayer]);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, currentY, CHIP_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    // 게임 상태 메시지
    if (gameState !== GameState.PLAYING) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let message = '';
      switch (gameState) {
        case GameState.HUMAN_WIN:
          message = '당신이 승리했습니다! 🎉';
          break;
        case GameState.AI_WIN:
          message = 'AI가 승리했습니다! 🤖';
          break;
        case GameState.DRAW:
          message = '무승부입니다! 🤝';
          break;
      }
      
      ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      
      ctx.font = '20px Arial';
      ctx.fillText('클릭하여 다시 시작', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }
  }, [board, winningCells, hoveredCol, gameState, droppingChip, currentPlayer]);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (gameState !== GameState.PLAYING || currentPlayer !== Player.HUMAN) return;

    const col = parseInt(event.key) - 1;
    if (col >= 0 && col < COLS) {
      event.preventDefault();
      event.stopPropagation();
      makeMove(col);
    }
  }, [gameState, currentPlayer, makeMove]);

  // 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);

  // 캔버스 렌더링
  useEffect(() => {
    draw();
  }, [draw]);

  // 컴포넌트 포커스
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const getGameStatusText = () => {
    if (gameState === GameState.HUMAN_WIN) return '🔴 당신이 승리했습니다!';
    if (gameState === GameState.AI_WIN) return '🔵 AI가 승리했습니다!';
    if (gameState === GameState.DRAW) return '🤝 무승부입니다!';
    if (currentPlayer === Player.HUMAN) return '🔴 당신의 턴입니다';
    return '🔵 AI가 생각 중입니다...';
  };

  // 상단 정보 (게임 목표/상태)
  const topInfo = (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        ...typography.gameStatus,
        fontSize: 18,
        marginBottom: spacing.sm
      }}>
        {getGameStatusText()}
      </div>
      <div style={{ 
        display: 'flex', 
        gap: spacing.md, 
        justifyContent: 'center',
        fontSize: 14 
      }}>
        <span><strong>🔴 승:</strong> {stats.humanWins}</span>
        <span><strong>🔵 승:</strong> {stats.aiWins}</span>
        <span><strong>무승부:</strong> {stats.draws}</span>
      </div>
    </div>
  );

  // 하단 정보 (조작법)
  const bottomInfo = (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>조작법:</strong> 열을 클릭하거나 숫자키 1-7을 눌러 칩을 떨어뜨리세요
      </div>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>목표:</strong> 가로·세로·대각선으로 4개를 연속으로 연결하세요!
      </div>
      {gameState !== GameState.PLAYING && (
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
        title="🔴 Connect Four"
        topInfo={topInfo}
        bottomInfo={bottomInfo}
      >
        <GameCanvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={gameState !== GameState.PLAYING ? restartGame : handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          gameTitle="Connect Four"
          style={{
            cursor: 'pointer',
            border: "2px solid rgba(255,255,255,0.1)"
          }}
        />
      </GameLayout>
    </div>
  );
};

export default ConnectFourCanvas;