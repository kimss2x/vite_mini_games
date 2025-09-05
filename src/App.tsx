import React, { useEffect, useState } from 'react';
import GameMenu from './components/GameMenu';
import { games, GameId } from './games';

type GameView = GameId | 'menu';

export default function App() {
  const [game, setGame] = useState<GameView>('menu');
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
  return current ? current.render() : null;
}
