import React from 'react';

const PAGE_STYLES = `
.ns-page-nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  color: #a86f3c;
  padding: 6px 12px;
  border-radius: 999px;
  transition: background 0.15s, color 0.15s;
  text-decoration: none;
  display: inline-block;
}
.ns-page-nav-btn:hover {
  background: rgba(217, 120, 69, 0.12);
  color: #6b4328;
}
.ns-page-nav-btn.active {
  background: rgba(217, 120, 69, 0.18);
  color: #6b4328;
}
.ns-inline-link {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  color: #d97845;
  font-weight: 700;
  padding: 0;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.15s;
}
.ns-inline-link:hover {
  text-decoration-color: #d97845;
}
.ns-section h2 {
  color: #6b4328;
  font-weight: 800;
  font-size: 20px;
  margin: 0 0 10px;
}
.ns-section p {
  margin: 0 0 10px;
  color: #5f442c;
  line-height: 1.7;
}
.ns-section p:last-child {
  margin-bottom: 0;
}
.ns-section ul {
  margin: 0 0 10px;
  padding-left: 20px;
  color: #5f442c;
  line-height: 1.7;
}
`;

interface PageLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate: (page: string) => void;
}

const NAV_PAGES = [
  { id: 'about', label: 'About' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'contact', label: 'Contact' },
  { id: 'terms', label: 'Terms' },
];

export default function PageLayout({ children, currentPage, onNavigate }: PageLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 14% 18%, rgba(255, 226, 145, 0.7), transparent 24%), ' +
          'radial-gradient(circle at 86% 12%, rgba(176, 220, 167, 0.56), transparent 22%), ' +
          'linear-gradient(180deg, #fff4d8 0%, #f7dfb5 58%, #f0d49a 100%)',
        color: '#5f442c',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans KR", sans-serif',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />

      <div
        style={{
          width: '100%',
          maxWidth: 760,
          padding: 'clamp(16px, 5vw, 40px)',
          display: 'grid',
          gap: 32,
        }}
      >
        {/* ── Top nav ── */}
        <nav
          aria-label="Site navigation"
          style={{
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            flexWrap: 'wrap',
            background: 'rgba(255, 250, 235, 0.75)',
            border: '1px solid rgba(139, 93, 51, 0.18)',
            borderRadius: 999,
            padding: '6px 10px',
          }}
        >
          <button
            className="ns-page-nav-btn"
            onClick={() => onNavigate('menu')}
            aria-label="Go to home / game menu"
          >
            🌱 Home
          </button>
          {NAV_PAGES.map(({ id, label }) => (
            <button
              key={id}
              className={`ns-page-nav-btn${currentPage === id ? ' active' : ''}`}
              onClick={() => onNavigate(id)}
              aria-current={currentPage === id ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* ── Page content ── */}
        <main>{children}</main>

        {/* ── Footer ── */}
        <footer
          style={{
            borderTop: '1px solid rgba(139, 93, 51, 0.18)',
            paddingTop: 24,
            paddingBottom: 12,
            textAlign: 'center',
            display: 'grid',
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 15, color: '#6b4328' }}>
            Noah Studio Mini Games
          </div>
          <nav
            aria-label="Footer links"
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {NAV_PAGES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#a08060',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  padding: '4px 0',
                }}
              >
                {id === 'terms' ? 'Terms & Disclaimer' : label}
              </button>
            ))}
          </nav>
          <div style={{ fontSize: 11, color: '#b09070' }}>
            © {new Date().getFullYear()} Noah Studio Mini Games. All games and assets are original or used with permission.
          </div>
        </footer>
      </div>
    </div>
  );
}
