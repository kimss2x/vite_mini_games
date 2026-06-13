import React, { useEffect, useRef, useState } from "react";
import GameManager from "./components/GameManager";
import LeaderboardPanel from "./components/LeaderboardPanel";
import PureGameCanvas from "./components/PureGameCanvas";

type Props = {
  width: number;
  height: number;
};

export default function PingPongCanvas({ width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const gameOverRef = useRef(false);
  const [scoreText, setScoreText] = useState("0 : 0");
  const [finalScore, setFinalScore] = useState<{ player: number; ai: number } | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");

  const WIN_SCORE = 5;

  const restartGame = () => {
    gameOverRef.current = false;
    setFinalScore(null);
    setScoreText("0 : 0");
    setCopyStatus("");
    setResetToken((value) => value + 1);
  };

  const copyShareText = async () => {
    const player = finalScore?.player ?? 0;
    const ai = finalScore?.ai ?? 0;
    const text = `Noah Ping Pong Garden에서 ${player}:${ai} 점수를 기록했어요. 작은 별 씨앗을 다시 튕겨볼까요?`;

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("공유 문구를 복사했어요.");
    } catch {
      setCopyStatus(text);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    gameOverRef.current = false;
    setScoreText("0 : 0");
    setCopyStatus("");

    // ===== DPR fit =====
    function fitDPR(cssW: number, cssH: number) {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.style.width = "100%";
      canvas.style.height = "auto";
      canvas.style.aspectRatio = `${cssW} / ${cssH}`;
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
    function syncScore() {
      const nextScoreText = `${playerScore} : ${aiScore}`;
      if (scoreRef.current) {
        scoreRef.current.textContent = nextScoreText;
      }
      setScoreText(nextScoreText);
    }
    function endGame() {
      syncScore();
      gameOverRef.current = true;
      setFinalScore({ player: playerScore, ai: aiScore });
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
        restartGame();
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
    function drawRoundedRect(
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      color: string,
      strokeColor?: string
    ) {
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
      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawBackground() {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#fff1c9");
      bg.addColorStop(0.58, "#f8dba6");
      bg.addColorStop(1, "#dfbd7b");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = "#f4a66f";
      ctx.beginPath();
      ctx.arc(W * 0.16, H * 0.22, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8fc17d";
      ctx.beginPath();
      ctx.ellipse(W * 0.82, H * 0.2, 76, 34, -0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d6a45f";
      for (let i = 0; i < 12; i++) {
        const x = 48 + i * 74;
        ctx.fillRect(x, H - 30 - (i % 2) * 8, 46, 4);
      }
      ctx.restore();
    }

    function drawStarSeed(x: number, y: number, s: number) {
      ctx.save();
      const cx = x + s / 2;
      const cy = y + s / 2;
      const outer = s * 0.72;
      const inner = s * 0.34;
      ctx.shadowColor = "rgba(133, 87, 36, 0.35)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#f8c64d";
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outer : inner;
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const px = cx + Math.cos(angle) * radius;
        const py = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#8a5a31";
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawPaddle(x: number, y: number, color: string, accent: string) {
      drawRoundedRect(x - 3, y, PADDLE_W + 6, PADDLE_H, 8, color, accent);
      ctx.save();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.78;
      ctx.fillRect(x + PADDLE_W / 2 - 1, y + 12, 2, PADDLE_H - 24);
      ctx.restore();
    }

    // ===== render =====
    function draw() {
      ctx.clearRect(0, 0, W, H);
      drawBackground();

      // 중앙 점선
      ctx.save();
      ctx.strokeStyle = "rgba(126, 88, 47, 0.22)";
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 14]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 20);
      ctx.lineTo(W / 2, H - 20);
      ctx.stroke();
      ctx.restore();

      // 테두리 광택
      ctx.save();
      ctx.strokeStyle = "rgba(126, 88, 47, 0.16)";
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.restore();

      // 패들
      drawPaddle(PLAYER_X, playerY, "#f9f0de", "#c47f4d");
      drawPaddle(AI_X, aiY, "#ffe3aa", "#8ab275");

      // 공
      drawStarSeed(ball.x, ball.y, BALL_SIZE);

      // 일시정지 오버레이
      if (isPaused || gameOverRef.current) {
        ctx.save();
        ctx.fillStyle = "rgba(94, 62, 34, 0.36)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff9ea";
        ctx.font = '600 28px "Segoe UI", system-ui';
        ctx.textAlign = "center";
        ctx.fillText(gameOverRef.current ? "정원 경기 종료" : "일시정지", W / 2, H / 2 - 10);
        ctx.font = '500 16px "Segoe UI", system-ui';
        ctx.fillStyle = "#fff0c7";
        ctx.fillText(
          gameOverRef.current ? "아래 결과 화면에서 다시 시작하세요" : "Space: 재개 · R: 재시작",
          W / 2,
          H / 2 + 20
        );
        ctx.restore();
      }
    }

    // ===== game loop =====
    function update(dt: number) {
      if (gameOverRef.current) return;

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
          syncScore();
          if (aiScore >= WIN_SCORE) endGame();
          else resetRound(true);
          break;
        } else if (ball.x > W) {
          playerScore++;
          syncScore();
          if (playerScore >= WIN_SCORE) endGame();
          else resetRound(false);
          break;
        }
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
  }, [width, height, resetToken]);

  const gameStats = (
    <div
      ref={scoreRef as any}
      style={{
        fontSize: 16,
        color: '#7a5535',
        fontWeight: 600,
        textAlign: 'center'
      }}
    >
      {scoreText}
    </div>
  );

  const instructions =
    "조작법: 터치 드래그, 마우스 이동, W/S 또는 ↑/↓ 키 사용\n" +
    "게임: 스페이스바 = 일시정지/재개, R키 = 재시작\n" +
    `${WIN_SCORE}점을 먼저 얻으면 결과 화면이 열립니다.`;

  const actionButtons = (
    <>
      {finalScore && (
        <div
          style={{
            width: '100%',
            textAlign: 'center',
            color: '#6b4328',
            fontWeight: 700,
            lineHeight: 1.5,
            marginBottom: 4,
          }}
        >
          결과: Noah {finalScore.player} : {finalScore.ai} Garden AI
        </div>
      )}
      <button
        onClick={restartGame}
        style={{
          border: 'none',
          borderRadius: 999,
          padding: '11px 18px',
          background: '#d97845',
          color: '#fffaf0',
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        Play Again
      </button>
      <button
        onClick={copyShareText}
        style={{
          border: '2px solid rgba(107, 67, 40, 0.24)',
          borderRadius: 999,
          padding: '9px 16px',
          background: '#fff9ea',
          color: '#6b4328',
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        공유용 문구 복사
      </button>
      {copyStatus && (
        <div style={{ width: '100%', textAlign: 'center', color: '#7a5535', fontSize: 13 }}>
          {copyStatus}
        </div>
      )}
      <LeaderboardPanel finalScore={finalScore} />
    </>
  );

  return (
    <GameManager
      title="Noah Ping Pong Garden"
      gameIcon="✦"
      gameStats={gameStats}
      gameStatus={finalScore ? "별 씨앗이 정원 끝에 도착했어요" : "AI와 별 씨앗 핑퐁 대결"}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <PureGameCanvas
        ref={canvasRef}
        width={width}
        height={height}
        gameTitle="Noah Ping Pong Garden"
      />
    </GameManager>
  );
}
