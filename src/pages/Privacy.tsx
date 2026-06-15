import React from 'react';
import PageLayout from '../components/PageLayout';

interface Props {
  onNavigate: (page: string) => void;
}

export default function PrivacyPage({ onNavigate }: Props) {
  return (
    <PageLayout currentPage="privacy" onNavigate={onNavigate}>
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
            Privacy Policy
          </h1>
          <p style={{ margin: '12px 0 0', color: '#8a6a4b', fontSize: 13 }}>
            Last updated: June 2025
          </p>
        </header>

        <section className="ns-section">
          <h2>Overview</h2>
          <p>
            Noah Studio Mini Games (<strong>vite-mini-games.pages.dev</strong>) is committed to protecting
            your privacy. This policy explains what information we may collect, how we use it, and your choices
            regarding that information. By using this site, you agree to the practices described below.
          </p>
        </section>

        <section className="ns-section">
          <h2>Information we collect</h2>
          <p>We may collect the following types of information:</p>
          <ul>
            <li>
              <strong>Anonymous usage data:</strong> Pages visited, game sessions started, time spent. This
              data does not identify you personally and is used only to improve the site.
            </li>
            <li>
              <strong>Game scores:</strong> When you submit a score to the leaderboard, we store your chosen
              nickname, your score, the game ID, and a timestamp. We do not link this to any personal account
              or identity.
            </li>
            <li>
              <strong>Nicknames:</strong> If you enter a nickname for a leaderboard entry or feedback form,
              that nickname is stored as provided. Please do not use your real name or personally identifying
              information as a nickname.
            </li>
            <li>
              <strong>Feedback submissions:</strong> If you send feedback using the feedback form, we receive
              the nickname, feedback type, and message you enter. This is processed through Formspree (a
              third-party form service).
            </li>
            <li>
              <strong>Browser &amp; device information:</strong> Standard web server logs may include your IP
              address, browser type, operating system, and referring URL. These are used for security and
              performance monitoring and are not shared.
            </li>
          </ul>
        </section>

        <section className="ns-section">
          <h2>Cookies</h2>
          <p>
            This site may use browser cookies or local storage to save game preferences, in-progress game state,
            and user interface settings (such as your selected category filter). These are functional cookies
            and do not track you across other websites.
          </p>
          <p>
            Third-party services used on this site (such as Cloudflare infrastructure) may set their own
            cookies for security and performance purposes.
          </p>
        </section>

        <section className="ns-section">
          <h2>Advertising (Google AdSense)</h2>
          <p>
            This site may display advertisements served by Google AdSense or similar third-party advertising
            networks. When ads are shown:
          </p>
          <ul>
            <li>
              Google and its partners may use cookies and device identifiers to serve ads based on your prior
              visits to this site and other sites on the internet.
            </li>
            <li>
              Google's use of advertising cookies enables it and its partners to serve ads based on your visit
              to this site and/or other sites on the internet.
            </li>
            <li>
              You may opt out of personalized advertising by visiting{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#d97845' }}
              >
                Google's Ads Settings
              </a>
              .
            </li>
            <li>
              For more information about how Google uses data, visit{' '}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#d97845' }}
              >
                How Google uses data when you use our partners' sites or apps
              </a>
              .
            </li>
          </ul>
          <p>
            Advertisements are placed outside of game areas and never inside game canvases or near game
            controls. We do not use pop-up ads, interstitial ads, or reward-based advertising.
          </p>
        </section>

        <section className="ns-section">
          <h2>Third-party services</h2>
          <ul>
            <li>
              <strong>Cloudflare Pages &amp; D1:</strong> Our site is hosted on Cloudflare Pages. Leaderboard
              scores are stored in Cloudflare D1, a serverless database. Cloudflare may collect standard
              network-level data as part of its infrastructure. See{' '}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#d97845' }}
              >
                Cloudflare's Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Formspree:</strong> Feedback form submissions are processed by Formspree. See{' '}
              <a
                href="https://formspree.io/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#d97845' }}
              >
                Formspree's Privacy Policy
              </a>
              .
            </li>
          </ul>
        </section>

        <section className="ns-section">
          <h2>Children's privacy</h2>
          <p>
            This site is intended for general audiences. We do not knowingly collect personal information from
            children under the age of 13. If you believe we have inadvertently collected information from a
            child, please contact us and we will delete it promptly.
          </p>
        </section>

        <section className="ns-section">
          <h2>Data retention &amp; deletion</h2>
          <p>
            Leaderboard scores and feedback submissions are retained for as long as the service operates.
            You may request deletion of any data associated with your nickname by contacting us. We will
            process deletion requests within a reasonable time frame.
          </p>
        </section>

        <section className="ns-section">
          <h2>Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The "Last updated" date at the top of this
            page reflects the most recent revision. Continued use of the site after changes constitutes
            acceptance of the updated policy.
          </p>
        </section>

        <section className="ns-section">
          <h2>Contact</h2>
          <p>
            For privacy inquiries, data deletion requests, or any other privacy-related questions, please use
            our{' '}
            <button className="ns-inline-link" onClick={() => onNavigate('contact')}>
              Contact page
            </button>
            {' '}and select "Privacy inquiry" as the topic.
          </p>
        </section>

      </article>
    </PageLayout>
  );
}
