// frontend/src/pages/auth/verify-email.jsx
// Email verification endpoint
// Handles /auth/verify-email?token=<JWT> from the verification email

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { gql} from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Link from 'next/link';

const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      success
      message
    }
  }
`;

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const [verifyEmail] = useMutation(VERIFY_EMAIL);

  useEffect(() => {
    if (!token) return;

    verifyEmail({ variables: { token: String(token) } })
      .then(({ data }) => {
        if (data?.verifyEmail?.success) {
          setStatus('success');
          setMessage(data.verifyEmail.message || 'Your email has been verified!');
          // Redirect to dashboard after 3 seconds
          setTimeout(() => router.push('/dashboard'), 3000);
        } else {
          setStatus('error');
          setMessage(data?.verifyEmail?.message || 'Verification failed. The link may have expired.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.message || 'Something went wrong. Please try again.');
      });
  }, [token]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#0a0b0f', color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: 440, width: '100%', textAlign: 'center',
        background: 'rgba(255,255,255,0.03)', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.06)', padding: '48px 32px',
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: 48, height: 48,
              border: '3px solid rgba(255,255,255,0.1)',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 24px',
            }} />
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              Verifying your email...
            </h1>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>
              Please wait while we confirm your email address.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 28,
            }}>✓</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#22c55e' }}>
              Email Verified!
            </h1>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>
              {message}
            </p>
            <p style={{ fontSize: 12, color: '#6b7280' }}>
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 28,
            }}>✕</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#ef4444' }}>
              Verification Failed
            </h1>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>
              {message}
            </p>
            <Link
              href="/auth/login"
              style={{
                display: 'inline-block', padding: '12px 28px',
                background: '#6366f1', color: '#fff', borderRadius: 12,
                fontSize: 14, fontWeight: 600, textDecoration: 'none',
              }}
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
