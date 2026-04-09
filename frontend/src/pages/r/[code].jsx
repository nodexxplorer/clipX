// frontend/src/pages/r/[code].jsx
// Referral deep-link route
// Captures /r/:code, stores the referral code, and redirects to register

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ReferralRedirect() {
  const router = useRouter();
  const { code } = router.query;

  useEffect(() => {
    if (!code) return;
    try {
      // Store the referral code in localStorage for the register page to pick up
      localStorage.setItem('clipx_referral_code', String(code));
      // Also set a cookie as fallback
      document.cookie = `clipx_ref=${code}; path=/; max-age=604800`; // 7 days
    } catch (e) {
      console.warn('Failed to store referral code:', e);
    }
    // Redirect to register page
    router.replace('/auth/register');
  }, [code, router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a0b0f',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ fontSize: 14, color: '#9ca3af' }}>
          Applying referral code...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
