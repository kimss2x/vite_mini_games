import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';

const FORMSPREE = 'https://formspree.io/f/mvznvepj';

interface Props {
  onNavigate: (page: string) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '2px solid rgba(139, 93, 51, 0.2)',
  borderRadius: 8,
  padding: '11px 12px',
  background: '#fff9ea',
  color: '#5f442c',
  fontFamily: 'inherit',
  fontSize: 15,
  outlineColor: '#d97845',
};

export default function ContactPage({ onNavigate }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch(FORMSPREE, {
        method: 'POST',
        body: new FormData(e.currentTarget),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error();
      (e.target as HTMLFormElement).reset();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <PageLayout currentPage="contact" onNavigate={onNavigate}>
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
            Get in touch
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
            Contact Us
          </h1>
          <p
            style={{
              margin: '12px 0 0',
              color: '#7b5b3d',
              fontSize: 'clamp(14px, 2.5vw, 16px)',
              lineHeight: 1.6,
            }}
          >
            Bug reports, game ideas, privacy inquiries — we read everything.
          </p>
        </header>

        {/* Topic guide */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { icon: '🐛', title: 'Bug Report', desc: 'Something broken or not working as expected?' },
            { icon: '💡', title: 'Game Suggestion', desc: 'Have an idea for a new mini game?' },
            { icon: '🔒', title: 'Privacy Inquiry', desc: 'Data deletion or privacy-related questions.' },
            { icon: '✉️', title: 'General', desc: "Anything else you'd like to say." },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              style={{
                background: 'rgba(255, 250, 235, 0.85)',
                border: '1px solid rgba(196, 132, 75, 0.2)',
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontWeight: 800, color: '#6b4328', fontSize: 14, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 13, color: '#7c6047', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <section
          style={{
            background: 'rgba(255, 250, 235, 0.82)',
            border: '2px solid rgba(196, 132, 75, 0.24)',
            borderRadius: 12,
            padding: 'clamp(18px, 4vw, 28px)',
          }}
        >
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '32px 0', display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 40 }}>🌱</div>
              <div style={{ fontWeight: 800, color: '#6b4328', fontSize: 20 }}>Message received!</div>
              <p style={{ margin: 0, color: '#7c6047', lineHeight: 1.6 }}>
                Thank you for reaching out. We'll get back to you as soon as we can.
              </p>
              <button
                onClick={() => setStatus('idle')}
                style={{
                  marginTop: 8,
                  border: 'none',
                  borderRadius: 999,
                  padding: '11px 24px',
                  background: '#d97845',
                  color: '#fffaf0',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  justifySelf: 'center',
                }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <label style={{ display: 'grid', gap: 6, color: '#6b4328', fontWeight: 800, fontSize: 14 }}>
                Nickname or Name
                <input
                  name="nickname"
                  type="text"
                  required
                  placeholder="How should we address you?"
                  style={inputStyle}
                  autoComplete="nickname"
                />
              </label>

              <label style={{ display: 'grid', gap: 6, color: '#6b4328', fontWeight: 800, fontSize: 14 }}>
                Topic
                <select name="feedback_type" required defaultValue="" style={inputStyle}>
                  <option value="" disabled>Select a topic…</option>
                  <option value="bug">🐛 Bug Report</option>
                  <option value="idea">💡 Game Suggestion</option>
                  <option value="privacy">🔒 Privacy Inquiry</option>
                  <option value="other">✉️ General Message</option>
                </select>
              </label>

              <label style={{ display: 'grid', gap: 6, color: '#6b4328', fontWeight: 800, fontSize: 14 }}>
                Message
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Describe your bug, idea, or question in detail…"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </label>

              {/* Hidden field to help route email */}
              <input type="hidden" name="_subject" value="Noah Studio Mini Games — Contact Form" />

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '12px 24px',
                    background: status === 'sending' ? '#c9a17e' : '#d97845',
                    color: '#fffaf0',
                    fontWeight: 900,
                    fontSize: 15,
                    cursor: status === 'sending' ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 8px 18px rgba(169, 94, 46, 0.2)',
                  }}
                >
                  {status === 'sending' ? 'Sending…' : 'Send Message'}
                </button>

                {status === 'error' && (
                  <span role="alert" style={{ color: '#a64735', fontWeight: 800, fontSize: 14 }}>
                    Could not send. Please try again.
                  </span>
                )}
              </div>

              <p style={{ margin: 0, fontSize: 12, color: '#a08060', lineHeight: 1.5 }}>
                This form is powered by Formspree. For privacy inquiries, you can also email us directly — see
                our{' '}
                <button className="ns-inline-link" style={{ fontSize: 12 }} onClick={() => onNavigate('privacy')}>
                  Privacy Policy
                </button>
                {' '}for details.
              </p>
            </form>
          )}
        </section>

      </article>
    </PageLayout>
  );
}
