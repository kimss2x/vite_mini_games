import React, { useRef, useEffect, useCallback, useState } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import { layout } from './theme/gameTheme';

const WIDTH = layout.maxWidth;
const HEIGHT = 400;
const DOMINO_WIDTH = 20;
const DOMINO_HEIGHT = 80;
const SPACING = 10;
const NUM = 20;

interface Domino {
  x: number;
  y: number;
  angle: number; // radians
  falling: boolean;
  fallen: boolean;
}

const DominoCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dominosRef = useRef<Domino[]>([]);
  const animRef = useRef<number>();
  const [score, setScore] = useState(0);

  const reset = useCallback(() => {
    const startX = (WIDTH - (NUM * DOMINO_WIDTH + (NUM - 1) * SPACING)) / 2;
    dominosRef.current = Array.from({ length: NUM }, (_, i) => ({
      x: startX + i * (DOMINO_WIDTH + SPACING),
      y: HEIGHT - DOMINO_HEIGHT,
      angle: 0,
      falling: false,
      fallen: false,
    }));
    setScore(0);
  }, []);

  const start = () => {
    const dominos = dominosRef.current;
    if (!dominos[0].falling && !dominos[0].fallen) dominos[0].falling = true;
  };

  useEffect(() => { reset(); }, [reset]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        start();
      }
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        e.stopPropagation();
        reset();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = () => {
      const dominos = dominosRef.current;
      dominos.forEach((d, i) => {
        if (d.falling && !d.fallen){
          d.angle += 0.05;
          if (d.angle >= Math.PI / 2){
            d.angle = Math.PI / 2;
            d.falling = false;
            d.fallen = true;
            setScore(s => s + 1);
            if (i + 1 < dominos.length){
              dominos[i+1].falling = true;
            }
          }
        }
      });
    };

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      update();
      ctx.clearRect(0,0,WIDTH,HEIGHT);
      ctx.fillStyle = '#222';
      ctx.fillRect(0,HEIGHT-20,WIDTH,20);
      dominosRef.current.forEach(d => {
        ctx.save();
        ctx.translate(d.x + DOMINO_WIDTH/2, d.y + DOMINO_HEIGHT);
        ctx.rotate(-d.angle);
        ctx.fillStyle = '#f2f2f2';
        ctx.fillRect(-DOMINO_WIDTH/2, -DOMINO_HEIGHT, DOMINO_WIDTH, DOMINO_HEIGHT);
        ctx.restore();
      });
    };
    draw();
    return () => cancelAnimationFrame(animRef.current!);
  }, []);

  const topInfo = <div style={{textAlign:'center', color:'#bcbcbe'}}>쓰러뜨린 수: {score}</div>;
  const instructions = '클릭 또는 스페이스바로 처음 도미노를 쓰러뜨리세요. R로 리셋.';

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    start();
  }, []);

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
