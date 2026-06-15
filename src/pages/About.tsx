import React from 'react';
import PageLayout from '../components/PageLayout';

interface Props {
  onNavigate: (page: string) => void;
}

export default function AboutPage({ onNavigate }: Props) {
  return (
    <PageLayout currentPage="about" onNavigate={onNavigate}>
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
            About Us
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
            Noah Studio Mini Games
          </h1>
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 'clamp(14px, 2.5vw, 17px)',
              color: '#7b5b3d',
              lineHeight: 1.6,
            }}
          >
            A hand-crafted collection of original browser mini games — cozy, warm, and free to play.
          </p>
        </header>

        <section className="ns-section">
          <h2>What is this site?</h2>
          <p>
            Noah Studio Mini Games is a browser-based mini game garden — a growing collection of original
            games you can play directly in your browser without any download, login, or install.
            Every game loads instantly and runs on the page, so you can jump in and start playing in seconds.
          </p>
          <p>
            The site currently features over 50 games across multiple genres: arcade, puzzle, strategy,
            reflex, rhythm, and casual. Whether you have five minutes or an hour, there is something here
            for you.
          </p>
        </section>

        <section className="ns-section">
          <h2>Our games</h2>
          <p>
            Every game on this site is an original creation by Noah Studio, inspired by classic game genres
            but built from scratch with our own design language — warm cream backgrounds, soft pastel colors,
            and a cozy storybook aesthetic.
          </p>
          <p>
            We put real effort into each game: clear controls, meaningful difficulty progression, satisfying
            feedback, and fair scoring. You will find detailed instructions, tips, and controls information
            on each game's start screen.
          </p>
        </section>

        <section className="ns-section">
          <h2>Mobile &amp; desktop</h2>
          <p>
            We design every game to work on both desktop and mobile. Canvas-based action games support touch
            swipe and tap controls. Click-based games work with both mouse and tap. We are continuously
            improving mobile layout, touch controls, and responsive design as the site grows.
          </p>
          <p>
            For the best experience on mobile, we recommend playing in landscape orientation for arcade and
            action games.
          </p>
        </section>

        <section className="ns-section">
          <h2>Leaderboards</h2>
          <p>
            Selected games support global score submission. Enter a nickname when prompted after your game ends
            and your score will appear on the leaderboard. Scores are stored anonymously — we only save the
            nickname you choose, your score, and the game ID.
          </p>
        </section>

        <section className="ns-section">
          <h2>Who makes this?</h2>
          <p>
            This site is made by Noah Studio, a small creative studio focused on interactive experiences and
            digital content. We believe great games can be simple, accessible, and genuinely fun without
            manipulative design, invasive tracking, or disruptive advertising.
          </p>
          <p>
            We are an independent project, not affiliated with any major game publisher or platform.
          </p>
        </section>

        <div
          style={{
            background: 'rgba(255, 250, 235, 0.85)',
            border: '2px solid rgba(196, 132, 75, 0.22)',
            borderRadius: 12,
            padding: '18px 20px',
            display: 'grid',
            gap: 8,
          }}
        >
          <p style={{ margin: 0, color: '#7c6047', lineHeight: 1.6 }}>
            Have a question or suggestion?{' '}
            <button className="ns-inline-link" onClick={() => onNavigate('contact')}>
              Contact us
            </button>
            . To learn how we handle your data, read our{' '}
            <button className="ns-inline-link" onClick={() => onNavigate('privacy')}>
              Privacy Policy
            </button>
            . For legal information about the games, see{' '}
            <button className="ns-inline-link" onClick={() => onNavigate('terms')}>
              Terms &amp; Disclaimer
            </button>
            .
          </p>
        </div>

      </article>
    </PageLayout>
  );
}
