// src/pages/movies/index.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiLoader } from 'react-icons/fi';
import MovieCard from '@/components/movies/MovieCard';
import MovieFilters from '@/components/movies/MovieFilters';
import { ErrorMessage, EmptyState, MovieCardSkeleton } from '@/components/common/LoadingSpinner';
import { gql } from '@apollo/client';

const GET_MOVIES = gql`
  query GetMovies($filter: JSON, $sort: String, $limit: Int, $offset: Int) {
    movies(filter: $filter, sort: $sort, limit: $limit, offset: $offset)
  }
`;

const MOVIES_PER_PAGE = 20;

export default function MoviesPage() {
  const [filters, setFilters] = useState({
    type: 'All',
    genre: 'All',
    country: 'All',
    year: 'All',
    dub: 'All',
    sort: 'Hottest',
  });

  // Accumulated movies list for infinite scroll
  const [allMovies, setAllMovies] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);

  // Build the filter object
  const buildFilter = () => {
    const f = {};
    if (filters.type && filters.type !== 'All') f.type = filters.type;
    if (filters.genre && filters.genre !== 'All') f.genre = filters.genre;
    if (filters.country && filters.country !== 'All') f.country = filters.country;
    if (filters.year && filters.year !== 'All') f.year = filters.year;
    return Object.keys(f).length > 0 ? f : null;
  };

  const sortMap = {
    Hottest: 'popular',
    Latest: 'latest',
    Rating: 'rating',
    Popular: 'popular',
    ForYou: 'popular',
  };

  const { loading, error, data, refetch } = useQuery(GET_MOVIES, {
    variables: {
      filter: buildFilter(),
      sort: sortMap[filters.sort] || 'popular',
      limit: MOVIES_PER_PAGE,
      offset,
    },
    notifyOnNetworkStatusChange: true,
  });

  // When fresh data arrives, append or replace
  useEffect(() => {
    if (data?.movies?.movies) {
      const newMovies = data.movies.movies;
      if (offset === 0) {
        setAllMovies(newMovies);
      } else {
        setAllMovies(prev => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map(m => m.id));
          const unique = newMovies.filter(m => !existingIds.has(m.id));
          return [...prev, ...unique];
        });
      }
      setHasMore(data.movies.hasMore || newMovies.length >= MOVIES_PER_PAGE);
      setIsLoadingMore(false);
    }
  }, [data, offset]);

  // Reset when filters change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setOffset(0);
    setAllMovies([]);
    setHasMore(true);
  };

  // Infinite scroll with IntersectionObserver
  const loadMore = useCallback(() => {
    if (!loading && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      setOffset(prev => prev + MOVIES_PER_PAGE);
    }
  }, [loading, hasMore, isLoadingMore]);

  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const isInitialLoad = loading && allMovies.length === 0;

  return (
    <>
      <Head>
        <title>Browse Movies - clipX</title>
        <meta name="description" content="Browse thousands of movies across all genres" />
      </Head>

      <div className="min-h-screen py-24 px-6">
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
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 italic uppercase tracking-tighter">
              Browse Movies
            </h1>
            <p className="text-gray-400 max-w-2xl leading-relaxed">
              Discover your next favorite movie from our curated collection of cinematic masterpieces.
            </p>
          </motion.div>

          {/* Filters */}
          <MovieFilters
            onFilterChange={handleFilterChange}
            initialFilters={filters}
          />

          {/* Movies Grid */}
          {isInitialLoad ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {[...Array(MOVIES_PER_PAGE)].map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorMessage
              message="Failed to load movies. Please try again."
              retry={() => { setOffset(0); refetch(); }}
            />
          ) : allMovies.length > 0 ? (
            <>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {allMovies.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.4) }}
                  >
                    <MovieCard movie={movie} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Infinite Scroll Trigger */}
              {hasMore && (
                <div ref={loaderRef} className="flex justify-center py-12">
                  <div className="flex items-center gap-3 text-gray-500">
                    <FiLoader className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Loading more movies...</span>
                  </div>
                </div>
              )}

              {!hasMore && allMovies.length > 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-sm">You've reached the end — {allMovies.length} movies loaded</p>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="No movies found"
              message="Try adjusting your filters to see more results"
              action={
                <button
                  onClick={() => handleFilterChange({ type: 'All', genre: 'All', country: 'All', year: 'All', dub: 'All', sort: 'Hottest' })}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              }
            />
          )}
        </div>
      </div>
    </>
  );
}