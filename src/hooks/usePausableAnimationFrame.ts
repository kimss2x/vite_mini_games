import { useEffect, useRef } from 'react';

export function usePausableAnimationFrame(
  callback: (timestamp: number, deltaMs: number) => void,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let disposed = false;
    let frameId = 0;
    let lastTimestamp = performance.now();

    const schedule = () => {
      if (!disposed && !document.hidden && frameId === 0) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    const tick = (timestamp: number) => {
      frameId = 0;
      if (disposed || document.hidden) return;

      const deltaMs = Math.min(50, Math.max(0, timestamp - lastTimestamp));
      lastTimestamp = timestamp;
      callbackRef.current(timestamp, deltaMs);
      schedule();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (frameId !== 0) window.cancelAnimationFrame(frameId);
        frameId = 0;
        return;
      }

      lastTimestamp = performance.now();
      schedule();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    schedule();

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
      frameId = 0;
    };
  }, []);
}
