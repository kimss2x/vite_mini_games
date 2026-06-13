import React from 'react';
import { GameDefinition, GameId } from '../games';

const FORMSPREE_FEEDBACK_ENDPOINT = 'https://formspree.io/f/mvznvepj';

const GAME_ICONS: Partial<Record<GameId, string>> = {
  pingpong:      '/images/icons/noah-ping-pong-garden.png',
  tetris:        '/images/icons/tetris.png',
  snake:         '/images/icons/snake.png',
  omok:          '/images/icons/omok.png',
  lightsout:     '/images/icons/lights-out.png',
  simon:         '/images/icons/simon-says.png',
  reaction:      '/images/icons/reaction-test.png',
  aim:           '/images/icons/aim-trainer.png',
  breakout:      '/images/icons/breakout.png',
  flappy:        '/images/icons/flappy-bird.png',
  memory:        '/images/icons/memory-cards.png',
  dodge:         '/images/icons/dodge-game.png',
  '2048':        '/images/icons/2048.png',
  slide:         '/images/icons/slide-puzzle.png',
  sokoban:       '/images/icons/sokoban.png',
  connect4:      '/images/icons/connect-four.png',
  minigolf:      '/images/icons/mini-golf.png',
  frogger:       '/images/icons/frogger.png',
  tictactoe:     '/images/icons/tic-tac-toe.png',
  whack:         '/images/icons/whack-a-mole.png',
  galaga:        '/images/icons/galaga.png',
  space:         '/images/icons/space-invaders.png',
  hextris:       '/images/icons/hextris.png',
  puyo:          '/images/icons/puyo-puyo.png',
  pacman:        '/images/icons/pacman.png',
  penguin:       '/images/icons/penguin-jump.png',
  pumpitup:      '/images/icons/pump-it-up.png',
  columns:       '/images/icons/columns.png',
  paper:         '/images/icons/paper-io.png',
  tower:         '/images/icons/tower-builder.png',
  qix:           '/images/icons/qix.png',
  bomber:        '/images/icons/bomberman.png',
  watermelon:    '/images/icons/watermelon.png',
  mergepets:     '/images/icons/merge-pets.png',
  mergecatsdogs: '/images/icons/merge-cats-dogs.png',
  domino:        '/images/icons/domino.png',
  bubbleshooter: '/images/icons/bubble-shooter.png',
  crossy:        '/images/icons/crossy-road.png',
  checkers:      '/images/icons/checkers.png',
  othello:       '/images/icons/othello.png',
  chess:         '/images/icons/chess.png',
  mancala:       '/images/icons/mancala.png',
  match3:        '/images/icons/match-3.png',
  picross:       '/images/icons/picross.png',
  minesweeper:   '/images/icons/minesweeper.png',
  mastermind:    '/images/icons/mastermind.png',
};

type Props = {
  games: readonly GameDefinition[];
  onSelect: (id: GameId) => void;
};

/** CSS injected at runtime for hover/transition effects (inline styles can't do :hover) */
const GLOBAL_STYLES = `
.ns-game-card {
  display: grid;
  gap: 8px;
  text-align: left;
  background: rgba(255, 250, 235, 0.88);
  border: 2px solid rgba(196, 132, 75, 0.22);
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  cursor: pointer;
  color: #5f442c;
  font-family: inherit;
  box-shadow: 0 4px 14px rgba(112, 78, 42, 0.08);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.ns-game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(112, 78, 42, 0.18);
  border-color: rgba(217, 120, 69, 0.48);
}
.ns-game-card:active {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(112, 78, 42, 0.14);
}
.ns-btn-primary {
  border: none;
  border-radius: 999px;
  padding: 13px 28px;
  background: #d97845;
  color: #fffaf0;
  font-weight: 900;
  font-size: 15px;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 10px 18px rgba(169, 94, 46, 0.26);
  transition: background 0.15s, transform 0.12s;
}
.ns-btn-primary:hover { background: #c76835; transform: translateY(-1px); }
.ns-btn-secondary {
  border: 2px solid rgba(139, 93, 51, 0.30);
  border-radius: 999px;
  padding: 11px 24px;
  background: #fff9ea;
  color: #6b4328;
  font-weight: 900;
  font-size: 15px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s;
}
.ns-btn-secondary:hover { background: #fff0d8; border-color: rgba(139, 93, 51, 0.52); }
`;

export default function GameMenu({ games, onSelect }: Props) {
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const [feedbackStatus, setFeedbackStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);
  const firstGame = games[0];

  const handleFeedbackSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedbackStatus('idle');
    setIsSubmittingFeedback(true);
    try {
      const response = await fetch(FORMSPREE_FEEDBACK_ENDPOINT, {
        method: 'POST',
        body: new FormData(event.currentTarget),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Feedback request failed');
      event.currentTarget.reset();
      setFeedbackStatus('success');
    } catch {
      setFeedbackStatus('error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const Card: React.FC<{ title: string; desc: string; icon?: string; onClick: () => void }> = ({
    title,
    desc,
    icon,
    onClick,
  }) => (
    <button
      className="ns-game-card"
      onClick={onClick}
      style={icon ? { padding: 0, overflow: 'hidden', gap: 0 } : undefined}
    >
      {icon && (
        <img
          src={icon}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{
            width: '100%',
            height: 140,
            objectFit: 'cover',
            display: 'block',
            borderRadius: '10px 10px 0 0',
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div style={{ padding: icon ? '12px 14px 14px' : undefined, display: 'grid', gap: 6 }}>
        <div style={{ fontWeight: 800, fontSize: 17 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#7c6047', lineHeight: 1.45 }}>{desc}</div>
      </div>
    </button>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    border: '2px solid rgba(139, 93, 51, 0.2)',
    borderRadius: 8,
    padding: '11px 12px',
    background: '#fff9ea',
    color: '#5f442c',
    font: 'inherit',
    outlineColor: '#d97845',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 14% 18%, rgba(255, 226, 145, 0.7), transparent 24%), ' +
          'radial-gradient(circle at 86% 12%, rgba(176, 220, 167, 0.56), transparent 22%), ' +
          'linear-gradient(180deg, #fff4d8 0%, #f7dfb5 58%, #f0d49a 100%)',
        color: '#5f442c',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans KR", sans-serif',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Inject hover/transition styles */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <div style={{ display: 'grid', gap: 24, width: '100%', maxWidth: 960, padding: 'clamp(16px, 5vw, 40px)' }}>

        {/* ── Hero ── */}
        <div
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '2px solid rgba(139, 93, 51, 0.18)',
            boxShadow: '0 18px 42px rgba(112, 78, 42, 0.16)',
            background: 'rgba(255, 250, 235, 0.75)',
          }}
        >
          {/* Responsive banner image */}
          <picture>
            <source media="(max-width: 640px)" srcSet="/images/brand/hero-mobile.webp" />
            <img
              src="/images/brand/hero-desktop.webp"
              alt="Noah Studio Mini Games 배너"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                maxHeight: 'clamp(200px, 50vw, 420px)',
              }}
              loading="eager"
            />
          </picture>

          {/* Title + subtitle + buttons */}
          <div
            style={{
              display: 'grid',
              gap: 14,
              textAlign: 'center',
              justifyItems: 'center',
              padding: 'clamp(18px, 5vw, 38px) clamp(14px, 5vw, 42px)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#a86f3c',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Tiny stories, tiny games
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(26px, 7vw, 52px)',
                lineHeight: 1.05,
                color: '#6b4328',
                fontWeight: 900,
              }}
            >
              Noah Studio Mini Games
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 'clamp(14px, 3vw, 19px)',
                lineHeight: 1.55,
                color: '#7b5b3d',
                maxWidth: 480,
              }}
            >
              작은 이야기와 귀여운 게임이 자라는 공간
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
              <button
                className="ns-btn-primary"
                onClick={() => firstGame && onSelect(firstGame.id)}
              >
                Start Game
              </button>
              <button
                className="ns-btn-secondary"
                onClick={() => setShowHowToPlay((v) => !v)}
              >
                How to Play
              </button>
            </div>
          </div>
        </div>

        {/* ── How to Play panel ── */}
        {showHowToPlay && (
          <div
            style={{
              background: 'rgba(255, 250, 235, 0.85)',
              border: '2px dashed rgba(139, 93, 51, 0.26)',
              borderRadius: 12,
              padding: '18px 20px',
              lineHeight: 1.65,
              color: '#705037',
            }}
          >
            <p style={{ margin: '0 0 8px' }}>
              카드를 클릭해 게임을 시작하거나, 단축키를 눌러 바로 이동하세요. 각 게임의 조작법은 게임 화면 하단에 표시됩니다.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              공통 조작: <strong>R</strong> 재시작 · <strong>Space/P</strong> 일시정지 · <strong>Esc</strong> 메뉴로 돌아가기
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#8a6a4b' }}>
              대부분의 게임은 터치도 지원합니다. 캔버스 게임은 스와이프로 방향을 조작할 수 있어요.
            </p>
          </div>
        )}

        {/* ── Game cards grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            alignItems: 'stretch',
            width: '100%',
          }}
        >
          {games.map((g) => (
            <Card key={g.id} title={g.title} desc={g.description} icon={GAME_ICONS[g.id]} onClick={() => onSelect(g.id)} />
          ))}
        </div>

        {/* ── Hotkey tip bar ── */}
        <div
          style={{
            fontSize: 12,
            color: '#846145',
            textAlign: 'center',
            lineHeight: 1.8,
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

        {/* ── Feedback section ── */}
        <section
          aria-labelledby="feedback-title"
          style={{
            display: 'grid',
            gap: 14,
            background: 'rgba(255, 250, 235, 0.82)',
            border: '2px solid rgba(196, 132, 75, 0.24)',
            borderRadius: 12,
            padding: 'clamp(18px, 4vw, 24px)',
            boxShadow: '0 10px 24px rgba(112, 78, 42, 0.10)',
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <h2
              id="feedback-title"
              style={{ margin: 0, color: '#6b4328', fontSize: 'clamp(20px, 4vw, 28px)', lineHeight: 1.1 }}
            >
              Send Feedback
            </h2>
            <p style={{ margin: 0, color: '#7c6047', fontSize: 14, lineHeight: 1.5 }}>
              Report a bug, tell us how the difficulty feels, or suggest a new mini game idea.
            </p>
          </div>

          <form onSubmit={handleFeedbackSubmit} style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6, color: '#6b4328', fontWeight: 800 }}>
              nickname
              <input name="nickname" type="text" autoComplete="nickname" required style={inputStyle} />
            </label>

            <label style={{ display: 'grid', gap: 6, color: '#6b4328', fontWeight: 800 }}>
              feedback_type
              <select name="feedback_type" required defaultValue="bug" style={inputStyle}>
                <option value="bug">bug</option>
                <option value="difficulty">difficulty</option>
                <option value="idea">idea</option>
                <option value="other">other</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6, color: '#6b4328', fontWeight: 800 }}>
              message
              <textarea
                name="message"
                required
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.45 }}
              />
            </label>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={isSubmittingFeedback}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  padding: '12px 20px',
                  background: isSubmittingFeedback ? '#c9a17e' : '#d97845',
                  color: '#fffaf0',
                  fontWeight: 900,
                  fontSize: 15,
                  cursor: isSubmittingFeedback ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 10px 18px rgba(169, 94, 46, 0.2)',
                }}
              >
                {isSubmittingFeedback ? 'Sending...' : 'Send'}
              </button>

              {feedbackStatus === 'success' && (
                <span role="status" style={{ color: '#4f7f3c', fontWeight: 800 }}>
                  Thank you. Your feedback was sent.
                </span>
              )}
              {feedbackStatus === 'error' && (
                <span role="alert" style={{ color: '#a64735', fontWeight: 800 }}>
                  Feedback could not be sent. Please try again.
                </span>
              )}
            </div>
          </form>
        </section>

        {/* ── Footer ── */}
        <footer
          style={{
            borderTop: '1px solid rgba(139, 93, 51, 0.18)',
            paddingTop: 28,
            paddingBottom: 12,
            textAlign: 'center',
            display: 'grid',
            gap: 6,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 15, color: '#6b4328' }}>
            Noah Studio Mini Games
          </div>
          <div style={{ fontSize: 13, color: '#8a6a4b' }}>
            Tiny stories, tiny games, cozy little fun.
          </div>

          {/* Footer navigation — add links here as the site grows */}
          <nav
            aria-label="Footer links"
            style={{
              display: 'flex',
              gap: 20,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: 8,
              fontSize: 13,
              color: '#a08060',
            }}
          >
            {/* e.g. <a href="...">About</a> */}
          </nav>

          <div style={{ fontSize: 11, color: '#b09070', marginTop: 10 }}>
            © Noah Studio. All rights reserved.
          </div>
        </footer>

      </div>
    </div>
  );
}
