import React, { useRef, useState, useEffect, useCallback } from 'react';
import GameLayout from './components/GameLayout';
import GameCanvas from './components/GameCanvas';
import GameButton from './components/GameButton';

const ROWS = 10;
const PEGS = 4;
const COLORS = ['#e74c3c', '#3498db', '#27ae60', '#f1c40f', '#e91e63', '#8e44ad'];
const COLOR_NAMES = ['빨강', '파랑', '초록', '노랑', '분홍', '보라'];
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;
const TOP_MARGIN = 40;
const ROW_SPACING = 40;
const PEG_RADIUS = 12;
const PEG_SPACING = 40;
const FEEDBACK_RADIUS = 6;
const FEEDBACK_SPACING = 16;
const PALETTE_RADIUS = 15;
const PALETTE_SPACING = 40;

function generateSecret() {
  return Array.from({ length: PEGS }, () => Math.floor(Math.random() * COLORS.length));
}

const MastermindCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [secret, setSecret] = useState<number[]>(() => generateSecret());
  const [guesses, setGuesses] = useState<number[][]>(
    Array.from({ length: ROWS }, () => Array(PEGS).fill(-1))
  );
  const [results, setResults] = useState<{ correct: number; misplaced: number }[]>([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const resetGame = useCallback(() => {
    setSecret(generateSecret());
    setGuesses(Array.from({ length: ROWS }, () => Array(PEGS).fill(-1)));
    setResults([]);
    setCurrentRow(0);
    setGameState('playing');
  }, []);

  const handleUndo = useCallback(() => {
    if (gameState !== 'playing') return;
    const row = guesses[currentRow];
    let idx = -1;
    for (let i = PEGS - 1; i >= 0; i--) {
      if (row[i] !== -1) {
        idx = i;
        break;
      }
    }
    if (idx === -1) return;
    const newGuesses = guesses.map((r, ri) =>
      ri === currentRow ? r.map((v, ci) => (ci === idx ? -1 : v)) : r
    );
    setGuesses(newGuesses);
  }, [gameState, guesses, currentRow]);

  const submitGuess = useCallback(() => {
    if (gameState !== 'playing') return;
    if (guesses[currentRow].some(v => v === -1)) return;
    const guess = guesses[currentRow];

    const secretUsed = Array(PEGS).fill(false);
    const guessUsed = Array(PEGS).fill(false);
    let correct = 0;
    let misplaced = 0;

    for (let i = 0; i < PEGS; i++) {
      if (guess[i] === secret[i]) {
        correct++;
        secretUsed[i] = true;
        guessUsed[i] = true;
      }
    }
    for (let i = 0; i < PEGS; i++) {
      if (guessUsed[i]) continue;
      for (let j = 0; j < PEGS; j++) {
        if (!secretUsed[j] && guess[i] === secret[j]) {
          misplaced++;
          secretUsed[j] = true;
          break;
        }
      }
    }

    const newResults = [...results];
    newResults[currentRow] = { correct, misplaced };
    setResults(newResults);

    if (correct === PEGS) {
      setGameState('won');
    } else if (currentRow === ROWS - 1) {
      setGameState('lost');
    } else {
      setCurrentRow(currentRow + 1);
    }
  }, [gameState, guesses, currentRow, secret, results]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const paletteY = TOP_MARGIN + ROW_SPACING * ROWS + 60;
    const paletteStartX = (CANVAS_WIDTH - (COLORS.length - 1) * PALETTE_SPACING) / 2;
    for (let i = 0; i < COLORS.length; i++) {
      const cx = paletteStartX + i * PALETTE_SPACING;
      const cy = paletteY;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= PALETTE_RADIUS) {
        const colIndex = guesses[currentRow].findIndex(v => v === -1);
        if (colIndex !== -1) {
          const newGuesses = guesses.map((r, ri) => {
            if (ri !== currentRow) return r;
            const newRow = [...r];
            newRow[colIndex] = i;
            return newRow;
          });
          setGuesses(newGuesses);
        }
        return;
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      0,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) / 1.5
    );
    gradient.addColorStop(0, '#15161a');
    gradient.addColorStop(1, '#0f0f12');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const boardWidth = PEG_SPACING * PEGS + 60;
    const startX = (CANVAS_WIDTH - boardWidth) / 2;

    for (let r = 0; r < ROWS; r++) {
      const y = TOP_MARGIN + r * ROW_SPACING;
      for (let c = 0; c < PEGS; c++) {
        const x = startX + c * PEG_SPACING;
        ctx.beginPath();
        ctx.arc(x, y, PEG_RADIUS, 0, Math.PI * 2);
        const colorIndex = guesses[r][c];
        ctx.fillStyle = colorIndex === -1 ? 'rgba(255,255,255,0.1)' : COLORS[colorIndex];
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.stroke();
      }

      const res = results[r];
      if (res) {
        const fbX = startX + PEG_SPACING * PEGS + 20;
        const fbY = y - FEEDBACK_SPACING / 2;
        let peg = 0;
        for (let i = 0; i < res.correct; i++) {
          const fx = fbX + (peg % 2) * FEEDBACK_SPACING;
          const fy = fbY + Math.floor(peg / 2) * FEEDBACK_SPACING;
          ctx.beginPath();
          ctx.arc(fx, fy, FEEDBACK_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#000';
          ctx.fill();
          peg++;
        }
        for (let i = 0; i < res.misplaced; i++) {
          const fx = fbX + (peg % 2) * FEEDBACK_SPACING;
          const fy = fbY + Math.floor(peg / 2) * FEEDBACK_SPACING;
          ctx.beginPath();
          ctx.arc(fx, fy, FEEDBACK_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          peg++;
        }
      }
    }

    const paletteY = TOP_MARGIN + ROW_SPACING * ROWS + 60;
    const paletteStartX = (CANVAS_WIDTH - (COLORS.length - 1) * PALETTE_SPACING) / 2;
    for (let i = 0; i < COLORS.length; i++) {
      const x = paletteStartX + i * PALETTE_SPACING;
      ctx.beginPath();
      ctx.arc(x, paletteY, PALETTE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[i];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.stroke();
    }

    if (gameState === 'won' || gameState === 'lost') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      const msg = gameState === 'won'
        ? '정답입니다!'
        : `실패! 정답: ${secret.map(i => COLOR_NAMES[i]).join(', ')}`;
      ctx.fillText(msg, CANVAS_WIDTH / 2, 30);
    }
  }, [guesses, results, secret, gameState]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'r', 'z'].includes(key)) {
        e.stopPropagation();
      }
      if (key === 'r') {
        e.preventDefault();
        resetGame();
      } else if (key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [resetGame, handleUndo]);

  return (
    <GameLayout
      title="🧠 Mastermind"
      topInfo={<div>시도: {currentRow + 1}/{ROWS}</div>}
      bottomInfo={<div>팔레트에서 색을 선택해 조합을 맞추세요. Submit으로 확인, Z=Undo, R=Reset</div>}
    >
      <GameCanvas
        ref={canvasRef}
        gameTitle="Mastermind"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
      />
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <GameButton
          onClick={submitGuess}
          disabled={guesses[currentRow].some(v => v === -1) || gameState !== 'playing'}
        >
          Submit
        </GameButton>
        <GameButton
          onClick={handleUndo}
          variant="secondary"
          disabled={guesses[currentRow].every(v => v === -1) || gameState !== 'playing'}
        >
          Undo
        </GameButton>
        <GameButton onClick={resetGame} variant="secondary">
          Reset
        </GameButton>
      </div>
    </GameLayout>
  );
};

export default MastermindCanvas;

