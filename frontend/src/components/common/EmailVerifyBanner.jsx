// src/components/common/EmailVerifyBanner.jsx
import { useState } from 'react';
import { FiAlertTriangle, FiMail, FiX } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';

const RESEND_VERIFY_EMAIL = gql`
  mutation ResendVerificationEmail {
    resendVerificationEmail {
      success
      message
    }
  }
`;

/**
 * Persistent banner shown to authenticated users whose email is not verified.
 * Placed at the top of the Layout so it appears on every page.
 */
export default function EmailVerifyBanner() {
  const { user, isAuthenticated } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendVerify, { loading }] = useMutation(RESEND_VERIFY_EMAIL, {
    onCompleted: () => setResent(true),
    onError: () => setResent(true), // still show "sent" to avoid spam
  });

  // Don't show if: not logged in, already verified, or dismissed this session
  if (!isAuthenticated || !user || user.emailVerified || dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-amber-600/90 to-orange-600/90 text-white px-4 py-2.5
                    flex items-center justify-center gap-3 text-sm font-medium z-50 backdrop-blur-sm">
      <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>
        Your email is not verified.{' '}
        {resent ? (
          <span className="text-amber-100">Verification email sent! Check your inbox.</span>
        ) : (
          <button
            onClick={() => resendVerify()}
            disabled={loading}
            className="underline underline-offset-2 hover:text-white/80 transition-colors font-bold"
          >
            {loading ? 'Sending...' : 'Resend verification email'}
          </button>
        )}
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
        title="Dismiss"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
}
