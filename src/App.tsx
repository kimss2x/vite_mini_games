import React, { useCallback, useEffect, useState, Suspense } from 'react';
import GameMenu from './components/GameMenu';
import { games, GameId } from './games';

// Static page components (lazy loaded)
const AboutPage   = React.lazy(() => import('./pages/About'));
const PrivacyPage = React.lazy(() => import('./pages/Privacy'));
const ContactPage = React.lazy(() => import('./pages/Contact'));
const TermsPage   = React.lazy(() => import('./pages/Terms'));

type PageId = 'about' | 'privacy' | 'contact' | 'terms';
type GameView = GameId | PageId | 'menu';

const PAGE_IDS: PageId[] = ['about', 'privacy', 'contact', 'terms'];

function isPageId(v: string): v is PageId {
  return (PAGE_IDS as string[]).includes(v);
}
function isGameId(v: string): v is GameId {
  return games.some((g) => g.id === v);
}

/** Read initial view from URL hash */
function getInitialView(): GameView {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (isPageId(hash)) return hash;
  if (isGameId(hash)) return hash as GameId;
  return 'menu';
}

// Warm loading fallback
function LoadingFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: '#fbf3e2',
        color: '#8a5a32',
        fontSize: 18,
        fontWeight: 600,
        fontFamily: 'inherit',
      }}
    >
      <div style={{ fontSize: 40 }}>🌱</div>
      <div>불러오는 중…</div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<GameView>(getInitialView);

  // Navigate — updates state + URL hash
  const navigate = useCallback((destination: string) => {
    const next = destination as GameView;
    setView(next);
    window.location.hash = next === 'menu' ? '' : next;
    window.scrollTo(0, 0);
  }, []);

  // Browser back/forward via hashchange
  useEffect(() => {
    const onHashChange = () => setView(getInitialView());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Document title
  useEffect(() => {
    const base = 'Noah Studio Mini Games';
    if (view === 'menu') {
      document.title = base;
    } else if (isPageId(view)) {
      const labels: Record<PageId, string> = {
        about:   'About',
        privacy: 'Privacy Policy',
        contact: 'Contact',
        terms:   'Terms & Disclaimer',
      };
      document.title = `${labels[view]} — ${base}`;
    } else {
      const current = games.find((g) => g.id === view);
      document.title = current ? `${current.title} — ${base}` : base;
    }
  }, [view]);

  // Esc -> menu
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') navigate('menu'); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [navigate]);

  // Hotkeys (menu only)
  useEffect(() => {
    if (view !== 'menu') return;
    const hotkeyMap: Record<string, GameId> = {};
    games.forEach((g) => { hotkeyMap[g.hotkey.toLowerCase()] = g.id; });
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' || target.isContentEditable)) return;
      const id = hotkeyMap[e.key.toLowerCase()];
      if (id) { e.preventDefault(); navigate(id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, navigate]);

  // Render

  if (isPageId(view)) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        {view === 'about'   && <AboutPage   onNavigate={navigate} />}
        {view === 'privacy' && <PrivacyPage onNavigate={navigate} />}
        {view === 'contact' && <ContactPage onNavigate={navigate} />}
        {view === 'terms'   && <TermsPage   onNavigate={navigate} />}
      </Suspense>
    );
  }

  if (view === 'menu') {
    return <GameMenu games={games} onSelect={navigate} />;
  }

  const current = games.find((g) => g.id === view);
  if (!current) return null;
  return <Suspense fallback={<LoadingFallback />}>{current.render()}</Suspense>;
}
