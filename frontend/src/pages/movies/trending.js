// src/pages/movies/trending.js
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { FiTrendingUp } from 'react-icons/fi';
import MovieCard from '@/components/movies/MovieCard';
import { LoadingSpinner, EmptyState, MovieCardSkeleton } from '@/components/common/LoadingSpinner';
import { GET_TRENDING } from '@/graphql/queries/movieQueries';

export default function TrendingPage() {
  const [timeWindow, setTimeWindow] = useState('week');

  const { loading, data } = useQuery(GET_TRENDING, {
    variables: { timeWindow, limit: 50 },
  });

  const timeWindows = [
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  return (
    <>
      <Head>
        <title>Trending Movies - clipX</title>
        <meta name="description" content="Discover the most popular movies right now" />
      </Head>

      <div className="min-h-screen py-24 px-6 md:px-12 bg-[#050607]">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors mb-6 group"
          >
            <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 italic uppercase tracking-tighter flex items-center gap-3">
              <FiTrendingUp className="text-primary-500" />
              Trending Movies
            </h1>
            <p className="text-gray-400 max-w-2xl leading-relaxed">
              The hottest movies and most anticipated releases currently capturing everyone's attention.
            </p>
          </motion.div>

          {/* Time Window Selector */}
          <div className="flex gap-4 mb-12">
            {timeWindows.map((window) => (
              <button
                key={window.value}
                onClick={() => setTimeWindow(window.value)}
                className={`px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest transition-all duration-300
                  ${timeWindow === window.value
                    ? 'bg-primary-500 text-white shadow-neon'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {window.label}
              </button>
            ))}
          </div>

          {/* Trending Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(20)].map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : data?.trending?.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {data.trending.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative group"
                >
                  {/* Trending Badge */}
                  {index < 3 && (
                    <div className="absolute -top-3 -right-3 z-10 bg-primary-500 
                                  text-white w-10 h-10 rounded-full flex items-center 
                                  justify-center font-black text-lg italic shadow-neon">
                      #{index + 1}
                    </div>
                  )}
                  <MovieCard movie={movie} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState
              icon={FiTrendingUp}
              title="No trending movies"
              message="Check back later for trending content"
            />
          )}
        </div>
      </div>
    </>
  );
}