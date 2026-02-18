/**
 * Onboarding Page
 * Collects user name and preferences after registration
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiArrowRight, FiCheck } from 'react-icons/fi';
import { useQuery } from '@apollo/client/react';

import { useAuth } from '@/contexts/AuthContext';
import { GET_ALL_GENRES as GET_GENRES } from '@/graphql/queries/genreQueries';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const STEPS = ['name', 'genres', 'complete'];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, completeOnboarding, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch genres
  const { data: genresData, loading: genresLoading } = useQuery(GET_GENRES);
  const genres = genresData?.genres || [];

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Pre-fill name if available from Google
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleGenreToggle = (genreId) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate name
      if (!name.trim()) {
        setError('Please enter your name');
        return;
      }
      if (name.trim().length < 2) {
        setError('Name must be at least 2 characters');
        return;
      }
      setError('');
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Submit onboarding and move to complete step
      setCurrentStep(2);
      setIsSubmitting(true);
      
      const result = await completeOnboarding(name.trim(), { 
        genres: selectedGenres 
      });
      
      if (!result.success) {
        setError(result.error);
        setCurrentStep(1);
        setIsSubmitting(false);
      }
      // If successful, let the completeOnboarding redirect handle the navigation
    }
  };

  const handleSkipGenres = async () => {
    setCurrentStep(2);
    setIsSubmitting(true);
    
    const result = await completeOnboarding(name.trim(), { genres: [] });
    
    if (!result.success) {
      setError(result.error);
      setCurrentStep(1);
      setIsSubmitting(false);
    }
    // If successful, let the completeOnboarding redirect handle the navigation
  };

  // Show loading while checking authentication or fetching genres
  if (authLoading || genresLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Complete Your Profile - clipX</title>
      </Head>

      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.slice(0, -1).map((step, i) => (
                <div 
                  key={step}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    i <= currentStep 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {i < currentStep ? <FiCheck className="w-4 h-4" /> : i + 1}
                </div>
              ))}
            </div>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-600"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Name */}
            {currentStep === 0 && (
              <motion.div
                key="name"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gray-800 rounded-2xl p-8"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiUser className="w-8 h-8 text-primary-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">What is your name?</h1>
                  <p className="text-gray-400">Let us know what to call you</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Your name"
                  autoFocus
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg text-center placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 mb-6"
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                />

                <button
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Continue
                  <FiArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* Step 2: Genre Preferences */}
            {currentStep === 1 && (
              <motion.div
                key="genres"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-gray-800 rounded-2xl p-8"
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Hi {name}! 👋
                  </h1>
                  <p className="text-gray-400">
                    Select your favorite genres to get better recommendations
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {genres.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-64 overflow-y-auto">
                      {genres.map((genre) => (
                        <button
                          key={genre.id}
                          onClick={() => handleGenreToggle(genre.id)}
                          className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            selectedGenres.includes(genre.id)
                              ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {genre.name}
                        </button>
                      ))}
                    </div>

                    <p className="text-center text-gray-500 text-sm mb-6">
                      Selected: {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''}
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSkipGenres}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        Skip for now
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                      >
                        Continue
                        <FiArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400">
                    <LoadingSpinner size="sm" />
                    <p className="mt-2">Loading genres...</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Complete */}
            {currentStep === 2 && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 rounded-2xl p-8 text-center"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="lg" />
                    <p className="text-gray-400 mt-4">Setting up your profile...</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FiCheck className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">You are all set!</h1>
                    <p className="text-gray-400 mb-6">
                      Welcome to clipX, {name}. Let us find your next favorite movie.
                    </p>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Go to Dashboard
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}