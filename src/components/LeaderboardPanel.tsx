import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getAnonymousUserId } from '../utils/anonymousUser';

const GAME_ID = 'noah-ping-pong-garden';
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

type ScoreEntry = {
  id: number;
  nickname: string;
  score: number;
  game_id: string;
  created_at: string;
};

type LeaderboardResponse = {
  today: ScoreEntry[];
  all_time: ScoreEntry[];
};

type Props = {
  finalScore: {
    player: number;
    ai: number;
  } | null;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function buttonStyle(kind: 'primary' | 'secondary'): React.CSSProperties {
  return {
    border: kind === 'primary' ? 'none' : '2px solid rgba(107, 67, 40, 0.24)',
    borderRadius: 999,
    padding: kind === 'primary' ? '11px 18px' : '9px 16px',
    background: kind === 'primary' ? '#d97845' : '#fff9ea',
    color: kind === 'primary' ? '#fffaf0' : '#6b4328',
    fontWeight: 800,
    cursor: 'pointer',
  };
}

function loadTurnstileScript() {
  const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');
  if (existing) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script failed to load.'));
    document.head.appendChild(script);
  });
}

function ScoreList({ title, scores }: { title: string; scores: ScoreEntry[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 8,
        minWidth: 0,
      }}
    >
      <strong style={{ color: '#6b4328' }}>{title}</strong>
      {scores.length === 0 ? (
        <div style={{ color: '#846145', fontSize: 13 }}>아직 기록이 없습니다.</div>
      ) : (
        <ol style={{ margin: 0, paddingLeft: 24, color: '#705037', lineHeight: 1.7 }}>
          {scores.map((entry) => (
            <li key={`${title}-${entry.id}`}>
              <span style={{ fontWeight: 800 }}>{entry.nickname}</span>
              <span> · {entry.score}점</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function LeaderboardPanel({ finalScore }: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse>({
    today: [],
    all_time: [],
  });
  const [nickname, setNickname] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const score = finalScore?.player ?? 0;
  const canSubmit = useMemo(
    () => Boolean(finalScore && nickname.trim() && turnstileToken && TURNSTILE_SITE_KEY),
    [finalScore, nickname, turnstileToken]
  );

  const refreshLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?game_id=${encodeURIComponent(GAME_ID)}`);
      if (!response.ok) throw new Error('Leaderboard request failed.');
      const data = (await response.json()) as LeaderboardResponse;
      setLeaderboard({
        today: data.today || [],
        all_time: data.all_time || [],
      });
    } catch {
      setMessage('리더보드를 불러오지 못했습니다. Cloudflare Pages 배포 설정을 확인하세요.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshLeaderboard();
  }, []);

  useEffect(() => {
    if (!finalScore || !TURNSTILE_SITE_KEY || !widgetRef.current) return;

    let isMounted = true;
    loadTurnstileScript()
      .then(() => {
        if (!isMounted || !window.turnstile || !widgetRef.current || widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(widgetRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => {
            setTurnstileToken(token);
            setMessage('');
          },
          'expired-callback': () => setTurnstileToken(''),
          'error-callback': () => {
            setTurnstileToken('');
            setMessage('Turnstile 확인에 실패했습니다. 다시 시도해 주세요.');
          },
        });
      })
      .catch(() => setMessage('Turnstile 스크립트를 불러오지 못했습니다.'));

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [finalScore]);

  const submitScore = async () => {
    if (!finalScore) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nickname,
          score,
          game_id: GAME_ID,
          anonymous_user_id: getAnonymousUserId(),
          turnstile_token: turnstileToken,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Score submission failed.');
      }

      setMessage('점수를 저장했습니다.');
      setTurnstileToken('');
      if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
      await refreshLeaderboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '점수 저장에 실패했습니다.');
      if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
      setTurnstileToken('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
        width: '100%',
        color: '#6b4328',
      }}
    >
      {finalScore && (
        <div
          style={{
            display: 'grid',
            gap: 10,
            justifyItems: 'center',
            padding: 14,
            borderRadius: 8,
            background: 'rgba(255, 249, 234, 0.72)',
            border: '1px solid rgba(107, 67, 40, 0.16)',
          }}
        >
          <strong>리더보드에 점수 남기기</strong>
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={20}
            placeholder="닉네임"
            style={{
              width: 'min(280px, 100%)',
              border: '2px solid rgba(107, 67, 40, 0.2)',
              borderRadius: 999,
              padding: '10px 14px',
              background: '#fffdf5',
              color: '#6b4328',
              fontWeight: 700,
              outline: 'none',
            }}
          />
          {TURNSTILE_SITE_KEY ? (
            <div ref={widgetRef} />
          ) : (
            <div style={{ color: '#9b5f31', fontSize: 13, textAlign: 'center' }}>
              `VITE_TURNSTILE_SITE_KEY`가 설정되면 점수 제출이 활성화됩니다.
            </div>
          )}
          <button
            onClick={submitScore}
            disabled={!canSubmit || isSubmitting}
            style={{
              ...buttonStyle('primary'),
              opacity: !canSubmit || isSubmitting ? 0.55 : 1,
              cursor: !canSubmit || isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? '저장 중...' : 'Submit Score'}
          </button>
        </div>
      )}

      {message && (
        <div style={{ color: '#7a5535', textAlign: 'center', fontSize: 13 }}>{message}</div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          padding: 14,
          borderRadius: 8,
          background: 'rgba(255, 249, 234, 0.52)',
          border: '1px solid rgba(107, 67, 40, 0.14)',
        }}
      >
        <ScoreList title="Today TOP 10" scores={leaderboard.today} />
        <ScoreList title="All-time TOP 10" scores={leaderboard.all_time} />
      </div>

      <button onClick={refreshLeaderboard} disabled={isLoading} style={buttonStyle('secondary')}>
        {isLoading ? 'Loading...' : 'Refresh Leaderboard'}
      </button>
    </div>
  );
}

