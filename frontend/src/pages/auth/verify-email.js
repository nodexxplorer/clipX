/**
 * Email Verification Page
 * Handles the token from the verification email link
 */

import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiLoader, FiArrowRight } from 'react-icons/fi';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

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
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [verifyEmail] = useMutation(VERIFY_EMAIL);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const { data } = await verifyEmail({ variables: { token } });
        if (data?.verifyEmail?.success) {
          setStatus('success');
          setMessage(data.verifyEmail.message || 'Email verified!');
        } else {
          setStatus('error');
          setMessage('Verification failed. The link may be expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Invalid or expired verification link.');
      }
    };

    verify();
  }, [token, verifyEmail]);

  // No token in URL yet
  if (!token) {
    return (
      <>
        <Head><title>Verify Email - clipX</title></Head>
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <FiLoader className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading verification...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{status === 'success' ? 'Email Verified' : 'Verify Email'} - clipX</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full"
        >
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-6">
                <FiLoader className="w-10 h-10 text-primary-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">Verifying your email...</h1>
              <p className="text-gray-400">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">Email Verified! 🎉</h1>
              <p className="text-gray-400 mb-8">{message}</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-bold rounded-xl hover:from-primary-500 hover:to-blue-500 transition-all"
              >
                Go to Dashboard
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                <FiAlertTriangle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">Verification Failed</h1>
              <p className="text-gray-400 mb-8">{message}</p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/auth/login"
                  className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}
