import React, { useEffect, useState } from 'react';
import GameMenu from './components/GameMenu';
import { games, GameId } from './games';

type GameView = GameId | 'menu';

export default function App() {
  const [game, setGame] = useState<GameView>('menu');

  useEffect(() => {
    const hotkeyMap: Record<string, GameId> = {};
    games.forEach((g) => {
      hotkeyMap[g.hotkey.toLowerCase()] = g.id;
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'escape') {
        setGame('menu');
        return;
      }
      const id = hotkeyMap[key];
      if (id) setGame(id);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (game === 'menu') {
    return <GameMenu games={games} onSelect={(id) => setGame(id)} />;
  }

  const current = games.find((g) => g.id === game);
  return current ? current.render() : null;
}
