import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FC } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameErrorBoundary from './GameErrorBoundary';

let shouldThrow = true;

function ControlledThrow() {
  if (shouldThrow) {
    throw new Error('sensitive implementation detail');
  }
  return <div>게임 복구 완료</div>;
}

const AlwaysThrow: FC = () => {
  throw new Error('never expose this message');
};

describe('GameErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('격리된 fallback에서 다시 시작하고 안전한 코드만 표시한다', async () => {
    render(
      <GameErrorBoundary gameId="pingpong" onBackToMenu={vi.fn()}>
        <ControlledThrow />
      </GameErrorBoundary>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('GAME-PINGPONG-RUNTIME');
    expect(screen.queryByText('sensitive implementation detail')).not.toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: '다시 시작' }));
    expect(await screen.findByText('게임 복구 완료')).toBeInTheDocument();
  });

  it('메뉴 복귀를 제공하고 다른 game ID에서 오류 상태를 reset한다', async () => {
    const onBackToMenu = vi.fn();
    const { rerender } = render(
      <GameErrorBoundary gameId="omok" onBackToMenu={onBackToMenu}>
        <AlwaysThrow />
      </GameErrorBoundary>,
    );

    fireEvent.click(await screen.findByRole('button', { name: '메뉴로 돌아가기' }));
    expect(onBackToMenu).toHaveBeenCalledTimes(1);

    rerender(
      <GameErrorBoundary gameId="snake" onBackToMenu={onBackToMenu}>
        <div>새 게임 정상</div>
      </GameErrorBoundary>,
    );

    await waitFor(() => expect(screen.getByText('새 게임 정상')).toBeInTheDocument());
  });
});
