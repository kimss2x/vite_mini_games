import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LeaderboardPanel from './LeaderboardPanel';

const finalScore = { player: 5, ai: 2 };

describe('LeaderboardPanel Turnstile states', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ today: [], all_time: [] }),
    })));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('공개 Site Key가 없으면 게임은 유지하고 이해 가능한 설정 상태를 표시한다', async () => {
    render(<LeaderboardPanel finalScore={finalScore} turnstileSiteKey="" />);

    expect(await screen.findByRole('status')).toHaveTextContent('점수 제출 보안 설정이 아직 준비되지 않았습니다');
    expect(screen.getByRole('button', { name: 'Submit Score' })).toBeDisabled();
  });

  it('공개 Site Key가 있으면 위젯 callback 후 제출 버튼을 활성화한다', async () => {
    const script = document.createElement('script');
    script.dataset.turnstileScript = 'true';
    document.head.appendChild(script);

    const renderWidget = vi.fn((_element, options) => {
      queueMicrotask(() => options.callback('test-token'));
      return 'widget-id';
    });
    window.turnstile = {
      render: renderWidget,
      reset: vi.fn(),
      remove: vi.fn(),
    };

    render(<LeaderboardPanel finalScore={finalScore} turnstileSiteKey="test-public-site-key" />);
    await act(async () => undefined);
    fireEvent.change(screen.getByLabelText('닉네임'), { target: { value: 'Noah' } });

    await waitFor(() => expect(renderWidget).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit Score' })).toBeEnabled());
    expect(screen.queryByText(/보안 설정이 아직 준비되지/)).not.toBeInTheDocument();
  });
});
