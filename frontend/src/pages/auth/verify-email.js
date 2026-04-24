/**
 * Email Verification Page
 *
 * Two modes:
 *   1. No ?token= in URL  →  "Check your inbox" prompt with resend button
 *      (shown after registration)
 *   2. ?token=xxx in URL  →  Automatically verifies and shows result
 */

import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  FiCheckCircle, FiAlertTriangle, FiMail,
  FiArrowRight, FiRefreshCw,
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token } = router.query;
  const {
    user,
    isAuthenticated,
    isEmailVerified,
    verifyEmail,
    resendVerificationEmail,
    refetchUser,
  } = useAuth();

  // 'inbox' | 'verifying' | 'success' | 'error'
  const [status, setStatus] = useState(token ? 'verifying' : 'inbox');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // If the user is already verified, redirect to dashboard/onboarding
  useEffect(() => {
    if (isAuthenticated && isEmailVerified) {
      if (!user?.name) {
        router.replace('/auth/onboarding');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, isEmailVerified, user?.name, router]);

  // When a token appears in the URL, verify it
  useEffect(() => {
    if (!token) {
      setStatus('inbox');
      return;
    }

    let cancelled = false;

    const doVerify = async () => {
      setStatus('verifying');
      const result = await verifyEmail(token);

      if (cancelled) return;

      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Email verified successfully!');
      } else {
        setStatus('error');
        setMessage(result.error || 'Verification failed. The link may be expired.');
      }
    };

    doVerify();
    return () => { cancelled = true; };
  }, [token, verifyEmail]);

  // Resend handler with 60-second cooldown
  const handleResend = useCallback(async () => {
    if (resending || resendCooldown > 0) return;
    setResending(true);

    const result = await resendVerificationEmail();

    setResending(false);

    if (result.success) {
      setMessage(result.message || 'Verification email sent!');
      setResendCooldown(60);
    } else {
      setMessage(result.error || 'Failed to resend. Please try again.');
    }
  }, [resending, resendCooldown, resendVerificationEmail]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // ─── Shared wrapper ────────────────────────────────────────
  const Wrapper = ({ children }) => (
    <>
      <Head>
        <title>
          {status === 'success' ? 'Email Verified' : 'Verify Email'} - clipX
        </title>
      </Head>
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full"
        >
          {children}
        </motion.div>
      </div>
    </>
  );

  // ─── STATE: verifying (spinner) ────────────────────────────
  if (status === 'verifying') {
    return (
      <Wrapper>
        <div className="w-20 h-20 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-6">
          <FiRefreshCw className="w-10 h-10 text-primary-400 animate-spin" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">
          Verifying your email…
        </h1>
        <p className="text-gray-400">
          Please wait while we verify your email address.
        </p>
      </Wrapper>
    );
  }

  // ─── STATE: success ────────────────────────────────────────
  if (status === 'success') {
    return (
      <Wrapper>
        <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
          <FiCheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">
          Email Verified! 🎉
        </h1>
        <p className="text-gray-400 mb-8">{message}</p>
        <Link
          href={user && !user.name ? '/auth/onboarding' : '/dashboard'}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-bold rounded-xl hover:from-primary-500 hover:to-blue-500 transition-all"
        >
          {user && !user.name ? 'Complete Setup' : 'Go to Dashboard'}
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </Wrapper>
    );
  }

  // ─── STATE: error (token verification failed) ──────────────
  if (status === 'error') {
    return (
      <Wrapper>
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <FiAlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">
          Verification Failed
        </h1>
        <p className="text-gray-400 mb-8">{message}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          {isAuthenticated && (
            <button
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending
                ? 'Sending…'
                : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Email'}
            </button>
          )}
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </Wrapper>
    );
  }

  // ─── STATE: inbox (check your email — shown after signup) ──
  return (
    <Wrapper>
      <div className="w-20 h-20 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-6">
        <FiMail className="w-10 h-10 text-primary-400" />
      </div>
      <h1 className="text-2xl font-black text-white mb-3">
        Check Your Inbox 📬
      </h1>
      <p className="text-gray-400 mb-2">
        We sent a verification link to{' '}
        {user?.email ? (
          <strong className="text-white">{user.email}</strong>
        ) : (
          'your email address'
        )}
        .
      </p>
      <p className="text-gray-500 text-sm mb-8">
        Click the link in the email to verify your account. It expires in 24
        hours.
      </p>

      {message && (
        <p className="text-sm text-green-400 mb-4">{message}</p>
      )}

      <button
        onClick={handleResend}
        disabled={resending || resendCooldown > 0}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-bold rounded-xl hover:from-primary-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        <FiRefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
        {resending
          ? 'Sending…'
          : resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : 'Resend Verification Email'}
      </button>

      <div className="text-sm text-gray-500">
        Wrong email?{' '}
        <Link href="/auth/register" className="text-primary-400 hover:text-primary-300 transition-colors">
          Sign up again
        </Link>
      </div>
    </Wrapper>
  );
}
