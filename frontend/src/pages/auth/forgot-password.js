/**
 * Forgot Password Page
 * Email submission to trigger password reset
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft, FiCheck, FiLock } from 'react-icons/fi';
import { gql, useMutation } from '@apollo/client';

const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      success
      message
    }
  }
`;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [forgotPassword, { loading }] = useMutation(FORGOT_PASSWORD);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) return;
    try {
      const { data } = await forgotPassword({ variables: { email } });
      if (data?.forgotPassword?.success) {
        setSent(true);
        // In dev mode, the token is returned in the message
        if (data.forgotPassword.message && data.forgotPassword.message.length > 50) {
          setResetToken(data.forgotPassword.message);
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password — clipX</title>
        <meta name="description" content="Reset your clipX account password" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4" style={{ paddingTop: '80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            {!sent ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                    <FiLock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
                    <p className="text-gray-400 text-sm">We'll send you a reset link</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold rounded-xl hover:from-primary-500 hover:to-purple-500 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/auth/login"
                    className="text-sm text-gray-400 hover:text-primary-400 flex items-center gap-2 justify-center transition-colors"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                <p className="text-gray-400 mb-6">
                  If an account exists with <strong className="text-white">{email}</strong>, a password reset link has been sent.
                </p>

                {/* Dev mode: show reset link */}
                {resetToken && (
                  <div className="mb-6">
                    <p className="text-xs text-gray-500 mb-2">Dev mode — Use this link:</p>
                    <Link
                      href={`/auth/reset-password?token=${resetToken}`}
                      className="text-sm text-primary-400 hover:text-primary-300 break-all underline"
                    >
                      Reset Password →
                    </Link>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setSent(false); setEmail(''); setResetToken(''); }}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors"
                  >
                    Try Different Email
                  </button>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm text-primary-400 hover:text-primary-300 bg-primary-500/10 rounded-lg transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}