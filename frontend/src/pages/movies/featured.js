import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiStar, FiAward, FiChevronLeft } from 'react-icons/fi';
import MovieCard from '@/components/movies/MovieCard';
import { LoadingSpinner, EmptyState, MovieCardSkeleton } from '@/components/common/LoadingSpinner';
import { gql } from '@apollo/client';

const GET_FEATURED_MOVIES = gql`
  query GetAllFeaturedMovies($limit: Int) {
    featured(limit: $limit) {
      id
      title
      description
      year
      durationMinutes
      rating
      posterUrl
      trailerUrl
      genres {
        id
        name
        slug
      }
    }
    editorsChoice(limit: 5) {
      id
      title
      posterUrl
      rating
      year
      editorNote
    }
    awardWinning(limit: 10) {
      id
      title
      posterUrl
      rating
      year
      awards
    }
  }
`;

const FeaturedBadge = ({ children, color = "primary" }) => (
  <span className={`inline-flex items-center gap-1 px-3 py-1 bg-${color}-500/20 text-${color}-500 
                  text-[10px] font-black uppercase tracking-widest rounded-full border border-${color}-500/20`}>
    <FiStar size={10} className="fill-current" />
    {children}
  </span>
);

export default function FeaturedPage() {
  const { loading, error, data } = useQuery(GET_FEATURED_MOVIES, {
    variables: { limit: 20 },
  });

  if (loading) {
    return (
      <div className="min-h-screen py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Featured Movies</h1>
            <p className="text-gray-400">Loading featured content...</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(20)].map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={FiStar}
        title="Failed to load featured movies"
        message="Please try again later"
      />
    );
  }

  const { featuredMovies, editorsChoice, awardWinning } = data || {};

  return (
    <>
      <Head>
        <title>Featured Movies - clipX</title>
        <meta name="description" content="Handpicked featured movies and editor's choice" />
      </Head>

      <div className="min-h-screen py-24 px-6 md:px-12 bg-[#050607]">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors mb-8 group"
          >
            <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 px-6 py-2 rounded-full mb-6">
              <FiStar className="text-primary-500 fill-current animate-pulse" />
              <span className="text-primary-500 font-bold uppercase text-[10px] tracking-[0.3em]">Staff Collections</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 italic uppercase tracking-tighter text-white">
              Featured <span className="text-primary-500">Masterpieces</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Handpicked by our cinematic experts — the best movies you need to experience in 4K right now.
            </p>
          </motion.div>

          {/* Editor's Choice Section */}
          {editorsChoice?.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold">Editor's Choice</h2>
                <FeaturedBadge>Staff Pick</FeaturedBadge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {editorsChoice.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className="absolute -top-2 -left-2 z-10 bg-primary-500 text-white 
                                  w-8 h-8 rounded-full flex items-center justify-center 
                                  font-bold text-sm">
                      {index + 1}
                    </div>
                    <MovieCard movie={movie} />
                    {movie.editorNote && (
                      <div className="mt-2 bg-dark-100 p-3 rounded-lg text-xs text-gray-300">
                        <span className="text-primary-500 font-semibold">Editor's Note:</span>{' '}
                        {movie.editorNote}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Award Winning Section */}
          {awardWinning?.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold">Award Winners</h2>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 
                               text-yellow-500 text-xs font-bold rounded-full">
                  <FiAward size={12} />
                  Award Winning
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {awardWinning.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <MovieCard movie={movie} />
                    {movie.awards && (
                      <div className="mt-2 text-xs text-yellow-500">
                        🏆 {movie.awards}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* All Featured Movies */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">All Featured</h2>
            </div>

            {data?.featured?.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {data.featured.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <MovieCard movie={movie} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <EmptyState
                icon={FiStar}
                title="No featured movies"
                message="Check back later for featured content"
              />
            )}
          </section>
        </div>
      </div>
    </>
  );
}