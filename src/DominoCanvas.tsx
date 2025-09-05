import React, { useRef, useEffect, useCallback, useState } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import { layout } from './theme/gameTheme';

const WIDTH = layout.maxWidth;
const HEIGHT = 400;
const DOMINO_WIDTH = 20;
const DOMINO_HEIGHT = 80;
const GAP = 10;
const POSITIONS = 15; // includes start and goal indices
const START_INDEX = 0;
const GOAL_INDEX = POSITIONS - 1;
const MAX_PIECES = 10; // player placeable dominos

interface Domino {
  x: number;
  y: number;
  index: number;
  angle: number;
  falling: boolean;
  fallen: boolean;
  color: string;
}

const DominoCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dominosRef = useRef<Domino[]>([]);
  const animRef = useRef<number>();

  const [placements, setPlacements] = useState<Set<number>>(new Set());
  const [remaining, setRemaining] = useState(MAX_PIECES);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [goalHit, setGoalHit] = useState(false);

  const startX = (WIDTH - (POSITIONS * DOMINO_WIDTH + (POSITIONS - 1) * GAP)) / 2;
  const slotX = (i: number) => startX + i * (DOMINO_WIDTH + GAP);
  const groundY = HEIGHT - DOMINO_HEIGHT;

  const reset = useCallback(() => {
    setPlacements(new Set());
    setRemaining(MAX_PIECES);
    setScore(0);
    setRunning(false);
    setGoalHit(false);
    dominosRef.current = [];
  }, []);

  const start = useCallback(() => {
    if (running) return;
    const idxs = [
      START_INDEX,
      ...Array.from(placements).sort((a, b) => a - b),
      GOAL_INDEX,
    ];
    dominosRef.current = idxs.map((idx) => ({
      x: slotX(idx),
      y: groundY,
      index: idx,
      angle: 0,
      falling: false,
      fallen: false,
      color: idx === GOAL_INDEX ? '#f55' : '#f2f2f2',
    }));
    if (dominosRef.current.length > 0) dominosRef.current[0].falling = true;
    setRunning(true);
    setScore(0);
    setGoalHit(false);
  }, [placements, running, slotX]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        start();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        e.stopPropagation();
        reset();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [start, reset]);

  const togglePlacement = (index: number) => {
    setPlacements((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
        setRemaining((r) => r + 1);
      } else if (remaining > 0) {
        next.add(index);
        setRemaining((r) => r - 1);
      }
      return next;
    });
  };

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const index = Math.floor((x - startX) / (DOMINO_WIDTH + GAP));
      if (running) return;
      if (index === START_INDEX) {
        start();
        return;
      }
      if (index > START_INDEX && index < GOAL_INDEX) togglePlacement(index);
    },
    [running, start, startX]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const TRIGGER_ANGLE = Math.asin((DOMINO_WIDTH + GAP) / DOMINO_HEIGHT);
    const update = () => {
      if (!running) return;
      const dominos = dominosRef.current;
      dominos.forEach((d, i) => {
        if (d.falling && !d.fallen) {
          d.angle -= 0.1;
          const next = dominos[i + 1];
          if (
            next &&
            next.index === d.index + 1 &&
            !next.falling &&
            d.angle <= -TRIGGER_ANGLE
          ) {
            next.falling = true;
          }
          if (d.angle <= -Math.PI / 2) {
            d.angle = -Math.PI / 2;
            d.falling = false;
            d.fallen = true;
            if (d.index !== GOAL_INDEX) {
              setScore((s) => s + 1);
            }
            if (d.index === GOAL_INDEX) {
              d.color = '#0f0';
              setGoalHit(true);
              setRunning(false);
            } else if (!next || next.index !== d.index + 1) {
              setRunning(false);
            }
          }
        }
      });
    };

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      update();
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#222';
      ctx.fillRect(0, HEIGHT - 20, WIDTH, 20);

      const drawDomino = (x: number, angle: number, color: string) => {
        ctx.save();
        ctx.translate(x + DOMINO_WIDTH / 2, groundY + DOMINO_HEIGHT);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.fillRect(-DOMINO_WIDTH / 2, -DOMINO_HEIGHT, DOMINO_WIDTH, DOMINO_HEIGHT);
        ctx.restore();
      };

      if (running) {
        dominosRef.current.forEach((d) => drawDomino(d.x, d.angle, d.color));
      } else {
        // draw placements
        drawDomino(slotX(START_INDEX), 0, '#f2f2f2');
        placements.forEach((idx) => drawDomino(slotX(idx), 0, '#f2f2f2'));
        drawDomino(slotX(GOAL_INDEX), 0, goalHit ? '#0f0' : '#f55');
      }

      // draw slot markers
      if (!running) {
        ctx.strokeStyle = '#444';
        for (let i = 0; i < POSITIONS; i++) {
          const x = slotX(i);
          ctx.strokeRect(x, groundY, DOMINO_WIDTH, DOMINO_HEIGHT);
        }
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current!);
  }, [running, placements, goalHit]);

  const topInfo = (
    <div style={{ textAlign: 'center', color: '#bcbcbe' }}>
      남은 블록: {remaining} | 쓰러진 수: {score}
    </div>
  );
  const instructions =
    '빈칸 클릭: 도미노 배치/제거, 시작 도미노 클릭 또는 Space: 시작, R: 리셋';

  return (
    <GameLayout title="Domino Topple" topInfo={topInfo} bottomInfo={instructions}>
      <GameCanvas
        ref={canvasRef}
        gameTitle="Domino Topple"
        width={WIDTH}
        height={HEIGHT}
        onClick={handleClick}
      />
    </GameLayout>
  );
};

export default DominoCanvas;
