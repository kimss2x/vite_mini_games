import React from 'react';
import { GameDefinition, GameId } from '../games';

type Props = {
  games: readonly GameDefinition[];
  onSelect: (id: GameId) => void;
};

export default function GameMenu({ games, onSelect }: Props) {
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const firstGame = games[0];

  const Card: React.FC<{ title: string; desc: string; onClick: () => void }> = ({
    title,
    desc,
    onClick,
  }) => (
    <button
      onClick={onClick}
      style={{
        display: 'grid',
        gap: 8,
        textAlign: 'left',
        background: 'rgba(255, 250, 235, 0.82)',
        border: '2px solid rgba(196, 132, 75, 0.24)',
        borderRadius: 8,
        padding: 16,
        width: '100%',
        cursor: 'pointer',
        boxShadow: '0 10px 24px rgba(112, 78, 42, 0.12)',
        color: '#5f442c',
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 18 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#7c6047', lineHeight: 1.45 }}>{desc}</div>
    </button>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 14% 18%, rgba(255, 226, 145, 0.7), transparent 24%), radial-gradient(circle at 86% 12%, rgba(176, 220, 167, 0.56), transparent 22%), linear-gradient(180deg, #fff4d8 0%, #f7dfb5 58%, #f0d49a 100%)',
        color: '#5f442c',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans KR", sans-serif',
        padding: 'clamp(18px, 5vw, 42px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'grid', gap: 20, width: '100%', maxWidth: 960 }}>
        <div
          style={{
            display: 'grid',
            gap: 16,
            textAlign: 'center',
            justifyItems: 'center',
            padding: 'clamp(22px, 6vw, 52px) clamp(16px, 5vw, 42px)',
            border: '2px solid rgba(139, 93, 51, 0.18)',
            borderRadius: 8,
            background: 'rgba(255, 250, 235, 0.72)',
            boxShadow: '0 18px 42px rgba(112, 78, 42, 0.16)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: '#a86f3c' }}>
            Tiny stories, tiny games
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(34px, 8vw, 58px)',
              lineHeight: 1.02,
              color: '#6b4328',
            }}
          >
            Noah Studio Mini Games
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(16px, 3.4vw, 22px)',
              lineHeight: 1.5,
              color: '#7b5b3d',
            }}
          >
            작은 이야기와 귀여운 게임이 자라는 공간
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => firstGame && onSelect(firstGame.id)}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '13px 22px',
                background: '#d97845',
                color: '#fffaf0',
                fontWeight: 900,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: '0 10px 18px rgba(169, 94, 46, 0.24)',
              }}
            >
              Start Game
            </button>
            <button
              onClick={() => setShowHowToPlay((value) => !value)}
              style={{
                border: '2px solid rgba(139, 93, 51, 0.26)',
                borderRadius: 999,
                padding: '11px 20px',
                background: '#fff9ea',
                color: '#6b4328',
                fontWeight: 900,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              How to Play
            </button>
          </div>
        </div>

        {showHowToPlay && (
          <div
            style={{
              background: 'rgba(255, 250, 235, 0.8)',
              border: '2px dashed rgba(139, 93, 51, 0.24)',
              borderRadius: 8,
              padding: 18,
              lineHeight: 1.65,
              color: '#705037',
            }}
          >
            <strong>Noah Ping Pong Garden</strong>부터 시작합니다. 마우스나 터치 드래그로
            왼쪽 패들을 움직이고, 키보드에서는 W/S 또는 ↑/↓를 사용합니다. Space는
            일시정지, R은 재시작입니다. 5점을 먼저 얻으면 결과 화면이 나타납니다.
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            alignItems: 'stretch',
            width: '100%',
          }}
        >
          {games.map((g) => (
            <Card
              key={g.id}
              title={g.title}
              desc={g.description}
              onClick={() => onSelect(g.id)}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: '#846145',
            textAlign: 'center',
          }}
        >
          Tip:{' '}
          {games.map((g, i) => (
            <span key={g.id}>
              <b>{g.hotkey.toUpperCase()}</b> = {g.tipName}
              {i < games.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
