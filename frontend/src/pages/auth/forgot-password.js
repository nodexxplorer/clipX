/**
 * Forgot Password Page
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMutation } from '@apollo/client/react';
import { FiMail, FiArrowLeft, FiCheck, FiAlertCircle } from 'react-icons/fi';

import { FORGOT_PASSWORD_MUTATION } from '@/graphql/mutations/authMutation';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [forgotPassword, { loading }] = useMutation(FORGOT_PASSWORD_MUTATION);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    try {
      await forgotPassword({ variables: { email } });
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - clipX</title>
      </Head>

      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-white">
              🎬 clipX
            </Link>
          </div>

          <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
            {!isSubmitted ? (
              <>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-gray-400 hover:text-white mb-6"
                >
                  <FiArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Link>

                <h1 className="text-2xl font-bold text-white mb-2">Forgot password?</h1>
                <p className="text-gray-400 mb-6">
                  No worries, we'll send you reset instructions.
                </p>

                {error && (
                  <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    <FiAlertCircle className="w-5 h-5" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        Sending...
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiCheck className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                <p className="text-gray-400 mb-6">
                  We sent a password reset link to<br />
                  <span className="text-white font-medium">{email}</span>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-primary-400 hover:underline"
                  >
                    try again
                  </button>
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-gray-400 hover:text-white"
                >
                  <FiArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}