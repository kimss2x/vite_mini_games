import React, { useEffect, useRef, useState } from "react";
import GameManager from "./components/GameManager";
import PureGameCanvas from "./components/PureGameCanvas";
import GameButton from "./components/GameButton";

/**
 * 간단한 오목 보드.
 * 마우스로 교대로 돌을 두고 다섯 줄을 만들면 승리합니다.
 * R 키로 게임을 다시 시작할 수 있습니다.
 */

const BOARD_SIZE = 15; // 15x15 교차점
const CELL = 32; // 격자 간격(px)
const MARGIN = 20; // 바깥 여백(px)

type Stone = 0 | 1 | 2; // 0=empty, 1=black, 2=white

export default function OmokCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [board, setBoard] = useState<Stone[][]>(() =>
    Array.from({ length: BOARD_SIZE }, () => Array<Stone>(BOARD_SIZE).fill(0))
  );
  const [turn, setTurn] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<1 | 2 | null>(null);

  // 보드 리셋
  function reset() {
    setBoard(
      Array.from({ length: BOARD_SIZE }, () => Array<Stone>(BOARD_SIZE).fill(0))
    );
    setTurn(1);
    setWinner(null);
  }

  // 키보드 R 로 리셋
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        e.stopPropagation();
        reset();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 클릭으로 돌 두기
  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (winner) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gx = Math.round((x - MARGIN) / CELL);
    const gy = Math.round((y - MARGIN) / CELL);
    if (gx < 0 || gy < 0 || gx >= BOARD_SIZE || gy >= BOARD_SIZE) return;
    if (board[gy][gx] !== 0) return;

    const nextBoard = board.map((row) => row.slice()) as Stone[][];
    nextBoard[gy][gx] = turn;
    setBoard(nextBoard);

    if (checkWin(nextBoard, gx, gy, turn)) {
      setWinner(turn);
    } else {
      setTurn(turn === 1 ? 2 : 1);
    }
  }

  // 승리 체크
  function checkWin(b: Stone[][], x: number, y: number, color: Stone): boolean {
    const dirs = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ];
    for (const [dx, dy] of dirs) {
      let count = 1;
      for (const dir of [1, -1]) {
        let nx = x + dx * dir;
        let ny = y + dy * dir;
        while (
          nx >= 0 &&
          nx < BOARD_SIZE &&
          ny >= 0 &&
          ny < BOARD_SIZE &&
          b[ny][nx] === color
        ) {
          count++;
          nx += dx * dir;
          ny += dy * dir;
        }
      }
      if (count >= 5) return true;
    }
    return false;
  }

  // 그리기
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const size = MARGIN * 2 + CELL * (BOARD_SIZE - 1);
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 갈색 배경으로 칠하기
    ctx.fillStyle = "#D2B48C"; // 탄 갈색 (Tan)
    ctx.fillRect(0, 0, size, size);
    
    ctx.strokeStyle = "#8B4513"; // 어두운 갈색 격자선

    for (let i = 0; i < BOARD_SIZE; i++) {
      const p = MARGIN + i * CELL + 0.5;
      ctx.beginPath();
      ctx.moveTo(MARGIN + 0.5, p);
      ctx.lineTo(MARGIN + CELL * (BOARD_SIZE - 1) + 0.5, p);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p, MARGIN + 0.5);
      ctx.lineTo(p, MARGIN + CELL * (BOARD_SIZE - 1) + 0.5);
      ctx.stroke();
    }

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const cell = board[y][x];
        if (cell === 0) continue;
        const cx = MARGIN + x * CELL;
        const cy = MARGIN + y * CELL;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL / 2 - 2, 0, Math.PI * 2);
        ctx.fillStyle = cell === 1 ? "#000" : "#fff";
        ctx.strokeStyle = "#000";
        ctx.fill();
        ctx.stroke();
      }
    }
  }, [board]);

  const size = MARGIN * 2 + CELL * (BOARD_SIZE - 1);

  const getGameStatus = () => {
    if (winner) {
      return `${winner === 1 ? '⚫' : '⚪'} 승리! 🎉`;
    }
    return `${turn === 1 ? '⚫ 흑' : '⚪ 백'} 차례`;
  };

  const gameStats = (
    <div style={{ textAlign: 'center', color: '#bcbcbe' }}>
      현재: {turn === 1 ? '⚫ 흑돌' : '⚪ 백돌'} 차례
    </div>
  );

  const actionButtons = winner ? (
    <GameButton 
      onClick={reset}
      variant="primary"
      size="large"
    >
      새 게임 시작
    </GameButton>
  ) : null;

  return (
    <GameManager
      title="Omok"
      gameIcon="○●"
      gameStats={gameStats}
      gameStatus={getGameStatus()}
      instructions="교대로 돌을 두어 가로, 세로, 대각선으로 5개를 연결하세요! 마우스 클릭으로 돌을 두고, R키로 재시작할 수 있습니다."
      actionButtons={actionButtons}
    >
      <PureGameCanvas
        ref={canvasRef}
        width={size}
        height={size}
        onClick={handleClick}
        gameTitle="Omok"
        style={{ cursor: winner ? 'default' : 'pointer' }}
      />
    </GameManager>
  );
}

