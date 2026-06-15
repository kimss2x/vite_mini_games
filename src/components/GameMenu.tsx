import React from 'react';
import { GameDefinition, GameId, GameCategory, GAME_CATEGORIES } from '../games';
import AdPlaceholder from './AdPlaceholder';

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

const CATEGORY_ICONS: Record<GameCategory, string> = {
  Arcade:   '🕹️',
  Puzzle:   '🧩',
  Strategy: '♟️',
  Reflex:   '⚡',
  Rhythm:   '🎵',
  Casual:   '🌿',
};

type Props = {
  games: readonly GameDefinition[];
  onSelect: (id: string) => void;
};

const GLOBAL_STYLES = `
.ns-game-card {
  display: grid;
  gap: 0;
  text-align: left;
  background: rgba(255, 250, 235, 0.88);
  border: 2px solid rgba(196, 132, 75, 0.22);
  border-radius: 12px;
  width: 100%;
  cursor: pointer;
  color: #5f442c;
  font-family: inherit;
  box-shadow: 0 4px 14px rgba(112, 78, 42, 0.08);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  overflow: hidden;
  padding: 0;
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
.ns-game-card:focus-visible {
  outline: 3px solid #d97845;
  outline-offset: 2px;
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
.ns-btn-primary:focus-visible { outline: 3px solid #6b4328; outline-offset: 3px; }
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
.ns-cat-tab {
  border: 1.5px solid rgba(139, 93, 51, 0.22);
  border-radius: 999px;
  padding: 7px 14px;
  background: rgba(255, 250, 235, 0.75);
  color: #7c6047;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap;
}
.ns-cat-tab:hover { background: rgba(255, 240, 210, 0.9); border-color: rgba(217, 120, 69, 0.4); color: #6b4328; }
.ns-cat-tab.active { background: #d97845; border-color: #d97845; color: #fffaf0; }
.ns-footer-link {
  background: none;
  border: none;
  cursor: pointer;
  color: #a08060;
  font-family: inherit;
  font-size: 13px;
  padding: 4px 2px;
  text-decoration: none;
  transition: color 0.15s;
}
.ns-footer-link:hover { color: #6b4328; }
`;

export default function GameMenu({ games, onSelect }: Props) {
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const [feedbackStatus, setFeedbackStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<GameCategory | 'All'>('All');
  const firstGame = games[0];

  const filteredGames = activeCategory === 'All'
    ? games
    : games.filter((g) => (g as { category?: GameCategory }).category === activeCategory);

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

  const Card: React.FC<{ game: GameDefinition; onClick: () => void }> = ({ game, onClick }) => {
    const icon = GAME_ICONS[game.id as GameId];
    const cat = (game as { category?: GameCategory }).category;
    return (
      <button
        className="ns-game-card"
        onClick={onClick}
        aria-label={`Play ${game.title}`}
      >
        {icon && (
          <img
            src={icon}
            alt={`${game.title} game icon`}
            loading="lazy"
            style={{
              width: '100%',
              height: 130,
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div style={{ padding: '12px 14px 14px', display: 'grid', gap: 5 }}>
          {cat && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a86f3c', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {CATEGORY_ICONS[cat]} {cat}
            </span>
          )}
          <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{game.title}</div>
          <div style={{ fontSize: 12, color: '#7c6047', lineHeight: 1.45 }}>{game.description}</div>
        </div>
      </button>
    );
  };

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
          <picture>
            <source media="(max-width: 640px)" srcSet="/images/brand/hero-mobile.webp" />
            <img
              src="/images/brand/hero-desktop.webp"
              alt="Noah Studio Mini Games — browser-based original mini games"
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 'clamp(200px, 50vw, 420px)', objectFit: 'cover' }}
              loading="eager"
            />
          </picture>

          <div
            style={{
              display: 'grid',
              gap: 14,
              textAlign: 'center',
              justifyItems: 'center',
              padding: 'clamp(18px, 5vw, 38px) clamp(14px, 5vw, 42px)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#a86f3c', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Tiny stories, tiny games
            </div>

            <h1 style={{ margin: 0, fontSize: 'clamp(26px, 7vw, 52px)', lineHeight: 1.05, color: '#6b4328', fontWeight: 900 }}>
              Noah Studio Mini Games
            </h1>

            <p style={{ margin: 0, fontSize: 'clamp(13px, 2.5vw, 17px)', lineHeight: 1.6, color: '#7b5b3d', maxWidth: 520 }}>
              브라우저에서 바로 즐기는 오리지널 창작 미니게임 모음 — 다운로드 없이, 로그인 없이.
              <br />
              <span style={{ fontSize: '0.9em', opacity: 0.85 }}>
                Original browser mini games by Noah Studio. No download, no login.
              </span>
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
              <button
                className="ns-btn-primary"
                onClick={() => firstGame && onSelect(firstGame.id)}
                aria-label="Start playing the first game"
              >
                Play Now
              </button>
              <button
                className="ns-btn-secondary"
                onClick={() => setShowHowToPlay((v) => !v)}
                aria-expanded={showHowToPlay}
              >
                How to Play
              </button>
            </div>
          </div>
        </div>

        {/* ── How to Play panel ── */}
        {showHowToPlay && (
          <div
            role="region"
            aria-label="How to play instructions"
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
              카드를 클릭해 게임을 시작하거나, 단축키를 눌러 바로 이동하세요.
            </p>
            <p style={{ margin: '0 0 8px' }}>
              공통 조작: <strong>R</strong> 재시작 · <strong>Space/P</strong> 일시정지 · <strong>Esc</strong> 메뉴로 돌아가기
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#8a6a4b' }}>
              대부분의 게임은 터치를 지원합니다. 캔버스 게임은 스와이프로 방향을 조작할 수 있어요.
            </p>
          </div>
        )}

        {/* ── Category filter ── */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#a86f3c', marginBottom: 10 }}>
            Browse by category
          </div>
          <div
            role="tablist"
            aria-label="Game categories"
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
          >
            <button
              role="tab"
              aria-selected={activeCategory === 'All'}
              className={`ns-cat-tab${activeCategory === 'All' ? ' active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              🎮 All ({games.length})
            </button>
            {GAME_CATEGORIES.map((cat) => {
              const count = games.filter((g) => (g as { category?: GameCategory }).category === cat).length;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={activeCategory === cat}
                  className={`ns-cat-tab${activeCategory === cat ? ' active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {CATEGORY_ICONS[cat]} {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Game cards grid ── */}
        <div
          role="list"
          aria-label={`${activeCategory === 'All' ? 'All' : activeCategory} games`}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 14,
            alignItems: 'stretch',
            width: '100%',
          }}
        >
          {filteredGames.map((g) => (
            <div key={g.id} role="listitem">
              <Card game={g} onClick={() => onSelect(g.id)} />
            </div>
          ))}
        </div>

        {/* ── Ad placeholder — below game list, not near controls ── */}
        <div aria-label="Advertisement section">
          <AdPlaceholder size="banner" />
        </div>

        {/* ── Hotkey tip bar ── */}
        <details style={{ fontSize: 12, color: '#846145', lineHeight: 1.8 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, marginBottom: 6, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⌨️ Keyboard shortcuts
          </summary>
          <div style={{ paddingTop: 6 }}>
            {games.map((g, i) => (
              <span key={g.id}>
                <b>{g.hotkey.toUpperCase()}</b> = {g.tipName}
                {i < games.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </details>

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
              style={{ margin: 0, color: '#6b4328', fontSize: 'clamp(18px, 4vw, 24px)', lineHeight: 1.1 }}
            >
              Send Feedback
            </h2>
            <p style={{ margin: 0, color: '#7c6047', fontSize: 14, lineHeight: 1.5 }}>
              Report a bug, share how the difficulty feels, or suggest a new mini game idea.
            </p>
          </div>

          <form onSubmit={handleFeedbackSubmit} style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6, color: '#6b4328', fontWeight: 800, fontSize: 14 }}>
              Nickname
              <input name="nickname" type="text" autoComplete="nickname" required style={inputStyle} placeholder="Your name or handle" />
            </label>

           
            <label style={{ display: 'grid', gap: 6, color: '#6b4328', fontWeight: 800, fontSize: 14 }}>
              Message
              <textarea
                name="message"
                required
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Describe the bug, your idea, or difficulty feedback…"
                aria-label="Feedback message"
              />
            </label>

            <input type="hidden" name="_subject" value="Noah Studio Mini Games — Feedback" />

            <button
              type="submit"
              className="ns-btn-primary"
              disabled={isSubmittingFeedback}
              style={{ justifySelf: 'start' }}
            >
              {isSubmittingFeedback ? 'Sending…' : 'Send Feedback'}
            </button>

            {feedbackStatus === 'success' && (
              <p role="status" style={{ margin: 0, color: '#5a8a4a', fontWeight: 700, fontSize: 14 }}>
                ✅ Thanks! Your feedback has been sent.
              </p>
            )}
            {feedbackStatus === 'error' && (
              <p role="alert" style={{ margin: 0, color: '#c04a3a', fontWeight: 700, fontSize: 14 }}>
                ❌ Something went wrong. Please try again.
              </p>
            )}
          </form>
        </section>

        {/* ── Footer ── */}
        <footer
          style={{
            display: 'grid',
            gap: 10,
            textAlign: 'center',
            paddingTop: 8,
            paddingBottom: 16,
          }}
        >
          <nav aria-label="Site pages" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 16px' }}>
            <button className="ns-footer-link" onClick={() => onSelect('about')} aria-label="About Noah Studio Mini Games">About</button>
            <button className="ns-footer-link" onClick={() => onSelect('privacy')} aria-label="Privacy Policy">Privacy Policy</button>
            <button className="ns-footer-link" onClick={() => onSelect('contact')} aria-label="Contact us">Contact</button>
            <button className="ns-footer-link" onClick={() => onSelect('terms')} aria-label="Terms and Disclaimer">Terms &amp; Disclaimer</button>
          </nav>
          <p style={{ margin: 0, fontSize: 11, color: '#b09070', lineHeight: 1.6 }}>
            © {new Date().getFullYear()} Noah Studio Mini Games. All games and assets are original or used with permission.
          </p>
        </footer>

      </div>
    </div>
  );
}
