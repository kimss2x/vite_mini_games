import React, { useEffect, useState, Suspense } from 'react';
import GameMenu from './components/GameMenu';
import { games, GameId } from './games';

type GameView = GameId | 'menu';

// 게임 청크 로딩 중 보여줄 따뜻한 스토리북 스타일 폴백
function GameLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: '#fbf3e2',
        color: '#8a5a32',
        fontSize: 18,
        fontWeight: 600,
        fontFamily: 'inherit',
      }}
    >
      <div style={{ fontSize: 40 }}>🌱</div>
      <div>게임을 불러오는 중...</div>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useState<GameView>('menu');
  // Reflect active game in the browser title
  useEffect(() => {
    const base = 'Mini Games';
    if (game === 'menu') document.title = base;
    else {
      const current = games.find((g) => g.id === game);
      document.title = current ? `${current.title} - ${base}` : base;
    }
  }, [game]);
  // Allow exiting any game with Escape
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGame('menu');
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  // Enable hotkeys only when the menu is active so game controls aren't blocked
  useEffect(() => {
    if (game !== 'menu') return;

    const hotkeyMap: Record<string, GameId> = {};
    games.forEach((g) => {
      hotkeyMap[g.hotkey.toLowerCase()] = g.id;
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      const id = hotkeyMap[key];
      if (id) {
        e.preventDefault();
        setGame(id);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [game]);

  if (game === 'menu') {
    return <GameMenu games={games} onSelect={(id) => setGame(id)} />;
  }

  const current = games.find((g) => g.id === game);
  if (!current) return null;
  return <Suspense fallback={<GameLoading />}>{current.render()}</Suspense>;
}
