/**
 * Login Page
 * Updated to use @react-oauth/google
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { GoogleLogin } from '@react-oauth/google';

import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function LoginPage() {
  const router = useRouter();
  const { 
    login, 
    handleGoogleAuth,
    signInWithGoogle,
    isAuthenticated, 
    user,
    loading, 
    error, 
    clearError
  } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to admin dashboard when role indicates admin
      if (typeof window !== 'undefined') {
        const role = localStorage.getItem('role') || (user && user.role);
        if (role === 'admin') {
          router.push('/admin');
          return;
        }
      }
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
    // setFormError('');
  }, [clearError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
    clearError();
  };

  const validateForm = () => {
    if (!formData.email) {
      setFormError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setFormError('Please enter a valid email');
      return false;
    }
    if (!formData.password) {
      setFormError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setFormError(result.error);
    }
    setIsSubmitting(false);
  };

  // Handle successful Google login
  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('✅ Google login success');
    setFormError('');
    clearError();
    // Prefer explicit handler; fall back to legacy signInWithGoogle if present
    const handler = typeof handleGoogleAuth === 'function' ? handleGoogleAuth : signInWithGoogle;

    if (typeof handler !== 'function') {
      console.error('No Google auth handler available on AuthContext', { handleGoogleAuth, signInWithGoogle });
      setFormError('Google authentication is not available.');
      return;
    }

    const result = await handler(credentialResponse.credential);
    
    if (!result.success) {
      setFormError(result.error || 'Google authentication failed');
    }
  };

  // Handle Google login error
  const handleGoogleError = () => {
    console.error('❌ Google login failed');
    setFormError('Google sign-in was cancelled or failed. Please try again.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Login - clipX</title>
        <meta name="description" content="Sign in to your clipX account" />
      </Head>

      <div className="min-h-screen flex bg-gray-900">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/auth-bg.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
          <div className="relative z-10 flex flex-col justify-center px-12">
            <Link href="/" className="text-4xl font-bold text-white mb-4">
              🎬 clipX
            </Link>
            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome Back
            </h1>
            <p className="text-gray-300 text-lg max-w-md">
              Sign in to access your personalized recommendations, 
              watchlist, and discover your next favorite movie.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="text-3xl font-bold text-white">
                🎬 clipX
              </Link>
            </div>

            <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
              <p className="text-gray-400 mb-6">
                Do not have an account?{' '}
                <Link href="/auth/register" className="text-primary-400 hover:text-primary-300">
                  Sign up
                </Link>
              </p>
              
              {/* Google Sign In - Using @react-oauth/google */}
              <div className="mb-6 ">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="filled_blue"
                  size="large"
                  text="continue_with"
                  shape="circle"
                  width="100%"
                />
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-800 text-gray-400">or continue with email</span>
                </div>
              </div>

              {/* Error Message */}
              {(formError || error) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
                >
                  <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{formError || error}</span>
                </motion.div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <Link href="/auth/forgot-password" className="text-sm text-primary-400 hover:text-primary-300">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </div>

            {/* Terms */}
            <p className="mt-6 text-center text-sm text-gray-500">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-primary-400 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary-400 hover:underline">Privacy Policy</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}