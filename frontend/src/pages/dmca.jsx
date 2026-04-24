// frontend/src/pages/dmca.jsx
// Section 1: DMCA Takedown Process — Safe Harbor Protection
import Head from 'next/head';
import Link from 'next/link';

export default function DmcaPage() {
  return (
    <>
      <Head>
        <title>DMCA Takedown Policy — clipX</title>
        <meta name="description" content="clipX DMCA takedown process for reporting copyright infringement. Submit your DMCA notice to protect your intellectual property." />
      </Head>
      <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#e5e7eb', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
          {/* Header */}
          <Link href="/" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
            ← Back to clipX
          </Link>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            DMCA Takedown Policy
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '40px' }}>
            Last updated: April 2026
          </p>

          {/* Section 1: Safe Harbor Statement */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              1. Safe Harbor Statement
            </h2>
            <p style={{ lineHeight: 1.7, color: '#d1d5db', fontSize: '15px' }}>
              clipX respects the intellectual property rights of others and expects its users to do the same.
              In accordance with the Digital Millennium Copyright Act of 1998 (DMCA), the text of which may be found
              on the U.S. Copyright Office website at <a href="https://www.copyright.gov/legislation/dmca.pdf" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>copyright.gov</a>,
              clipX will respond expeditiously to claims of copyright infringement committed using the clipX platform
              that are reported to our designated Copyright Agent.
            </p>
          </section>

          {/* Section 2: Filing a DMCA Notice */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              2. Filing a DMCA Takedown Notice
            </h2>
            <p style={{ lineHeight: 1.7, color: '#d1d5db', fontSize: '15px', marginBottom: '16px' }}>
              If you believe that content hosted on clipX infringes your copyright, please send a written notification
              containing the following information to our designated Copyright Agent:
            </p>
            <ol style={{ lineHeight: 2, color: '#d1d5db', fontSize: '15px', paddingLeft: '20px' }}>
              <li>A physical or electronic signature of the copyright owner or an authorized representative.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the material that is claimed to be infringing, including the URL or other specific location on the platform.</li>
              <li>Your contact information: address, telephone number, and email address.</li>
              <li>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on behalf of the owner.</li>
            </ol>
          </section>

          {/* Section 3: Contact */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              3. Designated Copyright Agent
            </h2>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', lineHeight: 1.8, fontSize: '15px' }}>
              <p style={{ margin: '0 0 4px', color: '#fff', fontWeight: 600 }}>DMCA Agent — clipX Legal Team</p>
              <p style={{ margin: 0, color: '#d1d5db' }}>
                Email: <a href="mailto:dmca@clipx.app" style={{ color: '#60a5fa' }}>dmca@clipx.app</a><br/>
                Subject Line: DMCA Takedown Notice — [Your Name]<br/>
              </p>
            </div>
          </section>

          {/* Section 4: Counter-Notification */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              4. Counter-Notification
            </h2>
            <p style={{ lineHeight: 1.7, color: '#d1d5db', fontSize: '15px' }}>
              If you believe that content you posted was removed or access to it was disabled by mistake or misidentification,
              you may submit a counter-notification to our Copyright Agent containing:
            </p>
            <ul style={{ lineHeight: 2, color: '#d1d5db', fontSize: '15px', paddingLeft: '20px', marginTop: '12px' }}>
              <li>Your physical or electronic signature.</li>
              <li>Identification of the material that was removed or to which access was disabled and where it appeared before it was removed.</li>
              <li>A statement under penalty of perjury that you have a good-faith belief the material was removed or disabled as a result of mistake or misidentification.</li>
              <li>Your name, address, and telephone number, and a statement that you consent to the jurisdiction of the applicable federal court.</li>
            </ul>
          </section>

          {/* Section 5: Repeat Infringers */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              5. Repeat Infringer Policy
            </h2>
            <p style={{ lineHeight: 1.7, color: '#d1d5db', fontSize: '15px' }}>
              In accordance with the DMCA, clipX has adopted a policy of terminating, in appropriate circumstances,
              the accounts of users who are deemed to be repeat infringers. clipX may also, at its sole discretion,
              limit access to the platform and/or terminate the accounts of any users who infringe any intellectual
              property rights of others, whether or not there is any repeat infringement.
            </p>
          </section>

          {/* Section 6: Response Timeline */}
          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              6. Response Timeline
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { step: '1', label: 'Notice Received', time: 'Day 0', desc: 'DMCA notice is logged and acknowledged via auto-response.' },
                { step: '2', label: 'Content Review', time: '1–3 Days', desc: 'Legal team reviews the notice and identifies infringing material.' },
                { step: '3', label: 'Content Removal', time: '3–5 Days', desc: 'Infringing content is removed or access is disabled.' },
                { step: '4', label: 'User Notification', time: '5–7 Days', desc: 'The user who posted the content is notified of the takedown.' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{s.step}</div>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: '14px', margin: 0 }}>{s.label} <span style={{ color: '#6b7280', fontWeight: 400 }}>— {s.time}</span></p>
                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: '2px 0 0' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <p style={{ color: '#4b5563', fontSize: '13px' }}>
              For general support, contact <a href="mailto:support@clipx.app" style={{ color: '#60a5fa' }}>support@clipx.app</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
