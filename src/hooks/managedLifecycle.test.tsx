import { render } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useManagedTimeout } from './useManagedTimeout';
import { usePausableAnimationFrame } from './usePausableAnimationFrame';

function TimeoutProbe({ onFire }: { onFire: () => void }) {
  const { schedule } = useManagedTimeout();
  useEffect(() => schedule(onFire, 2_000), [onFire, schedule]);
  return null;
}

function AnimationProbe({ onFrame }: { onFrame: () => void }) {
  usePausableAnimationFrame(onFrame);
  return null;
}

describe('managed game lifecycle', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('unmount 시 예약된 timeout을 제거한다', () => {
    const onFire = vi.fn();
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const { unmount } = render(<TimeoutProbe onFire={onFire} />);

    unmount();
    vi.advanceTimersByTime(2_500);

    expect(clearSpy).toHaveBeenCalled();
    expect(onFire).not.toHaveBeenCalled();
  });

  it('unmount와 hidden 상태에서 RAF를 취소하고 visible 복귀 시 재시작한다', () => {
    let nextId = 1;
    const callbacks = new Map<number, FrameRequestCallback>();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    });
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      callbacks.delete(id);
    });

    const { unmount } = render(<AnimationProbe onFrame={vi.fn()} />);
    expect(callbacks.size).toBe(1);

    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(callbacks.size).toBe(0);

    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(callbacks.size).toBe(1);

    unmount();
    expect(cancelSpy).toHaveBeenCalled();
    expect(callbacks.size).toBe(0);
  });
});
