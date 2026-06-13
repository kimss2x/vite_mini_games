import React from 'react';
import { GameDefinition, GameId } from '../games';

const FORMSPREE_FEEDBACK_ENDPOINT = 'https://formspree.io/f/mvznvepj';

type Props = {
  games: readonly GameDefinition[];
  onSelect: (id: GameId) => void;
};

export default function GameMenu({ games, onSelect }: Props) {
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const [feedbackStatus, setFeedbackStatus] = React.useState<'idle' | 'success' | 'error'>(
    'idle',
  );
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
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Feedback request failed');
      }

      event.currentTarget.reset();
      setFeedbackStatus('success');
    } catch {
      setFeedbackStatus('error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

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

        <section
          aria-labelledby="feedback-title"
          style={{
            display: 'grid',
            gap: 14,
            background: 'rgba(255, 250, 235, 0.82)',
            border: '2px solid rgba(196, 132, 75, 0.24)',
            borderRadius: 8,
            padding: 'clamp(18px, 4vw, 24px)',
            boxShadow: '0 10px 24px rgba(112, 78, 42, 0.12)',
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <h2
              id="feedback-title"
              style={{
                margin: 0,
                color: '#6b4328',
                fontSize: 'clamp(22px, 4.5vw, 30px)',
                lineHeight: 1.1,
              }}
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
              <input
                name="nickname"
                type="text"
                autoComplete="nickname"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: '2px solid rgba(139, 93, 51, 0.2)',
                  borderRadius: 8,
                  padding: '11px 12px',
                  background: '#fff9ea',
                  color: '#5f442c',
                  font: 'inherit',
                  outlineColor: '#d97845',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6, color: '#6b4328', fontWeight: 800 }}>
              feedback_type
              <select
                name="feedback_type"
                required
                defaultValue="bug"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: '2px solid rgba(139, 93, 51, 0.2)',
                  borderRadius: 8,
                  padding: '11px 12px',
                  background: '#fff9ea',
                  color: '#5f442c',
                  font: 'inherit',
                  outlineColor: '#d97845',
                }}
              >
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
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  border: '2px solid rgba(139, 93, 51, 0.2)',
                  borderRadius: 8,
                  padding: '11px 12px',
                  background: '#fff9ea',
                  color: '#5f442c',
                  font: 'inherit',
                  lineHeight: 1.45,
                  outlineColor: '#d97845',
                }}
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
      </div>
    </div>
  );
}
