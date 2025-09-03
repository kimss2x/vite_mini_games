import React, { useCallback, useEffect, useRef, useState } from "react";
import GameLayout from "./components/GameLayout";
import GameCanvas from "./components/GameCanvas";
import GameButton from "./components/GameButton";
import { spacing, typography } from "./theme/gameTheme";

/**
 * SokobanCanvas.tsx
 * - DPR(레티나) 대응
 * - 맵 크기에 맞춘 tileSize 자동 계산 + 중앙 정렬
 * - TARGET/PLAYER_ON_TARGET 남아 있으면 미완으로 보는 승리 판정
 * - setTimeout 클로저 안전(next level 인덱스 고정)
 * - 레벨 유효성 검사(플레이어=1, 박스=타깃)
 * - Undo/Redo 지원
 */

/* ====== 기본 설정 ====== */
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

enum TileType {
  EMPTY = 0,
  WALL = 1,
  TARGET = 2,
  BOX = 3,
  PLAYER = 4,
  BOX_ON_TARGET = 5,
  PLAYER_ON_TARGET = 6,
}

/* ====== 레벨 데이터: ' ' 바닥, '#' 벽, '.' 목표, '*' 박스, '@' 플레이어, '$' 목표 위 박스, '+' 목표 위 플레이어 ====== */
const LEVELS: string[][] = [
  // 레벨 1 - 튜토리얼 (1박스 1타깃)
  [
    "########",
    "#      #",
    "#   .  #",
    "#   *  #",
    "#   @  #",
    "#      #",
    "#      #",
    "########",
  ],
  // 레벨 2 - 기본 푸시 + 벽
  [
    "########",
    "#   #  #",
    "# . #  #",
    "# *    #",
    "#  @   #",
    "#      #",
    "#      #",
    "########",
  ],
  // 레벨 3 - 2박스 2타깃
  [
    "#########",
    "#       #",
    "# . .   #",
    "#  **   #",
    "#   @   #",
    "#       #",
    "#       #",
    "#       #",
    "#########",
  ],
  // 레벨 4 - 코너 유의
  [
    "##########",
    "#   ##   #",
    "# .  # . #",
    "# ** #   #",
    "#  @     #",
    "#        #",
    "##########",
  ],
  // 레벨 5 - 교정(박스=4, 목표=4, 플레이어=1)
  [
    "############",
    "#          #",
    "#  ##  ##  #",
    "#  *  *    #",
    "#  ##  ##  #",
    "#     @    #",
    "#    **    #",
    "#   ....   #",
    "############",
  ],
];

/* ====== 유틸 ====== */
const deepCopyMap = (map: TileType[][]) => map.map((row) => [...row]);

const isWalkable = (t: TileType) => t === TileType.EMPTY || t === TileType.TARGET;
const isBox = (t: TileType) => t === TileType.BOX || t === TileType.BOX_ON_TARGET;

const toEmptyFrom = (t: TileType): TileType => {
  // 해당 칸에서 플레이어나 박스가 떠났을 때 바닥/목표로 되돌려줌
  if (t === TileType.PLAYER_ON_TARGET) return TileType.TARGET;
  if (t === TileType.BOX_ON_TARGET) return TileType.TARGET;
  if (t === TileType.PLAYER || t === TileType.BOX) return TileType.EMPTY;
  return t;
};

const toPlayerOn = (t: TileType): TileType =>
  t === TileType.TARGET ? TileType.PLAYER_ON_TARGET : TileType.PLAYER;

const toBoxOn = (t: TileType): TileType =>
  t === TileType.TARGET ? TileType.BOX_ON_TARGET : TileType.BOX;

/* ====== 레벨 파서 / 검증 ====== */
const validateLevel = (level: string[]) => {
  let boxes = 0,
    targets = 0,
    players = 0;
  for (const row of level) {
    for (const ch of row) {
      if (ch === "*") boxes++;
      if (ch === "$") {
        boxes++;
        targets++;
      }
      if (ch === ".") targets++;
      if (ch === "+") {
        players++;
        targets++;
      }
      if (ch === "@") players++;
    }
  }
  if (players !== 1) {
    console.warn(`[Sokoban] Player count ${players} (must be 1)`);
  }
  if (boxes !== targets) {
    console.warn(`[Sokoban] Boxes ${boxes} vs Targets ${targets} mismatch`);
  }
};

const parseLevel = (level: string[]) => {
  const rows = level.length;
  const cols = level[0]?.length ?? 0;
  const map: TileType[][] = Array.from({ length: rows }, () =>
    Array<TileType>(cols).fill(TileType.EMPTY)
  );

  let playerX = 0;
  let playerY = 0;

  for (let y = 0; y < rows; y++) {
    const line = level[y];
    for (let x = 0; x < cols; x++) {
      const ch = line[x] ?? " ";
      switch (ch) {
        case "#":
          map[y][x] = TileType.WALL;
          break;
        case ".":
          map[y][x] = TileType.TARGET;
          break;
        case "*":
          map[y][x] = TileType.BOX;
          break;
        case "@":
          map[y][x] = TileType.PLAYER;
          playerX = x;
          playerY = y;
          break;
        case "$":
          map[y][x] = TileType.BOX_ON_TARGET;
          break;
        case "+":
          map[y][x] = TileType.PLAYER_ON_TARGET;
          playerX = x;
          playerY = y;
          break;
        default:
          map[y][x] = TileType.EMPTY;
          break;
      }
    }
  }

  return { map, playerX, playerY };
};

/* ====== 상태 타입 ====== */
interface GameState {
  level: number; // 0-based
  moves: number;
  isCompleted: boolean;
}

interface HistoryState {
  map: TileType[][];
  playerX: number;
  playerY: number;
}

/* ====== 메인 컴포넌트 ====== */
const SokobanCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [map, setMap] = useState<TileType[][]>([]);
  const [playerX, setPlayerX] = useState(0);
  const [playerY, setPlayerY] = useState(0);

  const [gameState, setGameState] = useState<GameState>({
    level: 0,
    moves: 0,
    isCompleted: false,
  });

  const undoStack = useRef<HistoryState[]>([]);
  const redoStack = useRef<HistoryState[]>([]);

  /* ====== 초기화 ====== */
  const initLevel = useCallback(
    (levelIndex: number) => {
      if (levelIndex >= LEVELS.length) {
        setGameState((prev) => ({ ...prev, isCompleted: true }));
        return;
      }
      const raw = LEVELS[levelIndex];
      validateLevel(raw); // 유효성 체크

      const { map: newMap, playerX, playerY } = parseLevel(raw);
      undoStack.current = [];
      redoStack.current = [];
      setMap(newMap);
      setPlayerX(playerX);
      setPlayerY(playerY);
      setGameState({ level: levelIndex, moves: 0, isCompleted: false });
    },
    []
  );

  useEffect(() => {
    initLevel(0);
  }, [initLevel]);

  /* ====== 승리 판정: TARGET / PLAYER_ON_TARGET 남아 있으면 미완료 ====== */
  const checkWin = useCallback((currentMap: TileType[][]) => {
    for (let y = 0; y < currentMap.length; y++) {
      for (let x = 0; x < currentMap[y].length; x++) {
        const t = currentMap[y][x];
        if (t === TileType.TARGET || t === TileType.PLAYER_ON_TARGET) {
          return false;
        }
      }
    }
    return true;
  }, []);

  /* ====== 상태 저장(Undo용) ====== */
  const saveState = useCallback(() => {
    undoStack.current.push({
      map: deepCopyMap(map),
      playerX,
      playerY,
    });
    if (undoStack.current.length > 200) {
      // 메모리 폭주 방지
      undoStack.current.shift();
    }
    // 새로운 액션이 일어났으니 redo 스택은 비웁니다.
    redoStack.current = [];
  }, [map, playerX, playerY]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    // 현재 상태를 redo 스택에 저장
    redoStack.current.push({ map: deepCopyMap(map), playerX, playerY });
    setMap(prev.map);
    setPlayerX(prev.playerX);
    setPlayerY(prev.playerY);
    setGameState((s) => ({ ...s, moves: Math.max(0, s.moves - 1) }));
  }, [map, playerX, playerY]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    // 현재 상태를 undo 스택에 저장
    undoStack.current.push({ map: deepCopyMap(map), playerX, playerY });
    setMap(next.map);
    setPlayerX(next.playerX);
    setPlayerY(next.playerY);
    setGameState((s) => ({ ...s, moves: s.moves + 1 }));
  }, [map, playerX, playerY]);

  /* ====== 이동 ====== */
  const tryMove = useCallback(
    (dx: number, dy: number) => {
      if (gameState.isCompleted) return;

      const ny = playerY + dy;
      const nx = playerX + dx;

      if (ny < 0 || nx < 0 || ny >= map.length || nx >= map[0].length) return;

      const t1 = map[ny][nx];
      if (t1 === TileType.WALL) return;

      // 상태 저장(Undo)
      saveState();

      const newMap = deepCopyMap(map);
      let newPlayerX = playerX;
      let newPlayerY = playerY;

      const curr = newMap[playerY][playerX];

      if (isWalkable(t1)) {
        // 플레이어 이동만
        newMap[playerY][playerX] = toEmptyFrom(curr);
        newMap[ny][nx] = toPlayerOn(t1);
        newPlayerX = nx;
        newPlayerY = ny;
      } else if (isBox(t1)) {
        const bx = nx + dx;
        const by = ny + dy;
        if (by < 0 || bx < 0 || by >= newMap.length || bx >= newMap[0].length) {
          // 밀 수 없음
          undoStack.current.pop(); // 저장했던 상태 되돌림(무효 이동)
          return;
        }
        const t2 = newMap[by][bx];
        if (isWalkable(t2)) {
          // 박스 밀기 가능
          // 플레이어 자리 비우고
          newMap[playerY][playerX] = toEmptyFrom(curr);
          // 박스가 있던 자리로 플레이어 이동
          newMap[ny][nx] = toPlayerOn(toEmptyFrom(t1));
          // 박스는 그 다음 칸으로
          newMap[by][bx] = toBoxOn(t2);
          newPlayerX = nx;
          newPlayerY = ny;
        } else {
          // 박스 뒤가 비어있지 않음 → 무효 이동
          undoStack.current.pop();
          return;
        }
      } else {
        // 기타 타일(이동 불가)
        undoStack.current.pop();
        return;
      }

      setMap(newMap);
      setPlayerX(newPlayerX);
      setPlayerY(newPlayerY);
      setGameState((s) => ({ ...s, moves: s.moves + 1 }));

      // 승리 체크
      if (checkWin(newMap)) {
        const nextLevelIndex = gameState.level + 1; // 클로저 안전
        setTimeout(() => {
          if (nextLevelIndex < LEVELS.length) {
            initLevel(nextLevelIndex);
          } else {
            setGameState((prev) => ({ ...prev, isCompleted: true }));
          }
        }, 500);
      }
    },
    [gameState.isCompleted, gameState.level, map, playerX, playerY, initLevel, saveState, checkWin]
  );

  /* ====== 입력 ====== */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") {
        e.preventDefault();
        e.stopPropagation();
        return tryMove(0, -1);
      }
      if (k === "arrowdown" || k === "s") {
        e.preventDefault();
        e.stopPropagation();
        return tryMove(0, 1);
      }
      if (k === "arrowleft" || k === "a") {
        e.preventDefault();
        e.stopPropagation();
        return tryMove(-1, 0);
      }
      if (k === "arrowright" || k === "d") {
        e.preventDefault();
        e.stopPropagation();
        return tryMove(1, 0);
      }

      if (k === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        return undo(); // Ctrl/Cmd+Z
      }
      if ((k === "y" && (e.ctrlKey || e.metaKey)) || (k === "z" && e.shiftKey && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        e.stopPropagation();
        return redo(); // Ctrl/Cmd+Y 또는 Shift+Ctrl/Cmd+Z
      }

      if (k === "r") {
        e.preventDefault();
        e.stopPropagation();
        return initLevel(gameState.level); // 현재 레벨 리셋
      }
      if (k === "n") return initLevel(Math.min(gameState.level + 1, LEVELS.length - 1)); // 다음 레벨
      if (k === "p") return initLevel(Math.max(gameState.level - 1, 0)); // 이전 레벨
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler);
  }, [tryMove, undo, redo, initLevel, gameState.level]);

  /* ====== 렌더링 ====== */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // DPR 대응
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 배경
    ctx.fillStyle = "#2C2C2C";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!map.length) return;
    const rows = map.length;
    const cols = map[0].length;

    const tileSize = Math.floor(Math.min(CANVAS_WIDTH / cols, CANVAS_HEIGHT / rows));
    const mapWidth = cols * tileSize;
    const mapHeight = rows * tileSize;
    const offsetX = Math.floor((CANVAS_WIDTH - mapWidth) / 2);
    const offsetY = Math.floor((CANVAS_HEIGHT - mapHeight) / 2);

    // 미세 패딩/사이즈(최소값 보장)
    const p10 = Math.max(1, Math.floor(tileSize * 0.1));
    const p15 = Math.max(1, Math.floor(tileSize * 0.15));
    const p20 = Math.max(1, Math.floor(tileSize * 0.2));
    const s60 = Math.max(1, Math.ceil(tileSize * 0.6));
    const r = Math.max(2, Math.floor(tileSize / 3));

    // 타깃 그리기 함수
    const drawTarget = (x: number, y: number) => {
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(x + p20, y + p20, s60, s60);
    };

    // 타일 그리기
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = map[y][x];
        const drawX = offsetX + x * tileSize;
        const drawY = offsetY + y * tileSize;

        // 바닥
        ctx.fillStyle = "#3A3A3A";
        ctx.fillRect(drawX, drawY, tileSize, tileSize);

        // 경계선
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(drawX, drawY, tileSize, tileSize);

        // 타일별 렌더링
        switch (tile) {
          case TileType.WALL:
            ctx.fillStyle = "#654321";
            ctx.fillRect(drawX + 2, drawY + 2, tileSize - 4, tileSize - 4);
            break;

          case TileType.TARGET:
            drawTarget(drawX, drawY);
            break;

          case TileType.BOX:
            ctx.fillStyle = "#8B4513";
            ctx.fillRect(drawX + p10, drawY + p10, tileSize - 2 * p10, tileSize - 2 * p10);
            ctx.fillStyle = "#A0522D";
            ctx.fillRect(drawX + p15, drawY + p15, tileSize - 2 * p15, tileSize - 2 * p15);
            break;

          case TileType.PLAYER:
            ctx.fillStyle = "#4169E1";
            ctx.beginPath();
            ctx.arc(drawX + tileSize / 2, drawY + tileSize / 2, r, 0, Math.PI * 2);
            ctx.fill();
            break;

          case TileType.BOX_ON_TARGET:
            drawTarget(drawX, drawY);
            ctx.fillStyle = "#228B22";
            ctx.fillRect(drawX + p10, drawY + p10, tileSize - 2 * p10, tileSize - 2 * p10);
            ctx.fillStyle = "#32CD32";
            ctx.fillRect(drawX + p15, drawY + p15, tileSize - 2 * p15, tileSize - 2 * p15);
            break;

          case TileType.PLAYER_ON_TARGET:
            drawTarget(drawX, drawY);
            ctx.fillStyle = "#9370DB";
            ctx.beginPath();
            ctx.arc(drawX + tileSize / 2, drawY + tileSize / 2, r, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
      }
    }

    // 진행 정보
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Level: ${gameState.level + 1}/${LEVELS.length}`, 16, 12);
    ctx.fillText(`Moves: ${gameState.moves}`, 16, 34);

    // 완료 오버레이
    if (gameState.isCompleted) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 42px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎉 ALL LEVELS CLEARED!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("R: 현재 레벨 다시 시작  /  P: 이전  /  N: 다음", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 24);
    }
  }, [map, gameState]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getGameStatus = () => {
    if (gameState.isCompleted) return '모든 레벨 완료! 🎉';
    return `레벨 ${gameState.level + 1}/${LEVELS.length}`;
  };

  const getInstructions = () => {
    if (gameState.isCompleted) {
      return "축하합니다! 모든 레벨을 완료했습니다!";
    }
    return "방향키 또는 WASD로 이동하여 모든 상자를 노란 목표 칸으로 밀어넣으세요!";
  };

  /* ====== UI ====== */
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
        fontSize: 14,
        color: '#bcbcbe'
      }}>
        움직임: {gameState.moves}스
      </div>
    </div>
  );

  // 하단 정보 (조작법)
  const bottomInfo = (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>조작법:</strong> 방향키 또는 WASD로 이동하여 모든 상자를 노란 목표 칸으로 밀어넣으세요!
      </div>
      <div style={{ marginBottom: spacing.xs }}>
        <strong>단축키:</strong> R=리셋, P=이전레벨, N=다음레벨, Ctrl+Z=되돌리기, Ctrl+Y=다시하기
      </div>
      <div style={{ 
        display: 'flex', 
        gap: spacing.xs, 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        marginTop: spacing.sm
      }}>
        <GameButton
          onClick={() => initLevel(gameState.level)}
          variant="primary"
          size="normal"
        >
          리셋
        </GameButton>
        
        <GameButton
          onClick={() => initLevel(Math.max(0, gameState.level - 1))}
          variant="secondary"
          size="normal"
          disabled={gameState.level === 0}
        >
          이전 레벨
        </GameButton>
        
        <GameButton
          onClick={() => initLevel(Math.min(LEVELS.length - 1, gameState.level + 1))}
          variant="secondary"
          size="normal"
          disabled={gameState.level >= LEVELS.length - 1}
        >
          다음 레벨
        </GameButton>
        
        <GameButton
          onClick={undo}
          variant="secondary"
          size="normal"
        >
          Undo
        </GameButton>
        
        <GameButton
          onClick={redo}
          variant="secondary"
          size="normal"
        >
          Redo
        </GameButton>
      </div>
    </div>
  );

  return (
    <GameLayout 
      title="🚚 소코반"
      topInfo={topInfo}
      bottomInfo={bottomInfo}
    >
      <GameCanvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        gameTitle="Sokoban"
        style={{
          border: "2px solid rgba(255,255,255,0.1)"
        }}
      />
    </GameLayout>
  );
};

/* ====== 버튼 스타일 헬퍼 ====== */
const btnStyle = (bg: string): React.CSSProperties => ({
  padding: "10px 16px",
  fontSize: 14,
  background: bg,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
});

export default SokobanCanvas;
