import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const COLORS = ['#ff595e', '#1982c4', '#6a4c93', '#8ac926', '#ffca3a', '#ff924c'];
const WIDTH = 400;
const HEIGHT = 400;
const RADIUS = 80;
const BLOCK = 20;

interface FallingBlock {
  color: number;
  y: number; // relative to center, negative going up
}

const HextrisCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef(0);
  const stacksRef = useRef<number[]>(Array(6).fill(0));
  const blockRef = useRef<FallingBlock | null>(null);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<'playing' | 'over'>('playing');

  const resetGame = useCallback(() => {
    rotationRef.current = 0;
    stacksRef.current = Array(6).fill(0);
    blockRef.current = null;
    setScore(0);
    setState('playing');
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    let prev = 0;
    let rafId: number;
    const loop = (time: number) => {
      const delta = time - prev;
      prev = time;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.save();
      ctx.translate(WIDTH / 2, HEIGHT / 2);
      ctx.rotate(rotationRef.current * (Math.PI / 3));
      // draw hexagon wedges
      for (let i = 0; i < 6; i++) {
        const a1 = (i * Math.PI) / 3 - Math.PI / 2;
        const a2 = ((i + 1) * Math.PI) / 3 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(RADIUS * Math.cos(a1), RADIUS * Math.sin(a1));
        ctx.lineTo(RADIUS * Math.cos(a2), RADIUS * Math.sin(a2));
        ctx.closePath();
        ctx.fillStyle = COLORS[i];
        ctx.fill();
        // draw stack
        const angleMid = (a1 + a2) / 2;
        for (let h = 0; h < stacksRef.current[i]; h++) {
          const dist = RADIUS + BLOCK * (h + 0.5);
          const bx = dist * Math.cos(angleMid) - BLOCK / 2;
          const by = dist * Math.sin(angleMid) - BLOCK / 2;
          ctx.fillStyle = COLORS[i];
          ctx.fillRect(bx, by, BLOCK, BLOCK);
        }
      }
      ctx.restore();

      // draw falling block
      if (state === 'playing') {
        if (!blockRef.current) {
          blockRef.current = { color: Math.floor(Math.random() * 6), y: -200 };
        }
        const b = blockRef.current!;
        b.y += (delta / 16) * 4; // speed
        ctx.save();
        ctx.translate(WIDTH / 2, HEIGHT / 2);
        ctx.fillStyle = COLORS[b.color];
        ctx.fillRect(-BLOCK / 2, b.y - BLOCK, BLOCK, BLOCK);
        ctx.restore();
        if (b.y >= -RADIUS) {
          const topIndex = ((-rotationRef.current % 6) + 6) % 6;
          if (b.color !== topIndex) {
            setState('over');
          } else {
            stacksRef.current[topIndex]++;
            if (stacksRef.current[topIndex] >= 3) {
              setScore(s => s + stacksRef.current[topIndex]);
              stacksRef.current[topIndex] = 0;
            }
          }
          blockRef.current = null;
        }
      } else {
        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [state]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['a', 'd', 'r'].includes(key)) {
        e.stopPropagation();
      }
      if (key === 'a' || e.key === 'ArrowLeft') {
        e.preventDefault();
        rotationRef.current = (rotationRef.current + 5) % 6;
      } else if (key === 'd' || e.key === 'ArrowRight') {
        e.preventDefault();
        rotationRef.current = (rotationRef.current + 1) % 6;
      } else if (key === 'r') {
        e.preventDefault();
        resetGame();
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [resetGame]);

  return (
    <GameLayout
      title="🔷 Hextris"
      topInfo={<div>Score: {score}</div>}
      bottomInfo={<div>좌우 키(A/D)로 회전하여 색을 맞추세요. R=Reset</div>}
    >
      <GameCanvas ref={canvasRef} gameTitle="Hextris" width={WIDTH} height={HEIGHT} />
      <div style={{ marginTop: 16 }}>
        <GameButton onClick={resetGame}>Reset</GameButton>
      </div>
    </GameLayout>
  );
};

export default HextrisCanvas;

