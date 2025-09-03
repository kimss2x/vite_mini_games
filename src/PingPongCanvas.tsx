import React, { useEffect, useRef } from "react";
import GameManager from "./components/GameManager";
import PureGameCanvas from "./components/PureGameCanvas";

type Props = {
  width: number;
  height: number;
};

export default function PingPongCanvas({ width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // ===== DPR fit =====
    function fitDPR(cssW: number, cssH: number) {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fitDPR(width, height);

    // ===== constants =====
    const W = width;
    const H = height;

    const PADDLE_W = 14;
    const PADDLE_H = 100;
    const BALL_SIZE = 12;

    const PLAYER_X = 40;
    const AI_X = W - 40 - PADDLE_W;

    const PLAYER_SPEED = 7;
    const AI_MAX_SPEED = 6.2;

    const BALL_START_SPEED = 5.2;
    const BALL_MAX_SPEED = 9.5;
    const SPEEDUP_FACTOR = 1.035;

    // ===== state =====
    let playerY = (H - PADDLE_H) / 2;
    let aiY = (H - PADDLE_H) / 2;
    const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };

    let isPaused = false;
    let playerScore = 0;
    let aiScore = 0;
    let lastTime = 0;
    let prevPlayerY = playerY;
    const keys = new Set<string>();

    // ===== utils =====
    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v));

    function launchBall(toRight = true) {
      ball.x = W / 2;
      ball.y = H / 2;
      const angle = Math.random() * 0.9 - 0.45; // ±25.8°
      const speed = BALL_START_SPEED;
      ball.vx = Math.cos(angle) * speed * (toRight ? 1 : -1);
      ball.vy = Math.sin(angle) * speed;
    }
    function resetRound(lastWinnerRight: boolean) {
      launchBall(!lastWinnerRight);
    }
    function rectIntersect(
      x1: number, y1: number, w1: number, h1: number,
      x2: number, y2: number, w2: number, h2: number
    ) {
      return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }
    function reflectFromPaddle(paddleY: number, dir: number, fromPlayer: boolean) {
      const paddleCenter = paddleY + PADDLE_H / 2;
      const ballCenter = ball.y + BALL_SIZE / 2;
      let offset = (ballCenter - paddleCenter) / (PADDLE_H / 2); // -1..1
      offset = clamp(offset, -1, 1);

      const speed = Math.min(
        BALL_MAX_SPEED,
        Math.hypot(ball.vx, ball.vy) * SPEEDUP_FACTOR
      );

      const maxAngle = (Math.PI * 50) / 180;
      const angle = offset * maxAngle;
      ball.vx = Math.cos(angle) * speed * dir;
      ball.vy = Math.sin(angle) * speed;

      if (Math.abs(ball.vy) < 0.45) {
        ball.vy = 0.45 * Math.sign(ball.vy || (Math.random() < 0.5 ? 1 : -1));
      }

      if (fromPlayer) {
        const paddleVel = playerY - prevPlayerY; // 프레임 당 이동량
        ball.vy += 0.05 * paddleVel;
      }
      prevPlayerY = playerY;
    }
    function collideWithPaddles() {
      if (
        rectIntersect(ball.x, ball.y, BALL_SIZE, BALL_SIZE, PLAYER_X, playerY, PADDLE_W, PADDLE_H) &&
        ball.vx < 0
      ) {
        ball.x = PLAYER_X + PADDLE_W;
        reflectFromPaddle(playerY, +1, true);
      }
      if (
        rectIntersect(ball.x, ball.y, BALL_SIZE, BALL_SIZE, AI_X, aiY, PADDLE_W, PADDLE_H) &&
        ball.vx > 0
      ) {
        ball.x = AI_X - BALL_SIZE;
        reflectFromPaddle(aiY, -1, false);
      }
    }

    // ===== input =====
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", " ", "w", "W", "s", "S"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      keys.add(e.key);
      if (e.key === " ") {
        isPaused = !isPaused;
      } else if (e.key.toLowerCase() === "r") {
        playerScore = 0;
        aiScore = 0;
        playerY = (H - PADDLE_H) / 2;
        aiY = (H - PADDLE_H) / 2;
        isPaused = false;
        launchBall(Math.random() < 0.5);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", " ", "w", "W", "s", "S"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      keys.delete(e.key);
    };

    function setPlayerByPointer(clientY: number) {
      const rect = canvas.getBoundingClientRect();
      const y = (clientY - rect.top) * (H / rect.height) - PADDLE_H / 2;
      playerY = clamp(y, 0, H - PADDLE_H);
    }
    const onMouseMove = (e: MouseEvent) => setPlayerByPointer(e.clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) setPlayerByPointer(e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches && e.touches[0]) setPlayerByPointer(e.touches[0].clientY);
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });

    // ===== draw helpers =====
    function drawRoundedRect(x: number, y: number, w: number, h: number, r: number, color: string) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    function drawBall(x: number, y: number, s: number, color: string) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;
      ctx.beginPath();
      // roundRect 폴백
      (ctx as any).roundRect
        ? (ctx as any).roundRect(x, y, s, s, 6)
        : (() => {
            const r = 6;
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + s, y, x + s, y + s, r);
            ctx.arcTo(x + s, y + s, x, y + s, r);
            ctx.arcTo(x, y + s, x, y, r);
            ctx.arcTo(x, y, x + s, y, r);
            ctx.closePath();
          })();
      ctx.fill();
      ctx.restore();
    }

    // ===== render =====
    function draw() {
      ctx.clearRect(0, 0, W, H);

      // 중앙 점선
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 14]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 20);
      ctx.lineTo(W / 2, H - 20);
      ctx.stroke();
      ctx.restore();

      // 테두리 광택
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.restore();

      // 패들
      drawRoundedRect(PLAYER_X, playerY, PADDLE_W, PADDLE_H, 7, "#e9edf7");
      drawRoundedRect(AI_X, aiY, PADDLE_W, PADDLE_H, 7, "#ffd9a8");

      // 공
      drawBall(ball.x, ball.y, BALL_SIZE, "#d1f5ff");

      // 일시정지 오버레이
      if (isPaused) {
        ctx.save();
        ctx.fillStyle = "rgba(15,15,18,0.5)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffffff";
        ctx.font = '600 28px "Segoe UI", system-ui';
        ctx.textAlign = "center";
        ctx.fillText("일시정지", W / 2, H / 2 - 10);
        ctx.font = '500 16px "Segoe UI", system-ui';
        ctx.fillStyle = "#cfcfd4";
        ctx.fillText("Space: 재개 · R: 재시작", W / 2, H / 2 + 20);
        ctx.restore();
      }
    }

    // ===== game loop =====
    function update(dt: number) {
      // 입력
      let vy = 0;
      if (keys.has("w") || keys.has("W") || keys.has("ArrowUp")) vy -= PLAYER_SPEED;
      if (keys.has("s") || keys.has("S") || keys.has("ArrowDown")) vy += PLAYER_SPEED;
      if (vy !== 0) playerY = clamp(playerY + vy * dt, 0, H - PADDLE_H);

      // AI 추적
      const aiCenter = aiY + PADDLE_H / 2;
      const target = ball.y;
      const delta = clamp(target - aiCenter, -AI_MAX_SPEED, AI_MAX_SPEED);
      aiY = clamp(aiY + delta * dt, 0, H - PADDLE_H);

      // 공 이동 (마이크로 스텝으로 터널링 완화)
      const speedNow = Math.max(Math.abs(ball.vx), Math.abs(ball.vy));
      const steps = Math.max(1, Math.ceil((speedNow * dt) / (BALL_SIZE * 0.5)));
      const stepDt = dt / steps;

      for (let i = 0; i < steps; i++) {
        ball.x += ball.vx * stepDt;
        ball.y += ball.vy * stepDt;

        // 상하 벽
        if (ball.y <= 0) {
          ball.y = 0;
          ball.vy = Math.abs(ball.vy);
        } else if (ball.y + BALL_SIZE >= H) {
          ball.y = H - BALL_SIZE;
          ball.vy = -Math.abs(ball.vy);
        }

        // 패들 충돌
        collideWithPaddles();

        // 득점
        if (ball.x + BALL_SIZE < 0) {
          aiScore++;
          resetRound(true);
          break;
        } else if (ball.x > W) {
          playerScore++;
          resetRound(false);
          break;
        }
      }

      if (scoreRef.current) {
        scoreRef.current.textContent = `${playerScore} : ${aiScore}`;
      }
    }

    let raf = 0;
    function frame(ts: number) {
      const dt = Math.min(32, ts - lastTime) / 16.6667;
      lastTime = ts;
      if (!isPaused) update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }
    launchBall(Math.random() < 0.5);
    raf = requestAnimationFrame(frame);

    // cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
    };
  }, [width, height]);

  const gameStats = (
    <div
      ref={scoreRef as any}
      style={{
        fontSize: 16,
        color: '#bcbcbe',
        fontWeight: 600,
        textAlign: 'center'
      }}
    >
      0 : 0
    </div>
  );

  const instructions =
    "조작법: 마우스로 패들을 움직이거나 W/S 키 사용\n" +
    "게임: 스페이스바 = 일시정지/재개, R키 = 재시작\n" +
    "공을 상대방 골대에 넣어서 점수를 얻으세요!";

  return (
    <GameManager
      title="Ping Pong"
      gameIcon="🏓"
      gameStats={gameStats}
      gameStatus="AI와의 핑퐁 대결"
      instructions={instructions}
    >
      <PureGameCanvas
        ref={canvasRef}
        width={width}
        height={height}
        gameTitle="Ping Pong"
      />
    </GameManager>
  );
}
