import React, { useEffect, useRef } from "react";
import GameLayout from "./components/GameLayout";
import GameCanvas from "./components/GameCanvas";
import { spacing, typography } from "./theme/gameTheme";

/** ───────────── 설정 ───────────── */
const COLS = 10;
const ROWS = 20;
const CELL = 26;          // 보드 셀 픽셀(논리) 크기
const MARGIN = 28;        // 보드 바깥 여백
const PANEL_W = 150;      // 홀드/넥스트 패널 폭

// 색상
const COLORS: Record<string, string> = {
  I: "#7DE5FF",
  O: "#FFE26B",
  T: "#C69CFF",
  S: "#A8FF8C",
  Z: "#FF8C8C",
  J: "#7BA7FF",
  L: "#FFC17B",
  G: "rgba(255,255,255,.25)", // ghost
  X: "#353741"               // 테두리/그리드
};

type Cell = 0 | "I" | "O" | "T" | "S" | "Z" | "J" | "L";

/** ───────────── 조각 정의 ─────────────
 * 각 조각은 4x4 매트릭스로 표현(회전은 코드로 계산).
 */
const SHAPES: Record<Exclude<Cell, 0>, number[][]> = {
  I: [
    [0,0,0,0],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0]
  ],
  O: [
    [0,1,1,0],
    [0,1,1,0],
    [0,0,0,0],
    [0,0,0,0]
  ],
  T: [
    [0,1,0,0],
    [1,1,1,0],
    [0,0,0,0],
    [0,0,0,0]
  ],
  S: [
    [0,1,1,0],
    [1,1,0,0],
    [0,0,0,0],
    [0,0,0,0]
  ],
  Z: [
    [1,1,0,0],
    [0,1,1,0],
    [0,0,0,0],
    [0,0,0,0]
  ],
  J: [
    [1,0,0,0],
    [1,1,1,0],
    [0,0,0,0],
    [0,0,0,0]
  ],
  L: [
    [0,0,1,0],
    [1,1,1,0],
    [0,0,0,0],
    [0,0,0,0]
  ],
};

type PieceType = Exclude<Cell, 0>;
type Piece = {
  type: PieceType;
  x: number;
  y: number;
  rot: number; // 0..3
};

/** ───────────── 유틸 ───────────── */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rnd = (n: number) => Math.floor(Math.random() * n);

function rotateMat(m: number[][], times: number) {
  // 4x4 행렬을 시계방향 times번 회전
  let r = m.map(row => row.slice());
  for (let t = 0; t < (times % 4 + 4) % 4; t++) {
    const n = r.length;
    const out = Array.from({ length: n }, () => Array(n).fill(0));
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++)
        out[x][n - 1 - y] = r[y][x];
    r = out;
  }
  return r;
}

// 7-백 생성기
function* bagGen() {
  const bagTypes: PieceType[] = ["I","O","T","S","Z","J","L"];
  while (true) {
    const bag = [...bagTypes];
    const out: PieceType[] = [];
    while (bag.length) out.push(bag.splice(rnd(bag.length), 1)[0]);
    yield* out;
  }
}

function fallIntervalMs(level: number) {
  // 레벨에 따라 점점 빨라짐(대략 Tetris Guideline 감각)
  return Math.max(60, Math.floor(1000 * Math.pow(0.88, level)));
}

/** ───────────── 메인 컴포넌트 ───────────── */
export default function TetrisCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // DPR 스케일
    function fitDPR() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const widthCSS = MARGIN*2 + PANEL_W*2 + COLS*CELL;
      const heightCSS = MARGIN*2 + ROWS*CELL;
      canvas.style.width = widthCSS + "px";
      canvas.style.maxWidth = "100%";
      canvas.style.height = "auto";
      canvas.style.aspectRatio = `${widthCSS} / ${heightCSS}`;
      canvas.width = Math.floor(widthCSS * dpr);
      canvas.height = Math.floor(heightCSS * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { widthCSS, heightCSS };
    }
    const { widthCSS: W, heightCSS: H } = fitDPR();

    // 보드/상태
    const board: Cell[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    const nextQ: PieceType[] = [];
    const bags = bagGen();

    let cur: Piece;
    let hold: PieceType | null = null;
    let canHold = true;

    let score = 0;
    let lines = 0;
    let level = 0;
    let paused = false;
    let gameOver = false;

    const boardX = MARGIN + PANEL_W;  // 보드 좌상단 X
    const boardY = MARGIN;            // 보드 좌상단 Y

    // 초기 큐 채우기
    while (nextQ.length < 5) nextQ.push(bags.next().value as PieceType);

    function spawn() {
      const t = nextQ.shift() as PieceType;
      nextQ.push(bags.next().value as PieceType);
      cur = { type: t, x: Math.floor(COLS / 2) - 2, y: -1, rot: 0 };
      if (collides(cur)) {
        gameOver = true;
        paused = true;
      }
      canHold = true;
    }

    function cellsOfPiece(p: Piece) {
      const mat = rotateMat(SHAPES[p.type], p.rot);
      const cells: { x: number; y: number }[] = [];
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++)
          if (mat[y][x]) cells.push({ x: p.x + x, y: p.y + y });
      return cells;
    }

    function collides(p: Piece) {
      const cells = cellsOfPiece(p);
      for (const c of cells) {
        if (c.y < 0) continue; // 스폰 영역
        if (c.x < 0 || c.x >= COLS || c.y >= ROWS) return true;
        if (board[c.y][c.x]) return true;
      }
      return false;
    }

    function mergePiece() {
      for (const c of cellsOfPiece(cur)) {
        if (c.y >= 0 && c.y < ROWS && c.x >= 0 && c.x < COLS) {
          board[c.y][c.x] = cur.type;
        }
      }
    }

    function clearLines() {
      let cleared = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(v => v !== 0)) {
          board.splice(y, 1);
          board.unshift(Array(COLS).fill(0));
          cleared++;
          y++;
        }
      }
      if (cleared) {
        lines += cleared;
        // 점수(레벨+1 배수)
        const base = [0, 100, 300, 500, 800][cleared] || 0;
        score += base * (level + 1);
        level = Math.floor(lines / 10);
      }
    }

    function move(dx: number, dy: number) {
      if (gameOver || paused) return false;
      const np = { ...cur, x: cur.x + dx, y: cur.y + dy };
      if (!collides(np)) {
        cur = np;
        return true;
      }
      return false;
    }

    function rotate(dir: 1 | -1) {
      if (gameOver || paused) return;
      const np = { ...cur, rot: (cur.rot + (dir === 1 ? 1 : 3)) % 4 };
      // 간단 월킥: 0, ±1, ±2 시프트
      const kicks = [0, -1, 1, -2, 2];
      for (const k of kicks) {
        const test = { ...np, x: np.x + k };
        if (!collides(test)) {
          cur = test;
          return;
        }
      }
    }

    function hardDrop() {
      if (gameOver || paused) return;
      let dropped = 0;
      while (move(0, 1)) dropped++;
      score += dropped * 2; // 하드드랍 가산
      lock();
    }

    function softDrop() {
      if (move(0, 1)) score += 1;
      else lock();
    }

    function lock() {
      mergePiece();
      clearLines();
      spawn();
    }

    function holdSwap() {
      if (!canHold || gameOver || paused) return;
      const curType = cur.type;
      if (hold == null) {
        hold = curType;
        spawn();
      } else {
        const temp = hold;
        hold = curType;
        cur = { type: temp, x: Math.floor(COLS / 2) - 2, y: -1, rot: 0 };
        if (collides(cur)) { gameOver = true; paused = true; }
      }
      canHold = false;
    }

    function ghostY(): number {
      let gy = cur.y;
      while (true) {
        const test = { ...cur, y: gy + 1 };
        if (collides(test)) break;
        gy++;
      }
      return gy;
    }

    /** ───── 입력 ───── */
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowDown", " ", "z", "Z", "x", "X", "c", "C", "p", "P", "r", "R", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (gameOver && (e.key === "r" || e.key === "R")) {
        reset();
        return;
      }
      switch (e.key) {
        case "ArrowLeft": move(-1, 0); break;
        case "ArrowRight": move(1, 0); break;
        case "ArrowDown": softDrop(); break;
        case " ": hardDrop(); break;
        case "z": case "Z": rotate(-1); break;
        case "x": case "X":
        case "ArrowUp": rotate(1); break;
        case "c": case "C": holdSwap(); break;
        case "p": case "P": paused = !paused; break;
        case "r": case "R": reset(); break;
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });

    function reset() {
      for (let y = 0; y < ROWS; y++) board[y].fill(0);
      score = 0; lines = 0; level = 0;
      hold = null; canHold = true; paused = false; gameOver = false;
      nextQ.length = 0; while (nextQ.length < 5) nextQ.push(bags.next().value as PieceType);
      spawn();
      dropTimer = 0;
    }

    /** ───── 렌더 ───── */
    function drawCell(x: number, y: number, color: string, alpha = 1) {
      const px = boardX + x * CELL;
      const py = boardY + y * CELL;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(px, py, CELL, CELL);
      // 약한 보더
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
      ctx.restore();
    }

    function drawPiece(p: Piece, colorKey?: string, alpha = 1) {
      const mat = rotateMat(SHAPES[p.type], p.rot);
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++)
          if (mat[y][x]) {
            const gx = p.x + x, gy = p.y + y;
            if (gy >= 0) drawCell(gx, gy, COLORS[colorKey || p.type], alpha);
          }
    }

    function drawPanel(x: number, y: number, w: number, h: number, title: string) {
      ctx.save();
      ctx.fillStyle = "rgba(21,22,26,0.85)";
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 2;
      ctx.roundRect(x, y, w, h, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#cfd2d9";
      ctx.font = '600 14px "Segoe UI", system-ui';
      ctx.fillText(title, x + 12, y + 20);
      ctx.restore();
    }

    function draw() {
      // 배경
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)/1.2);
      grad.addColorStop(0, "#15161a");
      grad.addColorStop(1, "#0f0f12");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 보드 영역 테두리
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,.06)";
      ctx.lineWidth = 2;
      ctx.roundRect(boardX-8, boardY-8, COLS*CELL+16, ROWS*CELL+16, 12);
      ctx.stroke();
      ctx.restore();

      // 그리드
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        const px = boardX + x*CELL + 0.5;
        ctx.beginPath(); ctx.moveTo(px, boardY); ctx.lineTo(px, boardY + ROWS*CELL); ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        const py = boardY + y*CELL + 0.5;
        ctx.beginPath(); ctx.moveTo(boardX, py); ctx.lineTo(boardX + COLS*CELL, py); ctx.stroke();
      }
      ctx.restore();

      // 고정 블록
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
          if (board[y][x]) drawCell(x, y, COLORS[board[y][x] as PieceType]);

      // 고스트
      const gy = ghostY();
      drawPiece({ ...cur, y: gy }, "G", 0.35);

      // 현재 조각
      drawPiece(cur);

      // 패널 (왼쪽: HOLD / 오른쪽: NEXT, STATS)
      drawPanel(MARGIN, MARGIN, PANEL_W, 110, "HOLD");
      drawPanel(W - MARGIN - PANEL_W, MARGIN, PANEL_W, 210, "NEXT");
      drawPanel(W - MARGIN - PANEL_W, MARGIN + 220, PANEL_W, 120, "STATS");

      // HOLD 렌더
      if (hold) {
        drawMini(hold, MARGIN + 20, MARGIN + 32, 22);
      }

      // NEXT 렌더(5개)
      for (let i = 0; i < Math.min(5, nextQ.length); i++) {
        drawMini(nextQ[i], W - MARGIN - PANEL_W + 20, MARGIN + 32 + i*34, 18);
      }

      // STATS
      ctx.save();
      ctx.fillStyle = "#e8e8ea";
      ctx.font = '600 18px "Segoe UI", system-ui';
      ctx.fillText(String(score), W - MARGIN - PANEL_W + 20, MARGIN + 260);
      ctx.font = '500 14px "Segoe UI", system-ui';
      ctx.fillStyle = "#cfd2d9";
      ctx.fillText(`Score`, W - MARGIN - PANEL_W + 20, MARGIN + 240);

      ctx.fillStyle = "#e8e8ea";
      ctx.font = '600 16px "Segoe UI", system-ui';
      ctx.fillText(String(level), W - MARGIN - PANEL_W + 20, MARGIN + 300);
      ctx.font = '500 14px "Segoe UI", system-ui';
      ctx.fillStyle = "#cfd2d9";
      ctx.fillText(`Level`, W - MARGIN - PANEL_W + 20, MARGIN + 282);

      ctx.fillStyle = "#e8e8ea";
      ctx.font = '600 16px "Segoe UI", system-ui';
      ctx.fillText(String(lines), W - MARGIN - PANEL_W + 20, MARGIN + 340);
      ctx.font = '500 14px "Segoe UI", system-ui';
      ctx.fillStyle = "#cfd2d9";
      ctx.fillText(`Lines`, W - MARGIN - PANEL_W + 20, MARGIN + 322);
      ctx.restore();

      // 상태 메시지
      if (paused && !gameOver) overlay("일시정지 (P:재개)");
      if (gameOver) overlay("게임 오버 (R:다시 시작)");
    }

    function overlay(text: string) {
      ctx.save();
      ctx.fillStyle = "rgba(15,15,18,0.55)";
      ctx.fillRect(boardX, boardY, COLS*CELL, ROWS*CELL);
      ctx.fillStyle = "#ffffff";
      ctx.font = '700 28px "Segoe UI", system-ui';
      ctx.textAlign = "center";
      ctx.fillText(text, boardX + COLS*CELL/2, boardY + ROWS*CELL/2);
      ctx.restore();
    }

    function drawMini(t: PieceType, px: number, py: number, cell: number) {
      const mat = SHAPES[t];
      // 중심 맞추기: 실제 블록 최소/최대 범위 계산
      let minX=4, maxX=-1, minY=4, maxY=-1;
      for (let y=0;y<4;y++) for (let x=0;x<4;x++) if (mat[y][x]) {
        minX=Math.min(minX,x); maxX=Math.max(maxX,x);
        minY=Math.min(minY,y); maxY=Math.max(maxY,y);
      }
      const w = (maxX-minX+1)*cell, h = (maxY-minY+1)*cell;
      const ox = px + (PANEL_W-40 - w)/2;
      const oy = py + (28 - h)/2;
      for (let y=0;y<4;y++) for (let x=0;x<4;x++) if (mat[y][x]) {
        ctx.fillStyle = COLORS[t]; ctx.fillRect(ox+(x-minX)*cell, oy+(y-minY)*cell, cell, cell);
        ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth=1;
        ctx.strokeRect(ox+(x-minX)*cell+.5, oy+(y-minY)*cell+.5, cell-1, cell-1);
      }
    }

    /** ───── 루프 ───── */
    let last = 0;
    let dropTimer = 0;

    function tick(ts: number) {
      const dt = Math.min(50, ts - last);
      last = ts;

      if (!paused && !gameOver) {
        dropTimer += dt;
        const interval = fallIntervalMs(level);
        while (dropTimer >= interval) {
          if (!move(0, 1)) lock();
          dropTimer -= interval;
        }
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    // 초기화
    spawn();
    let raf = requestAnimationFrame(tick);

    // 안내 텍스트
    if (infoRef.current) {
      infoRef.current.innerHTML =
        `<b>조작</b> — ←/→ 이동, ↓ 소프트드랍(+1점), Space 하드드랍(+2점/칸), Z/Up/X 회전, C 홀드, P 일시정지, R 재시작`;
    }

    // 정리
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);


  const width = MARGIN*2 + PANEL_W*2 + COLS*CELL;
  const height = MARGIN*2 + ROWS*CELL;

  // 상단 정보 (게임 상태)
  const topInfo = (
    <div style={{ textAlign: 'center' }}>
      <div 
        ref={scoreRef} 
        style={{
          ...typography.gameStatus,
          fontSize: 16,
          marginBottom: spacing.xs
        }}
      >
        점수: 0 | 레벨: 0 | 라인: 0
      </div>
      <div style={{
        fontSize: 14,
        color: '#bcbcbe'
      }}>
        블록을 완전한 줄로 만들어 제거하세요!
      </div>
    </div>
  );

  // 하단 정보 (조작법)
  const bottomInfo = (
    <div style={{ textAlign: 'center' }}>
      <div 
        ref={infoRef}
        style={{ 
          fontSize: 14, 
          color: "#bcbcbe", 
          marginBottom: spacing.xs
        }}
      >
        조작 — ←/→ 이동, ↑ 소프트드롭(+1점), Space 하드드롭(+2점/칸), Z/Up/X 회전, C 홀드, P 일시정지, R 재시작
      </div>
    </div>
  );

  return (
    <GameLayout 
      title="🧱 테트리스"
      topInfo={topInfo}
      bottomInfo={bottomInfo}
    >
      <GameCanvas
        ref={canvasRef}
        width={width}
        height={height}
        gameTitle="Tetris"
        style={{
          background: "radial-gradient(1200px 600px at 50% 50%, #15161a 0%, #0f0f12 70%)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
          borderRadius: 14,
          touchAction: "none"
        }}
        aria-label="Tetris"
      />
    </GameLayout>
  );
}
