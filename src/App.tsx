import React, { useEffect, useState } from "react";
import GameMenu, { GameId } from "./components/GameMenu";
import PingPongCanvas from "./PingPongCanvas";
import TetrisCanvas from "./TetrisCanvas";
import SnakeCanvas from "./SnakeCanvas";
import OmokCanvas from "./OmokCanvas";
import LightsOutCanvas from "./LightsOutCanvas";
import SimonSaysCanvas from "./SimonSaysCanvas";
import ReactionTestCanvas from "./ReactionTestCanvas";
import AimTrainerCanvas from "./AimTrainerCanvas";
import BreakoutCanvas from "./BreakoutCanvas";
import FlappyBirdCanvas from "./FlappyBirdCanvas";
import MemoryGameCanvas from "./MemoryGameCanvas";
import DodgeGameCanvas from "./DodgeGameCanvas";
import Game2048Canvas from "./Game2048Canvas";
import SlidePuzzleCanvas from "./SlidePuzzleCanvas";
import SokobanCanvas from "./SokobanCanvas";
import ConnectFourCanvas from "./ConnectFourCanvas";
import MiniGolfCanvas from "./MiniGolfCanvas";
import TicTacToeCanvas from "./TicTacToeCanvas";

export default function App() {
  const [game, setGame] = useState<GameId>("menu");

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

  if (game === "menu") return <GameMenu onSelect={(id) => setGame(id)} />;

  switch (game) {
    case "pingpong":
      return <PingPongCanvas width={900} height={540} />;
    case "tetris":
      return <TetrisCanvas />;
    case "snake":
      return <SnakeCanvas />;
    case "omok":
      return <OmokCanvas />;
    case "lightsout":
      return <LightsOutCanvas />;
    case "simon":
      return <SimonSaysCanvas />;
    case "reaction":
      return <ReactionTestCanvas />;
    case "aim":
      return <AimTrainerCanvas />;
    case "breakout":
      return <BreakoutCanvas />;
    case "flappy":
      return <FlappyBirdCanvas />;
    case "memory":
      return <MemoryGameCanvas />;
    case "dodge":
      return <DodgeGameCanvas />;
    case "2048":
      return <Game2048Canvas />;
    case "slide":
      return <SlidePuzzleCanvas />;
    case "sokoban":
      return <SokobanCanvas />;
    case "connect4":
      return <ConnectFourCanvas />;
    case "minigolf":
      return <MiniGolfCanvas />;
    case "tictactoe":
      return <TicTacToeCanvas />;
    default:
      return null;
  }
}

