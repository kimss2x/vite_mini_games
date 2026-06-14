import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';

// ====== 기본 상수 ======
const CELL = 20;

// ====== LEVELS (1~6) ======
const LEVEL1 = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.#####.##.#####.######',
  '######.#####.##.#####.######',
  '######.##..........##.######',
  '######.##.###  ###.##.######',
  '######.##.#      #.##.######',
  '..........#      #..........',
  '######.##.#      #.##.######',
  '######.##.########.##.######',
  '######.##..........##.######',
  '######.##.########.##.######',
  '######.##.########.##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##................##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################',
];

const LEVEL2 = [
  '############################',
  '#......##..........##......#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#o........................o#',
  '###.##.#####.##.#####.##.###',
  '###.##.#####.##.#####.##.###',
  '###.##.#####.##.#####.##.###',
  '....##.......##.......##....',
  '###.#####.########.#####.###',
  '###.#####.########.#####.###',
  '###......................###',
  '###.#####.###  ###.#####.###',
  '###.#####.#      #.#####.###',
  '###.##....#      #....##.###',
  '###.##.##.#      #.##.##.###',
  '###.##.##.########.##.##.###',
  '.......##..........##.......',
  '###.########.##.########.###',
  '###.########.##.########.###',
  '###..........##..........###',
  '###.#####.########.#####.###',
  '###.#####.########.#####.###',
  '#..........................#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o####.##....##....##.####o#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#..........................#',
  '############################',
];

const LEVEL3 = [
  '############################',
  '.......##..........##.......',
  '######.##.########.##.######',
  '######.##.########.##.######',
  '#o...........##...........o#',
  '#.#######.##.##.##.#######.#',
  '#.#######.##.##.##.#######.#',
  '#.##......##.##.##......##.#',
  '#.##.####.##....##.####.##.#',
  '#.##.####.########.####.##.#',
  '#......##.########.##......#',
  '######.##..........##.######',
  '######.##.###  ###.##.######',
  '#......##.#      #.##......#',
  '#.####.##.#      #.##.####.#',
  '#.####....#      #....####.#',
  '#...##.##.########.##.##...#',
  '###.##.##..........##.##.###',
  '###.##.####.####.####.##.###',
  '###.##.####.####.####.##.###',
  '###.........####.........###',
  '###.#######.####.#######.###',
  '###.#######.####.#######.###',
  '.......##..........##.......',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#o..##.......##.......##..o#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '############################',
];

const LEVEL4 = [
  '############################',
  '#.........##....##.........#',
  '#.#######.##.##.##.#######.#',
  '#.#######.##.##.##.#######.#',
  '#.##.........##.........##.#',
  '#.##.##.####.##.####.##.##.#',
  '#o...##.####.##.####.##...o#',
  '####.##.####.##.####.##.####',
  '####.##..............##.####',
  '.....####.########.####.....',
  '#.##.####.########.####.##.#',
  '#.##....................##.#',
  '#.####.##.###  ###.##.####.#',
  '#.####.##.#      #.##.####.#',
  '#......##.#      #.##......#',
  '#.##.####.#      #.####.##.#',
  '#.##.####.########.####.##.#',
  '#.##....................##.#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#......##....##....##......#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#...##................##...#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o.....##....##....##.....o#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##..........##......#',
  '############################',
];

const LEVEL5 = [
  '############################',
  '#..........................#',
  '#.##.####.########.####.##.#',
  '#.##.####.########.####.##.#',
  '#.##.####.##....##.####.##.#',
  '#.##......##.##.##......##.#',
  '#.####.##.##.##.##.##.####.#',
  '#.####.##.##.##.##.##.####.#',
  '#o.....##....##....##.....o#',
  '###.########.##.########.###',
  '###.########.##.########.###',
  '###....##..........##....###',
  '###.##.##.###  ###.##.##.###',
  '....##.##.#      #.##.##....',
  '######....#      #....######',
  '######.##.#      #.##.######',
  '....##.##.########.##.##....',
  '###....##..........##....###',
  '###.##.#####.##.#####.##.###',
  '###.##.#####.##.#####.##.###',
  '###.##.......##.......##.###',
  '###.#####.##.##.##.#####.###',
  '###.#####.##.##.##.#####.###',
  '#o........##....##........o#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#.##...##..........##...##.#',
  '#.##.#######.##.#######.##.#',
  '#.##.#######.##.#######.##.#',
  '#............##............#',
  '############################',
];

const LEVEL6 = [
  '############################',
  '#....##....##..##....##....#',
  '#.##.##.##.##..##.##.##.##.#',
  '#o##......##....##......##o#',
  '#.##.####.##.##.##.####.##.#',
  '#............##............#',
  '###.##.####.####.####.##.###',
  '#......##....##....##......#',
  '######.##....##....##.######',
  '######.#####.##.#####.######',
  '######.#####.##.#####.######',
  '######.##..........##.######',
  '######.##.###  ###.##.######',
  '######.##.#      #.##.######',
  '..........#      #..........',
  '######.##.#      #.##.######',
  '######.##.########.##.######',
  '######.##..........##.######',
  '######.##.########.##.######',
  '######.##.########.##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##................##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################',
];
const LEVELS = [LEVEL1, LEVEL2, LEVEL3, LEVEL4, LEVEL5, LEVEL6];

const ROWS = LEVEL1.length;
const COLS = LEVEL1[0].length;

// ====== 타입/유틸 ======
type GhostState = 'normal' | 'eyes';
interface Ghost {
  x: number; y: number; dx: number; dy: number;
  color: string; release: number;
  state?: GhostState;
}

const directions = [
  { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
  { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
];

const dirKey = (dx: number, dy: number) =>
  dx === -1 ? 'left' : dx === 1 ? 'right' : dy === -1 ? 'up' : dy === 1 ? 'down' : 'right';

const dirVec = (dx: number, dy: number) => {
  if (dx === 1) return { x: 1, y: 0 };
  if (dx === -1) return { x: -1, y: 0 };
  if (dy === 1) return { x: 0, y: 1 };
  if (dy === -1) return { x: 0, y: -1 };
  return { x: 1, y: 0 };
};

const wrapX = (x: number) => (x < 0 ? COLS - 1 : x >= COLS ? 0 : x);
const wrapY = (y: number) => (y < 0 ? ROWS - 1 : y >= ROWS ? 0 : y);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// 유령 하우스
const HOUSE = { x: 13, y: 11 };

// 전역 맵 참조(chooseDirToward에서 사용)
const mapRef = { current: LEVELS[0].map(r => r.split('')) } as React.MutableRefObject<string[][]>;

// 집까지 단순 탐욕 경로
const chooseDirToward = (x:number, y:number, tx:number, ty:number) => {
  const cand = directions
    .map(d => ({...d, nx: wrapX(x + d.dx), ny: wrapY(y + d.dy)}))
    .filter(c => mapRef.current[c.ny][c.nx] !== '#')
    .sort((a,b) => (Math.abs(a.nx - tx) + Math.abs(a.ny - ty)) - (Math.abs(b.nx - tx) + Math.abs(b.ny - ty)));
  return cand[0] ?? { dx: 0, dy: 0 };
};

// 유령 바디+발(3개 반원) + 눈(보통/파워 X) + 걷는 파동
function drawGhostPretty(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, cell: number, color: string,
  opt: { t: number; frightened: boolean; dx: number; dy: number }
) {
  const r = cell / 2 - 2;
  const bodyH = r * 1.25;
  const footY = y + bodyH * 0.45;
  const headY = y - bodyH * 0.3;
  const bumps = 3;
  const bumpR = r * 0.35;
  const amp = r * 0.08;
  const speed = 6;
  const phase = opt.t * speed;

  // 몸체 경로
  ctx.beginPath();
  ctx.arc(x, headY, r, Math.PI, 0, false); // 머리 반원
  ctx.lineTo(x + r, footY);
  for (let i = 0; i < bumps; i++) {
    const cx = x + (i - (bumps - 1) / 2) * (2 * r / bumps);
    const wobble = amp * Math.sin(phase + i * 0.9);
    ctx.arc(cx, footY + wobble, bumpR, 0, Math.PI, true);
  }
  ctx.lineTo(x - r, footY);
  ctx.closePath();

  ctx.fillStyle = opt.frightened ? '#0033cc' : color;
  ctx.fill();

  // 눈
  const eyeR = Math.max(2, cell * 0.14);
  const pupilR = eyeR * 0.45;
  const eyeOffX = r * 0.42;
  const eyeOffY = -r * 0.15;
  const eL = { x: x - eyeOffX, y: y + eyeOffY };
  const eR = { x: x + eyeOffX, y: y + eyeOffY };

  if (!opt.frightened) {
    // 흰자 + 동공(방향쪽으로 치우침)
    const v = dirVec(opt.dx, opt.dy);
    const pxOff = pupilR * 0.9 * v.x;
    const pyOff = pupilR * 0.9 * v.y;
    const drawEye = (cx: number, cy: number) => {
      ctx.beginPath(); ctx.arc(cx, cy, eyeR, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx + pxOff, cy + pyOff, pupilR, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
    };
    drawEye(eL.x, eL.y);
    drawEye(eR.x, eR.y);
  } else {
    // X 눈
    const drawX = (cx: number, cy: number) => {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(2, cell * 0.08);
      const s = eyeR * 1.2;
      ctx.beginPath(); ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s); ctx.stroke();
    };
    drawX(eL.x, eL.y);
    drawX(eR.x, eR.y);
  }
}

// ====== 난이도 커브 ======
const tickMsForLevel = (lv: number) => Math.max(120, 220 - 20 * lv);
const frightenedDurForLevel = (lv: number) => Math.max(16, 40 - 4 * lv);
const ghostReleasesForLevel = (lv: number) => [
  0, Math.max(0, 10 - 2 * lv), Math.max(0, 20 - 2 * lv), Math.max(0, 30 - 2 * lv),
];

const PacmanCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ====== 상태 ======
  const [level, setLevel] = useState(0);
  const levelIndexRef = useRef(0);

  const pacmanRef = useRef({ x: 13, y: 23, dx: 0, dy: 0 });
  const pacmanPrevRef = useRef({ x: 13, y: 23 });

  const ghostsRef = useRef<Ghost[]>([
    { x: 13, y: 11, dx: 0, dy: 0, color: '#ff4d4d', release: 0, state: 'normal' },
    { x: 13, y: 11, dx: 0, dy: 0, color: '#ffb8ff', release: 10, state: 'normal' },
    { x: 13, y: 11, dx: 0, dy: 0, color: '#00ffff', release: 20, state: 'normal' },
    { x: 13, y: 11, dx: 0, dy: 0, color: '#ffa500', release: 30, state: 'normal' },
  ]);
  const ghostsPrevRef = useRef<{x:number;y:number}[]>(
    [{x:13,y:11},{x:13,y:11},{x:13,y:11},{x:13,y:11}]
  );

  const frightenedRef = useRef(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [state, setState] = useState<'playing' | 'over' | 'clear'>('playing');
  const [tickMs, setTickMs] = useState(tickMsForLevel(0));

  // 애니메이션
  const mouthMaxRef = useRef(Math.PI / 4);
  const mouthPhaseRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const animTRef = useRef(1);
  const lastStepAtRef = useRef(performance.now());

  // ====== 레벨 로딩 ======
  const loadLevel = useCallback((lv: number) => {
    levelIndexRef.current = lv;
    setLevel(lv);
    mapRef.current = LEVELS[lv].map(r => r.split(''));
    pacmanRef.current = { x: 13, y: 23, dx: 0, dy: 0 };
    pacmanPrevRef.current = { x: 13, y: 23 };

    const releases = ghostReleasesForLevel(lv);
    ghostsRef.current = [
      { x: 13, y: 11, dx: 0, dy: 0, color: '#ff4d4d', release: releases[0], state: 'normal' },
      { x: 13, y: 11, dx: 0, dy: 0, color: '#ffb8ff', release: releases[1], state: 'normal' },
      { x: 13, y: 11, dx: 0, dy: 0, color: '#00ffff', release: releases[2], state: 'normal' },
      { x: 13, y: 11, dx: 0, dy: 0, color: '#ffa500', release: releases[3], state: 'normal' },
    ];
    ghostsPrevRef.current = ghostsRef.current.map(g => ({ x: g.x, y: g.y }));

    frightenedRef.current = 0;
    mouthPhaseRef.current = 0;
    animTRef.current = 1;
    lastStepAtRef.current = performance.now();
    setState('playing');
    setTickMs(tickMsForLevel(lv));
  }, []);

  const resetCurrentLevel = useCallback(() => loadLevel(levelIndexRef.current), [loadLevel]);
  const resetAll = useCallback(() => { setScore(0); setLives(3); loadLevel(0); }, [loadLevel]);
  const advanceLevel = useCallback(() => {
    const next = (levelIndexRef.current + 1) % LEVELS.length;
    loadLevel(next);
  }, [loadLevel]);

  // ====== 그리기 ======
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

    // 맵
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = mapRef.current[y][x];
        if (cell === '#') {
          ctx.fillStyle = '#0033cc';
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        } else if (cell === '.') {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(x * CELL + CELL/2, y * CELL + CELL/2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 'o') {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(x * CELL + CELL/2, y * CELL + CELL/2, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // === 팩맨(보간 위치) ===
    const pPrev = pacmanPrevRef.current;
    const pCurr = pacmanRef.current;
    const px = lerp(pPrev.x, pCurr.x, animTRef.current) * CELL + CELL / 2;
    const py = lerp(pPrev.y, pCurr.y, animTRef.current) * CELL + CELL / 2;

    // 입 모션
    const moving = pCurr.dx !== 0 || pCurr.dy !== 0;
    const mouth = moving
      ? mouthMaxRef.current * 0.5 * (1 - Math.cos(2 * Math.PI * mouthPhaseRef.current))
      : 0;

    // 방향 변환(오른쪽 기준, 위/아래 rotate, 왼쪽 scale)
    const facing = dirKey(pCurr.dx, pCurr.dy);
    const r = CELL / 2 - 2;

    ctx.save();
    ctx.translate(px, py);
    if (facing === 'up') ctx.rotate(-Math.PI / 2);
    else if (facing === 'down') ctx.rotate(Math.PI / 2);
    else if (facing === 'left') ctx.scale(-1, 1);

    // 팩맨 몸체(입 잘린 원)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, mouth, Math.PI * 2 - mouth, false);
    ctx.closePath();
    ctx.fillStyle = 'yellow';
    ctx.fill();

    // 눈
    ctx.beginPath();
    ctx.arc(r * 0.35, -r * 0.45, r * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // === 유령(보간 위치 + 예쁜 모양/파동/눈, eyes면 두 눈만) ===
    const tSec = performance.now() / 1000;
    ghostsRef.current.forEach((g, i) => {
      const gPrev = ghostsPrevRef.current[i];
      const gx = lerp(gPrev.x, g.x, animTRef.current) * CELL + CELL / 2;
      const gy = lerp(gPrev.y, g.y, animTRef.current) * CELL + CELL / 2;

      if (g.state === 'eyes') {
        // 두 눈만
        const R = CELL / 2 - 4;
        const eyeR = Math.max(2, CELL * 0.14);
        const off = R * 0.35;
        const drawEye = (ex: number) => {
          ctx.beginPath(); ctx.arc(gx + ex, gy - R * 0.2, eyeR, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
          ctx.beginPath(); ctx.arc(gx + ex, gy - R * 0.2, eyeR * 0.45, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
        };
        drawEye(-off * 0.6);
        drawEye(+off * 0.6);
      } else {
        drawGhostPretty(ctx, gx, gy, CELL, g.color, {
          t: tSec,
          frightened: frightenedRef.current > 0,
          dx: g.dx, dy: g.dy,
        });
      }
    });

    // 오버레이
    if (state !== 'playing') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      if (state === 'over') {
        ctx.fillText('GAME OVER', (COLS*CELL)/2, (ROWS*CELL)/2 - 10);
        ctx.font = '16px sans-serif';
        ctx.fillText('Shift+R: 전체 리셋  /  R: 현재 레벨 재시작', (COLS*CELL)/2, (ROWS*CELL)/2 + 20);
      } else if (state === 'clear') {
        ctx.fillText('LEVEL CLEAR!', (COLS*CELL)/2, (ROWS*CELL)/2 - 10);
        ctx.font = '16px sans-serif';
        ctx.fillText('다음 레벨로 이동 중…', (COLS*CELL)/2, (ROWS*CELL)/2 + 20);
      }
    }
  }, [state]);

  // ====== 게임 틱 ======
  const step = useCallback(() => {
    if (state !== 'playing') return;

    // 보간용 이전 좌표 저장
    pacmanPrevRef.current = { x: pacmanRef.current.x, y: pacmanRef.current.y };
    ghostsPrevRef.current = ghostsRef.current.map(g => ({ x: g.x, y: g.y }));

    // Pac-Man 이동
    const nx = wrapX(pacmanRef.current.x + pacmanRef.current.dx);
    const ny = wrapY(pacmanRef.current.y + pacmanRef.current.dy);
    if (mapRef.current[ny][nx] !== '#') {
      pacmanRef.current.x = nx;
      pacmanRef.current.y = ny;
      const cell = mapRef.current[ny][nx];
      if (cell === '.') { mapRef.current[ny][nx] = ' '; setScore(s => s + 10); }
      else if (cell === 'o') { mapRef.current[ny][nx] = ' '; frightenedRef.current = frightenedDurForLevel(levelIndexRef.current); setScore(s => s + 50); }
    }

    if (frightenedRef.current > 0) frightenedRef.current--;

    // 유령 이동
    ghostsRef.current.forEach(g => {
      if (g.release > 0) {
        g.release--;
        if (g.release === 0) { g.dx = 0; g.dy = -1; }
        return;
      }

      if (g.state === 'eyes') {
        // 집으로 귀환
        const tx = wrapX(g.x + g.dx);
        const ty = wrapY(g.y + g.dy);
        if (mapRef.current[ty][tx] === '#') {
          const dir = chooseDirToward(g.x, g.y, HOUSE.x, HOUSE.y);
          g.dx = dir.dx; g.dy = dir.dy;
        }
        g.x = wrapX(g.x + g.dx);
        g.y = wrapY(g.y + g.dy);
        if (g.x === HOUSE.x && g.y === HOUSE.y) {
          g.state = 'normal';
          g.dx = 0; g.dy = 0;
          g.release = 20; // 잠깐 대기 후 재출소
        }
        return;
      }

      // normal 이동(막히면 가능한 방향 중 랜덤)
      const tx = wrapX(g.x + g.dx);
      const ty = wrapY(g.y + g.dy);
      const stuck = mapRef.current[ty][tx] === '#';
      const idle = g.dx === 0 && g.dy === 0;
      if (stuck || idle) {
        const opts = directions.filter(d => mapRef.current[wrapY(g.y + d.dy)][wrapX(g.x + d.dx)] !== '#');
        const r = opts[Math.floor(Math.random() * opts.length)];
        g.dx = r.dx; g.dy = r.dy;
      }
      g.x = wrapX(g.x + g.dx);
      g.y = wrapY(g.y + g.dy);
    });

    // 충돌
    ghostsRef.current.forEach(g => {
      if (g.x === pacmanRef.current.x && g.y === pacmanRef.current.y) {
        if (frightenedRef.current > 0 && g.state !== 'eyes') {
          setScore(s => s + 200);
          // eyes 전환
          g.state = 'eyes';
          const dir = chooseDirToward(g.x, g.y, HOUSE.x, HOUSE.y);
          g.dx = dir.dx; g.dy = dir.dy;
        } else if (g.state !== 'eyes') {
          setLives(l => {
            const nl = l - 1;
            if (nl <= 0) setState('over');
            return nl;
          });
          // 리셋(현재 레벨 유지)
          const rel = ghostReleasesForLevel(levelIndexRef.current);
          pacmanRef.current = { x: 13, y: 23, dx: 0, dy: 0 };
          frightenedRef.current = 0;
          mouthPhaseRef.current = 0;
          ghostsRef.current.forEach((gg, i) => {
            gg.x = 13; gg.y = 11; gg.dx = 0; gg.dy = 0; gg.release = rel[i]; gg.state = 'normal';
          });
        }
      }
    });

    // 클리어
    const remaining = mapRef.current.flat().some(c => c === '.' || c === 'o');
    if (!remaining) {
      setState('clear');
      setTimeout(() => { advanceLevel(); }, 400);
    }

    // 다음 rAF 보간을 위해 초기화
    animTRef.current = 0;
    lastStepAtRef.current = performance.now();

    draw();
  }, [advanceLevel, draw, state]);

  // ====== 초기화 & 타이머 ======
  useEffect(() => {
    const cvs = canvasRef.current; if (!cvs) return;
    cvs.width = COLS * CELL; cvs.height = ROWS * CELL;
    draw();
  }, [draw]);

  useEffect(() => {
    const id = setInterval(step, tickMs);
    return () => clearInterval(id);
  }, [step, tickMs, level]);

  // ====== rAF (부드러운 보간/입 모션) ======
  useEffect(() => {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now;

      // 입 모션
      const moving = pacmanRef.current.dx !== 0 || pacmanRef.current.dy !== 0;
      mouthPhaseRef.current = moving ? (mouthPhaseRef.current + dt * 3) % 1e6 : 0;

      // 보간 진행도(0→1)
      animTRef.current = Math.min(1, (now - lastStepAtRef.current) / (tickMs));

      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw, tickMs]);

  // ====== 입력 ======
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright','r','n'].includes(key)) {
        e.preventDefault(); e.stopPropagation();
      }
      if (e.shiftKey && key === 'r') { setScore(0); setLives(3); loadLevel(0); return; }
      if (key === 'r') { resetCurrentLevel(); return; }
      if (key === 'n') { advanceLevel(); return; }
      if (state !== 'playing') return;

      if (key === 'w' || key === 'arrowup') { pacmanRef.current.dx = 0; pacmanRef.current.dy = -1; }
      else if (key === 's' || key === 'arrowdown') { pacmanRef.current.dx = 0; pacmanRef.current.dy = 1; }
      else if (key === 'a' || key === 'arrowleft') { pacmanRef.current.dx = -1; pacmanRef.current.dy = 0; }
      else if (key === 'd' || key === 'arrowright') { pacmanRef.current.dx = 1; pacmanRef.current.dy = 0; }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [advanceLevel, loadLevel, resetCurrentLevel, state]);

  return (
    <GameLayout
      gameStatus={state === 'clear' ? '클리어!' : state === 'over' ? '게임 오버' : undefined}
      title="🟡 Pac-Man"
      topInfo={
        <div>
          Level: {level + 1}/{LEVELS.length} &nbsp;|&nbsp; Score: {score} &nbsp;|&nbsp; Lives: {lives} &nbsp;|&nbsp; Tick: {tickMs}ms
        </div>
      }
      bottomInfo={
        <div>
          WASD/Arrow 이동 • R 현재 레벨 재시작 • Shift+R 전체 리셋 • N 다음 레벨(디버그)
        </div>
      }
    >
      <GameCanvas
        ref={canvasRef}
        gameTitle="Pac-Man"
        width={COLS * CELL}
        height={ROWS * CELL}
      />
    </GameLayout>
  );
};

export default PacmanCanvas;
