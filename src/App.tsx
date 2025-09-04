import React, { useEffect, useState } from 'react';
import GameMenu from './components/GameMenu';
import { games, GameId } from './games';

type GameView = GameId | 'menu';

export default function App() {
  const [game, setGame] = useState<GameView>('menu');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") setGame("pingpong");
      if (e.key === "2") setGame("tetris");
      if (e.key === "3") setGame("snake");
      if (e.key === "4") setGame("omok");
      if (e.key === "5") setGame("lightsout");
      if (e.key === "6") setGame("simon");
      if (e.key === "7") setGame("reaction");
      if (e.key === "8") setGame("aim");
      if (e.key === "9") setGame("breakout");
      if (e.key === "0") setGame("flappy");
      if (e.key === "m") setGame("memory");
      if (e.key === "d") setGame("dodge");
      if (e.key === "-") setGame("2048");
      if (e.key === "=") setGame("slide");
      if (e.key === "s") setGame("sokoban");
      if (e.key === "c") setGame("connect4");
      if (e.key === "g") setGame("minigolf");
      if (e.key === "t") setGame("tictactoe");
      if (e.key === "Escape") setGame("menu");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (game === 'menu') {
    return <GameMenu games={games} onSelect={(id) => setGame(id)} />;
  }

  const current = games.find((g) => g.id === game);
  return current ? current.render() : null;
}
