import React, { useRef, useEffect } from 'react';
import { canvasStyle } from './theme/gameTheme';

const TowerBuilderCanvas: React.FC<{ width?: number; height?: number }> = ({ width = 300, height = 500 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    let score = 0;
    let best = Number(localStorage.getItem('towerHighScore')) || 0;
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
        if (score > best) {
          best = score;
          localStorage.setItem('towerHighScore', String(best));
        }
        return;
      }
      blocks.push({ x: overlapStart, width: overlap });
      score += overlap * blockHeight;
      active = { x: 0, width: overlap };
      if (height - blockHeight * (blocks.length + 1) <= 0) {
        gameOver = true;
        if (score > best) {
          best = score;
          localStorage.setItem('towerHighScore', String(best));
        }
      }
    };

    const reset = () => {
      blocks = [{ x: (width - baseWidth) / 2, width: baseWidth }];
      active = { x: 0, width: baseWidth };
      dir = 1;
      speed = 2;
      score = 0;
      gameOver = false;
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
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Score: ${score}`, 10, 20);
      ctx.fillText(`Best: ${best}`, 10, 40);
      if (gameOver) {
        ctx.fillText('Game Over - Press R', 10, 60);
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

  return <canvas ref={canvasRef} width={width} height={height} style={canvasStyle} />;
};

export default TowerBuilderCanvas;
