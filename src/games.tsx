import React from 'react';
import PingPongCanvas from './PingPongCanvas';
import TetrisCanvas from './TetrisCanvas';
import SnakeCanvas from './SnakeCanvas';
import OmokCanvas from './OmokCanvas';
import LightsOutCanvas from './LightsOutCanvas';
import SimonSaysCanvas from './SimonSaysCanvas';
import ReactionTestCanvas from './ReactionTestCanvas';
import AimTrainerCanvas from './AimTrainerCanvas';
import BreakoutCanvas from './BreakoutCanvas';
import FlappyBirdCanvas from './FlappyBirdCanvas';
import MemoryGameCanvas from './MemoryGameCanvas';
import DodgeGameCanvas from './DodgeGameCanvas';
import Game2048Canvas from './Game2048Canvas';
import SlidePuzzleCanvas from './SlidePuzzleCanvas';
import SokobanCanvas from './SokobanCanvas';
import ConnectFourCanvas from './ConnectFourCanvas';
import MiniGolfCanvas from './MiniGolfCanvas';
import TicTacToeCanvas from './TicTacToeCanvas';

export const games = [
  {
    id: 'pingpong',
    title: '🏓 Ping Pong',
    tipName: 'Ping Pong',
    description: '마우스/키보드로 패들을 조작해 AI와 대결해요.',
    hotkey: '1',
    render: () => <PingPongCanvas width={900} height={540} />,
  },
  {
    id: 'tetris',
    title: '🧱 Tetris',
    tipName: 'Tetris',
    description: '회전/드랍/홀드로 라인을 지우며 점수를 올려요.',
    hotkey: '2',
    render: () => <TetrisCanvas />,
  },
  {
    id: 'snake',
    title: '🐍 Snake',
    tipName: 'Snake',
    description: '먹이를 먹고 길어지세요. 벽/몸에 부딪히면 게임 오버!',
    hotkey: '3',
    render: () => <SnakeCanvas />,
  },
  {
    id: 'omok',
    title: '○● Omok',
    tipName: 'Omok',
    description: '번갈아 돌을 놓아 다섯 줄을 만들어요.',
    hotkey: '4',
    render: () => <OmokCanvas />,
  },
  {
    id: 'lightsout',
    title: '💡 Lights Out',
    tipName: 'Lights Out',
    description: '모든 불을 끄세요! 셀을 누르면 상하좌우가 토글됩니다.',
    hotkey: '5',
    render: () => <LightsOutCanvas />,
  },
  {
    id: 'simon',
    title: '🎨 Simon Says',
    tipName: 'Simon Says',
    description: '점점 길어지는 색상 패턴을 기억해서 따라하세요!',
    hotkey: '6',
    render: () => <SimonSaysCanvas />,
  },
  {
    id: 'reaction',
    title: '⚡ Reaction Test',
    tipName: 'Reaction Test',
    description: '화면이 초록색으로 바뀌는 순간 클릭! 반응속도를 테스트하세요.',
    hotkey: '7',
    render: () => <ReactionTestCanvas />,
  },
  {
    id: 'aim',
    title: '🎯 Aim Trainer',
    tipName: 'Aim Trainer',
    description: '나타나는 원 타격을 빠르게 클릭! 마우스 정확도를 향상시켜요.',
    hotkey: '8',
    render: () => <AimTrainerCanvas />,
  },
  {
    id: 'breakout',
    title: '🧱 Breakout',
    tipName: 'Breakout',
    description: '공과 패들로 벽돌을 부수세요! 물리 충돌과 반사를 느껴보세요.',
    hotkey: '9',
    render: () => <BreakoutCanvas />,
  },
  {
    id: 'flappy',
    title: '🐦 Flappy Bird',
    tipName: 'Flappy Bird',
    description: '점프해서 파이프 사이를 통과하세요! 중력과 가속도를 마스터하세요.',
    hotkey: '0',
    render: () => <FlappyBirdCanvas />,
  },
  {
    id: 'memory',
    title: '🧠 Memory Cards',
    tipName: 'Memory Cards',
    description: '같은 그림의 카드 2장을 찾아서 매칭하세요! 기억력과 집중력을 테스트해보세요.',
    hotkey: 'm',
    render: () => <MemoryGameCanvas />,
  },
  {
    id: 'dodge',
    title: '🚫 Dodge Game',
    tipName: 'Dodge Game',
    description: 'WASD로 이동해서 떨어지는 블록을 피하세요! 시간이 지날수록 난이도가 증가합니다.',
    hotkey: 'd',
    render: () => <DodgeGameCanvas />,
  },
  {
    id: '2048',
    title: '🔢 2048',
    tipName: '2048',
    description: '같은 숫자 타일을 슬라이드해서 합치고 2048을 만드세요! 전략적 사고가 필요합니다.',
    hotkey: '-',
    render: () => <Game2048Canvas />,
  },
  {
    id: 'slide',
    title: '🧩 Slide Puzzle',
    tipName: 'Slide Puzzle',
    description: '빈 칸과 인접한 타일을 슬라이드하여 1~15 순서로 정렬하세요! 클래식 15퍼즐입니다.',
    hotkey: '=',
    render: () => <SlidePuzzleCanvas />,
  },
  {
    id: 'sokoban',
    title: '🚚 Sokoban',
    tipName: 'Sokoban',
    description: '박스를 목표 지점으로 밀어서 모든 퍼즐을 해결하세요! 되돌리기 기능과 5개 레벨 제공.',
    hotkey: 's',
    render: () => <SokobanCanvas />,
  },
  {
    id: 'connect4',
    title: '🔴 Connect Four',
    tipName: 'Connect Four',
    description: '6x7 격자에서 4개 칩을 연속으로 연결하세요! AI와 대전하며 전략적 사고력을 기르세요.',
    hotkey: 'c',
    render: () => <ConnectFourCanvas />,
  },
  {
    id: 'minigolf',
    title: '⛳ Mini Golf',
    tipName: 'Mini Golf',
    description: '드래그로 파워를 조절해서 골프공을 홀에 넣으세요! 물리 엔진과 벽 반사를 활용하세요.',
    hotkey: 'g',
    render: () => <MiniGolfCanvas />,
  },
  {
    id: 'tictactoe',
    title: '⭕ Tic-Tac-Toe',
    tipName: 'Tic-Tac-Toe',
    description: 'X와 O를 번갈아 두며, 가로·세로·대각선으로 3개를 먼저 연결하면 승리! 클래식 틱택토 게임입니다.',
    hotkey: 't',
    render: () => <TicTacToeCanvas />,
  },
] as const;

export type GameDefinition = typeof games[number];
export type GameId = GameDefinition['id'];
