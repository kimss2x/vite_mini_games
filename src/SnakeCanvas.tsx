import React, { useEffect, useRef, useState } from "react";
import GameManager from "./components/GameManager";
import PureGameCanvas from "./components/PureGameCanvas";
import GameButton from "./components/GameButton";

/** ===== 설정 ===== */
const COLS = 22;
const ROWS = 16;
const CELL = 28;           // 셀 픽셀(논리)
const MARGIN = 28;         // 보드 바깥 여백

const SPEED_START = 140;   // 시작 틱(ms)
const SPEED_MIN = 60;      // 최소(빠름)
const SPEED_STEP = 6;      // 먹을 때마다 가속

type Dir = "L" | "R" | "U" | "D";
type Pt = { x: number; y: number };

export default function SnakeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState('플레이 중');
  const [currentSpeed, setCurrentSpeed] = useState(SPEED_START);
  const [instructions] = useState('조작 — ←/→/↑/↓ 또는 WASD 이동, Space/P 일시정지, R 재시작 (터치: 스와이프)');

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // DPR 스케일
    function fitDPR() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const W = MARGIN * 2 + COLS * CELL;
      const H = MARGIN * 2 + ROWS * CELL;
      canvas.style.width = W + "px";
      canvas.style.maxWidth = "100%";
      canvas.style.height = "auto";
      canvas.style.aspectRatio = `${W} / ${H}`;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { W, H };
    }
    const { W, H } = fitDPR();

    // 상태
    let snake: Pt[] = [];
    let dir: Dir = "R";
    let nextDir: Dir = "R";
    let food: Pt = { x: 0, y: 0 };
    let gameScore = 0;
    let paused = false;
    let gameOver = false;
    let speed = SPEED_START; // 낮을수록 빠름
    let last = 0;
    let acc = 0;

    // 초기화
    function reset() {
      const y0 = Math.floor(ROWS / 2);
    const headX = Math.floor(COLS / 2) + 1; // 머리 위치(오른쪽 진행에 여유)
    const START_LEN = 4;
      gameScore = 0;
      speed = SPEED_START;
      setScore(0);
      setCurrentSpeed(speed);
      setGameStatus('플레이 중');
    // 머리 -> 꼬리 순으로 연속 좌표 생성 (오른쪽 진행이므로 몸통은 왼쪽으로 배치)
    snake = Array.from({ length: START_LEN }, (_, i) => ({
        x: headX - i,
        y: y0,
    }));
    dir = "R";
    nextDir = "R";
    paused = false;
    gameOver = false;
    speed = SPEED_START;
    spawnFood();
    }

    function spawnFood() {
      while (true) {
        const fx = Math.floor(Math.random() * COLS);
        const fy = Math.floor(Math.random() * ROWS);
        if (!snake.some((s) => s.x === fx && s.y === fy)) {
          food = { x: fx, y: fy };
          break;
        }
      }
    }

    function step() {
      // 방향 업데이트(역방향 방지)
      if (
        (dir === "L" && nextDir !== "R") ||
        (dir === "R" && nextDir !== "L") ||
        (dir === "U" && nextDir !== "D") ||
        (dir === "D" && nextDir !== "U")
      ) {
        dir = nextDir;
      }

      // 머리 이동
      const head = { ...snake[0] };
      if (dir === "L") head.x--;
      if (dir === "R") head.x++;
      if (dir === "U") head.y--;
      if (dir === "D") head.y++;

      // 벽 충돌
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        gameOver = true;
        paused = true;
        setGameStatus('게임 오버 (R: 재시작)');
        return;
      }
      // 몸 충돌
      if (snake.some((p) => p.x === head.x && p.y === head.y)) {
        gameOver = true;
        paused = true;
        setGameStatus('게임 오버 (R: 재시작)');
        return;
      }

      // 이동
      snake.unshift(head);

      // 먹이
      if (head.x === food.x && head.y === food.y) {
        gameScore += 10;
        setScore(gameScore);
        speed = Math.max(SPEED_MIN, speed - SPEED_STEP);
        setCurrentSpeed(speed);
        spawnFood();
      } else {
        snake.pop(); // 성장 없으면 꼬리 제거
      }
    }

    /** ===== 입력 ===== */
    const onKey = (e: KeyboardEvent) => {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "A", "d", "D", "w", "W", "s", "S", " ", "p", "P", "r", "R"].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
      }

      switch (e.key) {
        case "ArrowLeft": case "a": case "A": nextDir = "L"; break;
        case "ArrowRight": case "d": case "D": nextDir = "R"; break;
        case "ArrowUp": case "w": case "W": nextDir = "U"; break;
        case "ArrowDown": case "s": case "S": nextDir = "D"; break;
        case " ": if (!gameOver) { paused = !paused; setGameStatus(paused ? '플레이 중' : '일시정지'); } break;
        case "p": case "P": if (!gameOver) { paused = !paused; setGameStatus(paused ? '플레이 중' : '일시정지'); } break;
        case "r": case "R": reset(); break;
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });

    // 간단 스와이프(터치)
    let touchStart: Pt | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStart) return;
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        nextDir = dx > 0 ? "R" : "L";
      } else {
        nextDir = dy > 0 ? "D" : "U";
      }
      touchStart = null;
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

    /** ===== 렌더 ===== */
    const boardX = MARGIN;
    const boardY = MARGIN;

    function drawCell(x: number, y: number, fill: string, stroke = "rgba(255,255,255,.08)") {
      const px = boardX + x * CELL;
      const py = boardY + y * CELL;
      ctx.fillStyle = fill;
      ctx.fillRect(px, py, CELL, CELL);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
    }

    function draw() {
      // 배경
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)/1.2);
      grad.addColorStop(0, "#15161a");
      grad.addColorStop(1, "#0f0f12");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 보더
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,.06)";
      ctx.lineWidth = 2;
      ctx.roundRect(boardX - 8, boardY - 8, COLS * CELL + 16, ROWS * CELL + 16, 12);
      ctx.stroke();
      ctx.restore();

      // 그리드
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        const px = boardX + x * CELL + 0.5;
        ctx.beginPath(); ctx.moveTo(px, boardY); ctx.lineTo(px, boardY + ROWS * CELL); ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        const py = boardY + y * CELL + 0.5;
        ctx.beginPath(); ctx.moveTo(boardX, py); ctx.lineTo(boardX + COLS * CELL, py); ctx.stroke();
      }
      ctx.restore();

      // 음식
      drawCell(food.x, food.y, "#ffb86b");

      // 스네이크
      snake.forEach((p, i) => {
        const col = i === 0 ? "#7de5ff" : "#5ac6ea";
        drawCell(p.x, p.y, col);
      });

      // 점수 & 상태
      ctx.save();
      ctx.fillStyle = "#e8e8ea";
      ctx.font = '600 18px "Segoe UI", system-ui';
      ctx.fillText(`Score ${score}`, boardX, boardY - 14);
      if (paused && !gameOver) {
        overlay("일시정지 (Space/P)");
      }
      if (gameOver) {
        overlay("게임 오버 (R: 재시작)");
      }
      ctx.restore();
    }

    function overlay(text: string) {
      ctx.save();
      ctx.fillStyle = "rgba(15,15,18,.55)";
      ctx.fillRect(boardX, boardY, COLS * CELL, ROWS * CELL);
      ctx.fillStyle = "#fff";
      ctx.font = '700 26px "Segoe UI", system-ui';
      ctx.textAlign = "center";
      ctx.fillText(text, boardX + (COLS * CELL) / 2, boardY + (ROWS * CELL) / 2);
      ctx.restore();
    }

    /** ===== 루프 ===== */
    function tick(ts: number) {
      const dt = Math.min(60, ts - last);
      last = ts;

      if (!paused && !gameOver) {
        acc += dt;
        while (acc >= speed) {
          step();
          acc -= speed;
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    // 시작
    reset();
    let raf = requestAnimationFrame(tick);


    // 정리
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);


  const width = MARGIN * 2 + COLS * CELL;
  const height = MARGIN * 2 + ROWS * CELL;

  const gameStats = (
    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
      <span>점수: {score}</span>
      <span>속도: {(200 - currentSpeed).toFixed(0)}</span>
    </div>
  );

  const actionButtons = gameStatus.includes('게임 오버') ? (
    <GameButton 
      onClick={() => {
        // reset 함수 호출을 위한 이벤트 시뮬레이션
        const event = new KeyboardEvent('keydown', { key: 'r' });
        window.dispatchEvent(event);
      }}
      variant="primary"
      size="large"
    >
      재시작
    </GameButton>
  ) : null;

  return (
    <GameManager
      title="Snake"
      gameIcon="🐍"
      gameStats={gameStats}
      gameStatus={gameStatus}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <PureGameCanvas
        ref={canvasRef}
        width={width}
        height={height}
        gameTitle="Snake"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% 50%, #15161a 0%, #0f0f12 70%)",
          boxShadow:
            "0 10px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
          borderRadius: 14,
          touchAction: "none",
        }}
      />
    </GameManager>
  );
}
