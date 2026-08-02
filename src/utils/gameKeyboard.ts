export const GAME_KEYBOARD_CAPTURE_OPTIONS = { capture: true } as const;

type GameKeyboardEventType = 'keydown' | 'keyup';

type GameKeyboardListenerOptions = {
  filterInteractiveTargets?: boolean;
};

function hasBlockingDialog() {
  return Boolean(document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]'));
}

export function shouldIgnoreGameKeyboardEvent(event: KeyboardEvent) {
  if (document.hidden || hasBlockingDialog()) return true;

  const target = event.target;
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], dialog')
  );
}

export function addGameKeyboardListener(
  type: GameKeyboardEventType,
  handler: (event: KeyboardEvent) => void,
  options: GameKeyboardListenerOptions = {},
) {
  const { filterInteractiveTargets = type === 'keydown' } = options;
  const listener = (event: KeyboardEvent) => {
    if (filterInteractiveTargets && shouldIgnoreGameKeyboardEvent(event)) return;
    handler(event);
  };

  window.addEventListener(type, listener, GAME_KEYBOARD_CAPTURE_OPTIONS);
  return () => window.removeEventListener(type, listener, GAME_KEYBOARD_CAPTURE_OPTIONS);
}
