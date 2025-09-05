import React, { useEffect, useRef, useState } from 'react';
import GameManager from './components/GameManager';
import GameCanvas from './components/GameCanvas';

const TowerBuilderCanvas: React.FC<{ width?: number; height?: number }> = ({ width = 300, height = 500 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => Number(localStorage.getItem('towerHighScore')) || 0);
  const scoreRef = useRef(0);
  const bestRef = useRef(best);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blockHeight = 20;
    const baseWidth = 100;
    let blocks: { x: number; width: number }[] = [{ x: (width - baseWidth) / 2, width: baseWidth }];
    let active = { x: 0, width: baseWidth };
    let dir = 1;
    let speed = 2;
    let gameOver = false;
    let animationId: number;

    const drop = () => {
      if (gameOver) return;
      const prev = blocks[blocks.length - 1];
      const overlapStart = Math.max(prev.x, active.x);
      const overlapEnd = Math.min(prev.x + prev.width, active.x + active.width);
      const overlap = overlapEnd - overlapStart;
      if (overlap <= 0) {
        gameOver = true;
        setStatus('Game Over - Press R');
        if (scoreRef.current > bestRef.current) {
          bestRef.current = scoreRef.current;
          setBest(bestRef.current);
          localStorage.setItem('towerHighScore', String(bestRef.current));
        }
        return;
      }
      blocks.push({ x: overlapStart, width: overlap });
      scoreRef.current += overlap * blockHeight;
      setScore(scoreRef.current);
      if (scoreRef.current > bestRef.current) {
        bestRef.current = scoreRef.current;
        setBest(bestRef.current);
        localStorage.setItem('towerHighScore', String(bestRef.current));
      }
      active = { x: 0, width: overlap };
      if (height - blockHeight * (blocks.length + 1) <= 0) {
        gameOver = true;
        setStatus('Game Over - Press R');
      }
    };

    const reset = () => {
      blocks = [{ x: (width - baseWidth) / 2, width: baseWidth }];
      active = { x: 0, width: baseWidth };
      dir = 1;
      speed = 2;
      scoreRef.current = 0;
      setScore(0);
      gameOver = false;
      setStatus('');
    };

    const update = () => {
      if (!gameOver) {
        active.x += dir * speed;
        if (active.x <= 0 || active.x + active.width >= width) {
          dir *= -1;
          active.x = Math.max(0, Math.min(active.x, width - active.width));
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, width, height);
      blocks.forEach((b, i) => {
        ctx.fillStyle = `hsl(${(i * 40) % 360},70%,60%)`;
        const y = height - blockHeight * (i + 1);
        ctx.fillRect(b.x, y, b.width, blockHeight);
      });
      if (!gameOver) {
        ctx.fillStyle = '#fff';
        const y = height - blockHeight * (blocks.length + 1);
        ctx.fillRect(active.x, y, active.width, blockHeight);
      }
    };

    const loop = () => {
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        drop();
      } else if (e.key === 'r') {
        e.preventDefault();
        reset();
      }
      e.stopPropagation();
    };

    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('click', drop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKey);
      canvas.removeEventListener('click', drop);
    };
  }, [width, height]);

  const gameStats = (
    <div style={{ textAlign: 'center' }}>
      <div>점수: {score} | 최고: {best}</div>
      {status && <div style={{ marginTop: 4 }}>{status}</div>}
    </div>
  );

  const instructions = 'Space/Enter/클릭: 블록 놓기\nR: 리셋';

  return (
    <GameManager
      title="Tower Builder"
      gameIcon="🏗️"
      gameStats={gameStats}
      instructions={instructions}
    >
      <GameCanvas
        ref={canvasRef}
        width={width}
        height={height}
        gameTitle="Tower Builder"
      />
    </GameManager>
  );
};

export default TowerBuilderCanvas;

