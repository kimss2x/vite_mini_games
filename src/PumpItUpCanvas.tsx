import React, { useRef, useEffect, useCallback, useState } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const WIDTH = 300;
const HEIGHT = 600;
const LANE_WIDTH = WIDTH / 4;
const TARGET_Y = HEIGHT - 100;
const NOTE_SPEED = 240; // px per second
const SPAWN_INTERVAL = 800; // ms
const HIT_WINDOW = 50;
const MAX_MISSES = 5;
const KEYS = ['q', 'w', 'e', 'r'];

type Note = {
  lane: number;
  y: number;
  state: 'active' | 'hit' | 'miss';
  timer: number;
};

const PumpItUpCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const notesRef = useRef<Note[]>([]);
  const spawnRef = useRef(0);
  const flashRef = useRef([0, 0, 0, 0]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [state, setState] = useState<'playing' | 'over'>('playing');

  const resetGame = useCallback(() => {
    notesRef.current = [];
    spawnRef.current = 0;
    setScore(0);
    setMisses(0);
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

    let prev: number | null = null;
    let rafId: number;
    const loop = (time: number) => {
      if (prev === null) prev = time;
      const delta = time - prev;
      prev = time;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // draw target lanes
        ctx.fillStyle = '#444';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(i * LANE_WIDTH, 0, 2, HEIGHT);
          ctx.fillRect(i * LANE_WIDTH, TARGET_Y, LANE_WIDTH, 10);
        }

      // lane key hints
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      for (let i = 0; i < 4; i++) {
        flashRef.current[i] = Math.max(0, flashRef.current[i] - delta);
        ctx.fillStyle = flashRef.current[i]
          ? 'rgba(255,255,255,0.6)'
          : 'rgba(255,255,255,0.1)';
        ctx.fillText(KEYS[i].toUpperCase(), i * LANE_WIDTH + LANE_WIDTH / 2, HEIGHT - 10);
      }

      if (state === 'playing') {
        spawnRef.current += delta;
        if (spawnRef.current > SPAWN_INTERVAL) {
          spawnRef.current -= SPAWN_INTERVAL;
          notesRef.current.push({
            lane: Math.floor(Math.random() * 4),
            y: -20,
            state: 'active',
            timer: 0,
          });
        }
      }

      for (const note of notesRef.current) {
        if (note.state === 'active' && state === 'playing') {
          note.y += NOTE_SPEED * (delta / 1000);
        } else {
          note.timer -= delta;
        }
        const color =
          note.state === 'hit'
            ? '#0f0'
            : note.state === 'miss'
            ? '#f00'
            : '#0bf';
        ctx.fillStyle = color;
        const x = note.lane * LANE_WIDTH + LANE_WIDTH / 2;
        ctx.beginPath();
        ctx.arc(x, note.y, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      // handle misses and clean-up
      if (state === 'playing') {
        for (const n of notesRef.current) {
          if (n.state === 'active' && n.y > TARGET_Y + HIT_WINDOW) {
            n.state = 'miss';
            n.timer = 300;
            setMisses((m) => {
              const nm = m + 1;
              if (nm >= MAX_MISSES) setState('over');
              return nm;
            });
          }
        }
      }

      notesRef.current = notesRef.current.filter(
        (n) => n.state === 'active' || n.timer > 0
      );

      if (state === 'over') {
        ctx.fillStyle = '#fff';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [state]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ([...KEYS, ' '].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (key === ' ') {
        resetGame();
        return;
      }
      if (state !== 'playing') return;
      let lane: number | null = null;
      if (key === 'q') lane = 0;
      else if (key === 'w') lane = 1;
      else if (key === 'e') lane = 2;
      else if (key === 'r') lane = 3;
      if (lane === null) return;
      flashRef.current[lane] = 100;
      const note = notesRef.current.find(
        (n) => n.lane === lane && n.state === 'active' && Math.abs(n.y - TARGET_Y) < HIT_WINDOW
      );
      if (note) {
        note.state = 'hit';
        note.timer = 300;
        setScore((s) => s + 1);
      }
    },
    [resetGame, state]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [handleKey]);

  return (
    <GameLayout
      title="🎵 Pump It Up"
      topInfo={<div>Score: {score} Misses: {misses}/{MAX_MISSES}</div>}
      bottomInfo={<div>Q W E R : Hit • Space : Reset</div>}
    >
      <GameCanvas ref={canvasRef} gameTitle="Pump It Up" width={WIDTH} height={HEIGHT} />
      <div style={{ marginTop: 16 }}>
        <GameButton onClick={resetGame}>Reset</GameButton>
      </div>
    </GameLayout>
  );
};

export default PumpItUpCanvas;
