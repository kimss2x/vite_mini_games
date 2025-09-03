import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

type Grid = boolean[][];

const GRID_SIZE = 5 as const;
const CELL_SIZE = 60;
const GAP = 2;

// 상하좌우 (고정 상수)
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const createGrid = (fill = false): Grid =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(fill));

const cloneGrid = (g: Grid): Grid => g.map((row) => row.slice());

const inBounds = (r: number, c: number) =>
  r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;

const applyMove = (g: Grid, row: number, col: number): Grid => {
  const ng = cloneGrid(g);
  // 본인
  ng[row][col] = !ng[row][col];
  // 상하좌우
  for (const [dr, dc] of DIRECTIONS) {
    const nr = row + dr;
    const nc = col + dc;
    if (inBounds(nr, nc)) ng[nr][nc] = !ng[nr][nc];
  }
  return ng;
};

const isCleared = (g: Grid) => g.every((row) => row.every((cell) => !cell));

// 합법적 수를 랜덤으로 적용해서 항상 풀 수 있는 초기 퍼즐 생성
const generatePuzzle = (minMoves = 10, maxMoves = 25): Grid => {
  let g = createGrid(false);
  const n = Math.floor(Math.random() * (maxMoves - minMoves + 1)) + minMoves;
  for (let i = 0; i < n; i++) {
    const r = Math.floor(Math.random() * GRID_SIZE);
    const c = Math.floor(Math.random() * GRID_SIZE);
    g = applyMove(g, r, c);
  }
  // 너무 쉽게(전부 꺼짐) 나오는 엣지케이스 방지
  if (isCleared(g)) {
    const r = Math.floor(Math.random() * GRID_SIZE);
    const c = Math.floor(Math.random() * GRID_SIZE);
    g = applyMove(g, r, c);
  }
  return g;
};

const LightsOutCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [grid, setGrid] = useState<Grid>(() => generatePuzzle());
  const [isWon, setIsWon] = useState(false);
  const [moves, setMoves] = useState(0);

  // 렌더링용 픽셀/스타일 크기
  const logicalWidth = GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * GAP;
  const logicalHeight = GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * GAP;

  const startNewGame = useCallback(() => {
    const g = generatePuzzle();
    setGrid(g);
    setIsWon(false);
    setMoves(0);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (isWon) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 셀 인덱스 계산
      const col = Math.floor(x / (CELL_SIZE + GAP));
      const row = Math.floor(y / (CELL_SIZE + GAP));

      // GAP 영역 클릭 무시
      const inCellX = x % (CELL_SIZE + GAP);
      const inCellY = y % (CELL_SIZE + GAP);
      if (inCellX >= CELL_SIZE || inCellY >= CELL_SIZE) return;

      if (!inBounds(row, col)) return;

      setGrid((prev) => {
        const next = applyMove(prev, row, col);
        setIsWon(isCleared(next)); // 토글 직후의 최신 상태로 승리 판정
        return next;
      });
      setMoves((m) => m + 1);
    },
    [isWon]
  );

  // 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 고DPI 스케일링
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.floor(logicalWidth * dpr);
    const targetH = Math.floor(logicalHeight * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 논리 공간으로 그리기

    // 배경
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // 그리드
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = c * (CELL_SIZE + GAP);
        const y = r * (CELL_SIZE + GAP);
        ctx.fillStyle = grid[r][c] ? '#ffd700' : '#333333';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
      }
    }
  }, [grid, logicalWidth, logicalHeight]);

  const gameStats = <div>움직임: {moves}</div>;
  const gameStatus = isWon ? `축하합니다! ${moves}번 만에 클리어!` : undefined;
  const instructions =
    '모든 불을 끄세요! 셀을 누르면 본인과 상하좌우가 토글됩니다.';
  const actionButtons = (
    <GameButton onClick={startNewGame} variant="primary" size="large">
      새 게임
    </GameButton>
  );

  return (
    <GameManager
      title="Lights Out"
      gameIcon="💡"
      gameStats={gameStats}
      gameStatus={gameStatus}
      instructions={instructions}
      actionButtons={actionButtons}
    >
      <GameCanvas
        ref={canvasRef}
        width={logicalWidth}
        height={logicalHeight}
        onPointerDown={handlePointerDown}
        gameTitle="Lights Out"
        style={{
          border: '2px solid #ccc',
          cursor: 'pointer',
          touchAction: 'none',
          userSelect: 'none',
        }}
      />
    </GameManager>
  );
};

export default LightsOutCanvas;

