import React from 'react';
import { GameDefinition, GameId } from '../games';

type Props = {
  games: readonly GameDefinition[];
  onSelect: (id: GameId) => void;
};

export default function GameMenu({ games, onSelect }: Props) {
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
        background: 'linear-gradient(180deg, rgba(35,36,42,.9), rgba(27,28,33,.9))',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 14,
        padding: 16,
        width: 280,
        cursor: 'pointer',
        boxShadow:
          '0 10px 30px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.03)',
        color: '#e8e8ea',
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 18 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#bcbcbe', lineHeight: 1.35 }}>{desc}</div>
    </button>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f12',
        color: '#e8e8ea',
        display: 'grid',
        placeItems: 'center',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans KR", sans-serif',
        padding: 24,
      }}
    >
      <div style={{ display: 'grid', gap: 18, placeItems: 'center' }}>
        <div
          style={{
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: '.4px',
            textAlign: 'center',
          }}
        >
          🎮 미니 게임 모음
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            alignItems: 'stretch',
            width: 'min(880px, 92vw)',
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
            color: '#a9a9ad',
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
