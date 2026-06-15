import React from 'react';
import PageLayout from '../components/PageLayout';

interface Props {
  onNavigate: (page: string) => void;
}

export default function TermsPage({ onNavigate }: Props) {
  return (
    <PageLayout currentPage="terms" onNavigate={onNavigate}>
      <article style={{ display: 'grid', gap: 28 }}>

        <header>
          <p
            style={{
              margin: '0 0 10px',
              fontSize: 11,
              fontWeight: 800,
              color: '#a86f3c',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Legal
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(24px, 6vw, 38px)',
              color: '#6b4328',
              fontWeight: 900,
              lineHeight: 1.1,
            }}
          >
            Terms &amp; Disclaimer
          </h1>
          <p style={{ margin: '12px 0 0', color: '#8a6a4b', fontSize: 13 }}>
            Last updated: June 2025
          </p>
        </header>

        <section className="ns-section">
          <h2>Acceptance of Terms</h2>
          <p>
            By accessing and using Noah Studio Mini Games (<strong>vite-mini-games.pages.dev</strong>), you
            accept and agree to be bound by these terms and conditions. If you do not agree, please do not
            use this site.
          </p>
        </section>

        <section className="ns-section">
          <h2>Original Games Disclaimer</h2>
          <p>
            All games on this site are <strong>original browser-based creations</strong> by Noah Studio,
            built for entertainment, creative expression, and learning purposes. The games are written from
            scratch using web technologies (HTML5 Canvas, TypeScript, React).
          </p>
          <p>
            Some games are inspired by classic game genres and mechanics (e.g., grid-based puzzle games,
            side-scrolling arcade games, block-stacking games). While certain genres have historical origins
            in classic arcade titles, the implementations on this site are entirely original code and artwork.
          </p>
          <p>
            <strong>
              Noah Studio Mini Games is not officially affiliated with, endorsed by, or sponsored by any
              third-party game developer, publisher, or trademark holder.
            </strong>{' '}
            All game names displayed on this site are either original names created by Noah Studio or
            descriptive genre names in common use.
          </p>
        </section>

        <section className="ns-section">
          <h2>Intellectual Property</h2>
          <p>
            All original code, visual design, game logic, artwork, and written content on this site are
            the intellectual property of Noah Studio unless otherwise stated.
          </p>
          <p>
            You may not reproduce, distribute, modify, or create derivative works from the content on this
            site without prior written permission from Noah Studio.
          </p>
        </section>

        <section className="ns-section">
          <h2>Copyright &amp; Trademark Inquiries</h2>
          <p>
            If you believe any content on this site infringes on your intellectual property rights, please
            contact us with the following information:
          </p>
          <ul>
            <li>Your name and contact information</li>
            <li>A description of the copyrighted work or trademark you claim is being infringed</li>
            <li>The specific URL(s) on this site where the allegedly infringing content appears</li>
            <li>A statement of your good-faith belief that the use is not authorized</li>
          </ul>
          <p>
            We take these inquiries seriously and will respond promptly. Please use our{' '}
            <button className="ns-inline-link" onClick={() => onNavigate('contact')}>
              Contact page
            </button>
            {' '}to reach us.
          </p>
        </section>

        <section className="ns-section">
          <h2>Leaderboard &amp; User Content</h2>
          <p>
            When you submit a score to a leaderboard, you grant Noah Studio a non-exclusive right to display
            your chosen nickname and score on the site. Please do not use offensive, defamatory, or
            personally identifying information as your nickname.
          </p>
          <p>
            We reserve the right to remove any leaderboard entry that violates these guidelines without
            notice.
          </p>
        </section>

        <section className="ns-section">
          <h2>Disclaimer of Warranties</h2>
          <p>
            This site and its games are provided "as is" without warranty of any kind, express or implied.
            Noah Studio does not warrant that the site will be available at all times, error-free, or free
            of viruses or other harmful components.
          </p>
          <p>
            Game scores and leaderboard data may be lost due to technical issues. We are not liable for any
            loss of data or interruption of service.
          </p>
        </section>

        <section className="ns-section">
          <h2>Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Noah Studio shall not be liable for any indirect,
            incidental, special, or consequential damages arising from your use of this site or its games.
          </p>
        </section>

        <section className="ns-section">
          <h2>Changes to These Terms</h2>
          <p>
            We may update these terms from time to time. The "Last updated" date at the top of this page
            reflects the most recent revision. Continued use of the site after changes constitutes
            acceptance of the updated terms.
          </p>
        </section>

        <section className="ns-section">
          <h2>Contact</h2>
          <p>
            For any questions about these terms, please use our{' '}
            <button className="ns-inline-link" onClick={() => onNavigate('contact')}>
              Contact page
            </button>
            .
          </p>
        </section>

      </article>
    </PageLayout>
  );
}
