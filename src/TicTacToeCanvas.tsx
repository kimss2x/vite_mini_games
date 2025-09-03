import React, { useEffect, useRef, useState } from "react";
import GameLayout from "./components/GameLayout";
import GameCanvas from "./components/GameCanvas";
import GameButton from "./components/GameButton";
import { spacing, typography } from "./theme/gameTheme";

/**
 * 틱택토(Tic-Tac-Toe) 게임
 * X와 O를 번갈아 두며, 가로·세로·대각선으로 3개를 먼저 연결하면 승리
 */

type Player = 'X' | 'O' | null;
type Board = Player[];

const BOARD_SIZE = 3;
const CELL_SIZE = 120;
const MARGIN = 20;
const CANVAS_WIDTH = MARGIN * 2 + CELL_SIZE * BOARD_SIZE;
const CANVAS_HEIGHT = MARGIN * 2 + CELL_SIZE * BOARD_SIZE;

export default function TicTacToeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<'X' | 'O' | 'Draw' | null>(null);
  const [gameOver, setGameOver] = useState(false);

  // 승리 조건 체크
  const checkWinner = (board: Board): 'X' | 'O' | 'Draw' | null => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // 가로
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // 세로
      [0, 4, 8], [2, 4, 6]             // 대각선
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] as 'X' | 'O';
      }
    }

    // 무승부 체크 (모든 칸이 찬 경우)
    if (board.every(cell => cell !== null)) {
      return 'Draw';
    }

    return null;
  };

  // 게임 리셋
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setGameOver(false);
  };

  // 키보드 입력 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        e.stopPropagation();
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 클릭 처리
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // CSS 크기 기준으로 좌표 계산 (DPR 보정)
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // 클릭한 셀 계산
    const col = Math.floor((x - MARGIN) / CELL_SIZE);
    const row = Math.floor((y - MARGIN) / CELL_SIZE);
    const index = row * BOARD_SIZE + col;

    // 유효한 클릭인지 확인
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
    if (board[index] !== null) return;

    // 새로운 보드 상태
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    // 승리 체크
    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result);
      setGameOver(true);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  // 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // DPR 대응
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 배경
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0,
      CANVAS_WIDTH/2, CANVAS_HEIGHT/2, Math.max(CANVAS_WIDTH, CANVAS_HEIGHT)/1.5
    );
    gradient.addColorStop(0, '#15161a');
    gradient.addColorStop(1, '#0f0f12');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 보드 테두리
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 2;
    ctx.roundRect(MARGIN - 8, MARGIN - 8, CELL_SIZE * BOARD_SIZE + 16, CELL_SIZE * BOARD_SIZE + 16, 12);
    ctx.stroke();
    ctx.restore();

    // 격자 그리기
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    
    // 세로선
    for (let i = 1; i < BOARD_SIZE; i++) {
      const x = MARGIN + i * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(x, MARGIN);
      ctx.lineTo(x, MARGIN + CELL_SIZE * BOARD_SIZE);
      ctx.stroke();
    }

    // 가로선
    for (let i = 1; i < BOARD_SIZE; i++) {
      const y = MARGIN + i * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(MARGIN, y);
      ctx.lineTo(MARGIN + CELL_SIZE * BOARD_SIZE, y);
      ctx.stroke();
    }

    // X, O 그리기
    for (let i = 0; i < board.length; i++) {
      const player = board[i];
      if (!player) continue;

      const row = Math.floor(i / BOARD_SIZE);
      const col = i % BOARD_SIZE;
      const centerX = MARGIN + col * CELL_SIZE + CELL_SIZE / 2;
      const centerY = MARGIN + row * CELL_SIZE + CELL_SIZE / 2;

      ctx.save();
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';

      if (player === 'X') {
        // X 그리기
        ctx.strokeStyle = '#7DE5FF';
        const size = 35;
        ctx.beginPath();
        ctx.moveTo(centerX - size, centerY - size);
        ctx.lineTo(centerX + size, centerY + size);
        ctx.moveTo(centerX + size, centerY - size);
        ctx.lineTo(centerX - size, centerY + size);
        ctx.stroke();
      } else if (player === 'O') {
        // O 그리기
        ctx.strokeStyle = '#FFB86B';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 게임 상태 표시
    if (gameOver) {
      ctx.save();
      ctx.fillStyle = 'rgba(15,15,18,0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 32px "Segoe UI", system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (winner === 'Draw') {
        ctx.fillText('무승부!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
      } else {
        ctx.fillText(`${winner} 승리!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
      }
      
      ctx.font = '500 18px "Segoe UI", system-ui';
      ctx.fillStyle = '#cfcfd4';
      ctx.fillText('R: 재시작', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
      ctx.restore();
    }

  }, [board, gameOver, winner]);

  const getStatusText = () => {
    if (gameOver) {
      if (winner === 'Draw') return '무승부!';
      return `${winner} 승리!`;
    }
    return `${currentPlayer} 차례`;
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
        가로·세로·대각선으로 3개를 먼저 연결하세요!
      </div>
    </div>
  );

  // 하단 정보 (조작법)
  const bottomInfo = (
    <div>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>조작법:</strong> 마우스로 빈 칸을 클릭하여 X 또는 O를 배치하세요
      </div>
      <div>
        <strong>단축키:</strong> R키 = 새 게임, Escape = 메뉴로 돌아가기
      </div>
      {gameOver && (
        <div style={{ marginTop: spacing.sm }}>
          <GameButton 
            onClick={resetGame}
            variant="primary"
            size="large"
            style={{ minWidth: 120 }}
          >
            새 게임 시작
          </GameButton>
        </div>
      )}
    </div>
  );

  return (
    <GameLayout 
      title="⭕ 틱택토"
      topInfo={topInfo}
      bottomInfo={bottomInfo}
    >
      <GameCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleClick}
        gameTitle="Tic-Tac-Toe"
        style={{
          cursor: gameOver ? "default" : "pointer"
        }}
      />
    </GameLayout>
  );
}