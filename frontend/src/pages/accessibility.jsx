// frontend/src/pages/accessibility.jsx
// Section 1: WCAG 2.1 AA Compliance Statement
import Head from 'next/head';
import Link from 'next/link';

export default function AccessibilityPage() {
  return (
    <>
      <Head>
        <title>Accessibility Statement — clipX</title>
        <meta name="description" content="clipX accessibility commitment. Learn about our WCAG 2.1 AA compliance efforts and how to report accessibility issues." />
      </Head>
      <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e5e7eb', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
          <Link href="/" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
            ← Back to clipX
          </Link>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Accessibility Statement
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '40px' }}>
            Effective: April 2026
          </p>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              Our Commitment
            </h2>
            <p style={{ lineHeight: 1.7, color: '#d1d5db', fontSize: '15px' }}>
              clipX is committed to ensuring digital accessibility for people with disabilities. We are continually
              improving the user experience for everyone and applying the relevant accessibility standards to ensure
              we provide equal access to all users.
            </p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              Conformance Status
            </h2>
            <p style={{ lineHeight: 1.7, color: '#d1d5db', fontSize: '15px', marginBottom: '16px' }}>
              The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to
              improve accessibility for people with disabilities. We aim to conform to <strong style={{ color: '#fff' }}>WCAG 2.1 Level AA</strong>.
            </p>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { label: 'Perceivable', desc: 'Text alternatives for non-text content, captions for media, adaptable content, and sufficient color contrast.', status: '✅' },
                { label: 'Operable', desc: 'Keyboard accessible, sufficient time to interact, no seizure-inducing content, navigable structure.', status: '✅' },
                { label: 'Understandable', desc: 'Readable text, predictable operation, input assistance for forms and errors.', status: '✅' },
                { label: 'Robust', desc: 'Compatible with current and future assistive technologies including screen readers.', status: '✅' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: '12px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '18px' }}>{item.status}</span>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px', margin: 0 }}>{item.label}</p>
                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: '2px 0 0', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              Measures Taken
            </h2>
            <ul style={{ lineHeight: 2, color: '#d1d5db', fontSize: '15px', paddingLeft: '20px' }}>
              <li>Semantic HTML5 elements used throughout the platform.</li>
              <li>ARIA labels and roles applied to interactive elements.</li>
              <li>Skip navigation link (<code style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>Skip to main content</code>) on every page.</li>
              <li>Visible focus indicators with <code style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>:focus-visible</code> ring styling.</li>
              <li>Support for <code style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>prefers-reduced-motion</code> — animations disabled automatically.</li>
              <li>Support for <code style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>prefers-contrast: more</code> — high contrast mode with enhanced visibility.</li>
              <li>Windows High Contrast (forced-colors) support via CSS media queries.</li>
              <li>Screen-reader-only (<code style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>.sr-only</code>) utility for context-only text.</li>
              <li>Color contrast ratios meeting at least 4.5:1 for normal text and 3:1 for large text.</li>
              <li>Video player supports keyboard controls and subtitles/captions.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              Known Limitations
            </h2>
            <ul style={{ lineHeight: 2, color: '#d1d5db', fontSize: '15px', paddingLeft: '20px' }}>
              <li>Some third-party embedded content (trailers from YouTube) may not meet all accessibility standards.</li>
              <li>Older user-uploaded profile images may lack descriptive alt text.</li>
              <li>Live chat and watch party features are being improved for screen reader compatibility.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              Feedback & Contact
            </h2>
            <p style={{ lineHeight: 1.7, color: '#d1d5db', fontSize: '15px' }}>
              We welcome your feedback on the accessibility of clipX. If you encounter accessibility barriers or have
              suggestions for improvement, please contact us:
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', marginTop: '12px', lineHeight: 1.8, fontSize: '15px' }}>
              <p style={{ margin: 0, color: '#d1d5db' }}>
                Email: <a href="mailto:accessibility@clipx.app" style={{ color: '#60a5fa' }}>accessibility@clipx.app</a><br/>
                We aim to respond to accessibility feedback within 5 business days.
              </p>
            </div>
          </section>

          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <p style={{ color: '#4b5563', fontSize: '13px' }}>
              This statement was last reviewed on April 13, 2026.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
