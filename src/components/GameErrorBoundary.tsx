import React from 'react';

type Props = {
  children: React.ReactNode;
  gameId: string;
  onBackToMenu: () => void;
};

type State = {
  copyStatus: string;
  errorCode: string | null;
  retryKey: number;
};

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.1';

function browserCategory() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/tablet|ipad/.test(userAgent)) return 'tablet';
  if (/mobile|iphone|android/.test(userAgent)) return 'mobile';
  return 'desktop';
}

function safeErrorCode(gameId: string, error: Error) {
  const errorKind = error.name === 'ChunkLoadError' ? 'LOAD' : 'RUNTIME';
  return `GAME-${gameId.toUpperCase()}-${errorKind}`;
}

function buttonStyle(background: string, color: string): React.CSSProperties {
  return {
    minWidth: 120,
    minHeight: 44,
    border: 0,
    borderRadius: 999,
    padding: '10px 16px',
    background,
    color,
    fontWeight: 800,
    cursor: 'pointer',
  };
}

export default class GameErrorBoundary extends React.Component<Props, State> {
  state: State = {
    copyStatus: '',
    errorCode: null,
    retryKey: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { errorCode: error.name === 'ChunkLoadError' ? 'LOAD' : 'RUNTIME' };
  }

  componentDidCatch(error: Error) {
    this.setState({ errorCode: safeErrorCode(this.props.gameId, error) });
  }

  componentDidUpdate(previousProps: Props) {
    if (previousProps.gameId !== this.props.gameId && this.state.errorCode) {
      this.setState({ copyStatus: '', errorCode: null, retryKey: 0 });
    }
  }

  private retry = () => {
    this.setState((state) => ({
      copyStatus: '',
      errorCode: null,
      retryKey: state.retryKey + 1,
    }));
  };

  private copySafeReport = async () => {
    const report = [
      `game_id=${this.props.gameId}`,
      `app_version=${APP_VERSION}`,
      `device=${browserCategory()}`,
      `error_code=${this.state.errorCode || 'GAME-UNKNOWN'}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(report);
      this.setState({ copyStatus: '안전한 오류 정보를 복사했습니다.' });
    } catch {
      this.setState({ copyStatus: '복사하지 못했습니다. 메뉴로 돌아가 다시 시도해 주세요.' });
    }
  };

  render() {
    if (!this.state.errorCode) {
      return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
    }

    return (
      <main
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: '#fbf3e2',
          color: '#6b4328',
        }}
      >
        <section
          style={{
            width: 'min(520px, 100%)',
            display: 'grid',
            gap: 16,
            padding: 24,
            border: '2px solid rgba(139, 93, 51, 0.22)',
            borderRadius: 20,
            background: '#fff9ea',
            textAlign: 'center',
          }}
        >
          <div aria-hidden="true" style={{ fontSize: 44 }}>🛠️</div>
          <h1 style={{ margin: 0, fontSize: 24 }}>게임을 불러오는 중 문제가 생겼습니다</h1>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            다른 정보는 저장하거나 전송하지 않았습니다. 다시 시작하거나 게임 메뉴로 돌아갈 수 있습니다.
          </p>
          <code style={{ fontSize: 13 }}>{this.state.errorCode}</code>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            <button type="button" onClick={this.retry} style={buttonStyle('#d97845', '#fffaf0')}>
              다시 시작
            </button>
            <button type="button" onClick={this.props.onBackToMenu} style={buttonStyle('#f0dcc2', '#6b4328')}>
              메뉴로 돌아가기
            </button>
            <button type="button" onClick={this.copySafeReport} style={buttonStyle('#f0dcc2', '#6b4328')}>
              안전한 오류 정보 복사
            </button>
          </div>
          {this.state.copyStatus && <p role="status" style={{ margin: 0, fontSize: 13 }}>{this.state.copyStatus}</p>}
        </section>
      </main>
    );
  }
}
