// frontend/src/components/CookieConsent.jsx
// Section 1: Granular Cookie Consent with Analytics vs Essential blocking
import { useState, useEffect, useCallback } from 'react';

const CONSENT_KEY = 'clipx_cookie_consent';
const CONSENT_VERSION = 2; // Bump when adding new categories

const CATEGORIES = [
  {
    id: 'essential',
    label: 'Essential',
    description: 'Required for basic site functionality, authentication, and security.',
    required: true,
    default: true,
  },
  {
    id: 'analytics',
    label: 'Analytics & Performance',
    description: 'Help us understand how visitors use the platform to improve experience.',
    required: false,
    default: false,
  },
  {
    id: 'functional',
    label: 'Functional',
    description: 'Remember your preferences, language settings, and personalization.',
    required: false,
    default: true,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Used for targeted recommendations and content suggestions.',
    required: false,
    default: false,
  },
];

function getStoredConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(preferences) {
  if (typeof window === 'undefined') return;
  const data = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    preferences,
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(data));

  // Fire consent event for other scripts to listen to
  window.dispatchEvent(new CustomEvent('clipx:consent', { detail: data }));

  // Block/unblock analytics based on consent
  if (preferences.analytics) {
    // Enable Sentry, analytics, etc.
    window.__clipx_analytics_enabled = true;
  } else {
    window.__clipx_analytics_enabled = false;
  }
}

export function useConsent() {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
  }, []);

  const isConsentGiven = consent !== null;
  const hasAnalytics = consent?.preferences?.analytics ?? false;
  const hasFunctional = consent?.preferences?.functional ?? false;
  const hasMarketing = consent?.preferences?.marketing ?? false;

  return { consent, isConsentGiven, hasAnalytics, hasFunctional, hasMarketing };
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    const defaults = {};
    CATEGORIES.forEach(c => { defaults[c.id] = c.default; });
    return defaults;
  });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      // Delay showing banner for better UX
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    const all = {};
    CATEGORIES.forEach(c => { all[c.id] = true; });
    saveConsent(all);
    setVisible(false);
  }, []);

  const handleRejectOptional = useCallback(() => {
    const essential = {};
    CATEGORIES.forEach(c => { essential[c.id] = c.required; });
    saveConsent(essential);
    setVisible(false);
  }, []);

  const handleSaveCustom = useCallback(() => {
    saveConsent(preferences);
    setVisible(false);
  }, [preferences]);

  const toggleCategory = (id) => {
    const cat = CATEGORIES.find(c => c.id === id);
    if (cat?.required) return;
    setPreferences(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(10, 10, 26, 0.97)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      animation: 'slideUp 0.4s ease-out',
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 24px' }}>
        {!showDetails ? (
          /* Simple banner */
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <p style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>
                We value your privacy
              </p>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                We use cookies to enhance your experience. You can customize which cookies you allow.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowDetails(true)} style={{
                padding: '10px 18px', background: 'transparent', color: '#9ca3af',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              }}>
                Customize
              </button>
              <button onClick={handleRejectOptional} style={{
                padding: '10px 18px', background: 'rgba(255,255,255,0.06)', color: '#d1d5db',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              }}>
                Essential Only
              </button>
              <button onClick={handleAcceptAll} style={{
                padding: '10px 18px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 700,
              }}>
                Accept All
              </button>
            </div>
          </div>
        ) : (
          /* Detailed panel */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ color: '#fff', fontSize: '17px', fontWeight: 700, margin: 0 }}>
                Cookie Preferences
              </p>
              <button onClick={() => setShowDetails(false)} style={{
                background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '18px',
              }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
              {CATEGORIES.map(cat => (
                <div key={cat.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {cat.label}
                      {cat.required && <span style={{ fontSize: '10px', color: '#6b7280', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>Required</span>}
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>{cat.description}</p>
                  </div>
                  <label style={{ position: 'relative', width: '44px', height: '24px', cursor: cat.required ? 'not-allowed' : 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={preferences[cat.id]}
                      onChange={() => toggleCategory(cat.id)}
                      disabled={cat.required}
                      style={{ display: 'none' }}
                    />
                    <span style={{
                      display: 'block', width: '44px', height: '24px', borderRadius: '12px',
                      background: preferences[cat.id] ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.2s', position: 'relative',
                    }}>
                      <span style={{
                        position: 'absolute', top: '3px', left: preferences[cat.id] ? '23px' : '3px',
                        width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }} />
                    </span>
                  </label>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={handleRejectOptional} style={{
                padding: '10px 18px', background: 'rgba(255,255,255,0.06)', color: '#d1d5db',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              }}>
                Essential Only
              </button>
              <button onClick={handleSaveCustom} style={{
                padding: '10px 18px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontSize: '13px', fontWeight: 700,
              }}>
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
