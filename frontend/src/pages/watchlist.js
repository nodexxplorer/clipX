// src/pages/watchlist.js
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiTrash2, FiFilm, FiGrid, FiList } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { movieUrl } from '@/utils/urlHelpers';
import MovieCard from '@/components/movies/MovieCard';
import { LoadingSpinner, EmptyState, MovieCardSkeleton } from '@/components/common/LoadingSpinner';
import { useWatchlist } from '@/hooks/useWatchlist';
import { gql } from '@apollo/client';

const GET_WATCHLIST_MOVIES = gql`
  query GetWatchlistMovies($movieIds: [ID!]!) {
    moviesByIds(ids: $movieIds) {
      id
      title
      description
      year
      durationMinutes
      rating
      posterUrl
      genres {
        id
        name
        slug
      }
    }
  }
`;

export default function WatchlistPage() {
  const router = useRouter();
  const { watchlist, removeFromWatchlist, clearWatchlist, count } = useWatchlist();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('added'); // 'added', 'title', 'rating', 'year'

  const { loading, data, error } = useQuery(GET_WATCHLIST_MOVIES, {
    variables: { movieIds: watchlist },
    skip: watchlist.length === 0,
    fetchPolicy: 'cache-and-network',
  });

  const movies = data?.moviesByIds || [];

  // Sort movies
  const sortedMovies = [...movies].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'year':
        return (b.year || 0) - (a.year || 0);
      default: // 'added' - maintain original order
        return watchlist.indexOf(a.id) - watchlist.indexOf(b.id);
    }
  });

  const handleRemove = async (movieId, e) => {
    e.stopPropagation();
    await removeFromWatchlist(movieId);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire watchlist?')) {
      clearWatchlist();
    }
  };

  return (
    <>
      <Head>
        <title>My Watchlist - clipX</title>
        <meta name="description" content="Your saved movies watchlist" />
      </Head>

      <div className="min-h-screen py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold flex items-center gap-3">
                  <FiHeart className="text-primary-500" />
                  My Watchlist
                </h1>
                <p className="text-gray-400 mt-2">
                  {count > 0
                    ? `${count} movie${count !== 1 ? 's' : ''} saved`
                    : 'No movies saved yet'
                  }
                </p>
              </div>

              {count > 0 && (
                <div className="flex items-center gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex bg-dark-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-400'
                        }`}
                    >
                      <FiGrid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-400'
                        }`}
                    >
                      <FiList size={20} />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-dark-100 text-white px-4 py-2 rounded-lg border border-white/10
                             focus:border-primary-500 focus:outline-none"
                  >
                    <option value="added">Recently Added</option>
                    <option value="title">Title A-Z</option>
                    <option value="rating">Highest Rated</option>
                    <option value="year">Newest First</option>
                  </select>

                  {/* Clear All Button */}
                  <button
                    onClick={handleClearAll}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Clear watchlist"
                  >
                    <FiTrash2 size={20} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(count || 5)].map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : count === 0 ? (
            <EmptyState
              icon={FiHeart}
              title="Your watchlist is empty"
              message="Start adding movies to your watchlist to keep track of what you want to watch"
              action={
                <button onClick={() => router.push('/movies')} className="btn-primary">
                  Browse Movies
                </button>
              }
            />
          ) : viewMode === 'grid' ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AnimatePresence>
                {sortedMovies.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="relative group"
                  >
                    <MovieCard movie={movie} />
                    <button
                      onClick={(e) => handleRemove(movie.id, e)}
                      className="absolute top-3 right-3 z-10 p-2 bg-red-500 text-white rounded-full
                               opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {sortedMovies.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => router.push(movieUrl(movie))}
                    className="flex gap-4 bg-dark-100 rounded-xl p-4 cursor-pointer
                             hover:bg-dark-50 transition-colors group"
                  >
                    <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={movie.posterUrl || '/images/placeholder.jpg'}
                        alt={movie.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold group-hover:text-primary-500 transition-colors">
                        {movie.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                        <span>{movie.year}</span>
                        <span>•</span>
                        <span>⭐ {movie.rating?.toFixed(1) || 'N/A'}</span>
                        {movie.genres?.[0] && (
                          <>
                            <span>•</span>
                            <span>{movie.genres[0].name}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {movie.description}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleRemove(movie.id, e)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 
                               rounded-lg transition-colors h-fit"
                    >
                      <FiTrash2 size={20} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}