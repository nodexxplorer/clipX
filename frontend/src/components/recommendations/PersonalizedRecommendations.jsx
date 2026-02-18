// src/components/recommendations/PersonalizedRecommendations.jsx
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { FiZap, FiRefreshCw, FiSliders } from 'react-icons/fi';
import MovieCard from '@/components/movies/MovieCard';
import { MovieCardSkeleton, EmptyState } from '@/components/common/LoadingSpinner';
import { GET_PERSONALIZED_RECOMMENDATIONS } from '@/graphql/queries/recommendationQueries';

const PersonalizedRecommendations = ({ userId = null, limit = 20 }) => {
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [filteredMovies, setFilteredMovies] = useState([]);

  const { loading, error, data, refetch } = useQuery(GET_PERSONALIZED_RECOMMENDATIONS, {
    variables: { userId, limit },
    fetchPolicy: 'cache-and-network',
  });

  const recommendations = data?.personalizedRecommendations || [];

  // Filter movies when genre changes
  useEffect(() => {
    if (selectedGenre === 'all') {
      setFilteredMovies(recommendations);
    } else {
      setFilteredMovies(
        recommendations.filter((movie) =>
          movie.genres?.some((g) => g.slug === selectedGenre)
        )
      );
    }
  }, [selectedGenre, recommendations]);

  // Extract unique genres from recommendations
  const genres = [
    { slug: 'all', name: 'All Genres' },
    ...Array.from(
      new Map(
        recommendations
          .flatMap((m) => m.genres || [])
          .map((g) => [g.slug, g])
      ).values()
    ),
  ];

  const handleRefresh = async () => {
    await refetch();
  };

  if (error) {
    return (
      <EmptyState
        icon={FiZap}
        title="Failed to load recommendations"
        message="We couldn't get your personalized recommendations. Please try again."
        action={
          <button onClick={handleRefresh} className="btn-primary">
            Try Again
          </button>
        }
      />
    );
  }

  return (
    <section>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiZap className="text-primary-500" />
            Personalized For You
          </h2>
          <p className="text-gray-400 mt-1">
            Movies picked just for you by our AI
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Genre Filter */}
          <div className="relative">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-dark-100 text-white px-4 py-2 pr-10 rounded-lg border border-white/10
                       focus:border-primary-500 focus:outline-none appearance-none cursor-pointer"
            >
              {genres.map((genre) => (
                <option key={genre.slug} value={genre.slug}>
                  {genre.name}
                </option>
              ))}
            </select>
            <FiSliders className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 bg-dark-100 rounded-lg hover:bg-dark-50 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={20} />
          </button>
        </div>
      </div>

      {/* AI Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500/20 to-purple-500/20 
                 border border-primary-500/30 rounded-lg p-4 mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary-500 p-2 rounded-lg">
            <FiZap className="text-white" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Powered by AI</h3>
            <p className="text-sm text-gray-300">
              Our machine learning algorithm analyzes your preferences to suggest the perfect movies
            </p>
          </div>
        </div>
      </motion.div>

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredMovies.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredMovies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <MovieCard movie={movie} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={FiZap}
          title="No recommendations found"
          message={
            selectedGenre !== 'all'
              ? 'No recommendations match this genre. Try selecting a different one.'
              : 'Watch some movies to get personalized recommendations!'
          }
          action={
            selectedGenre !== 'all' && (
              <button
                onClick={() => setSelectedGenre('all')}
                className="btn-secondary"
              >
                Show All Genres
              </button>
            )
          }
        />
      )}

      {/* Load More */}
      {filteredMovies.length >= limit && (
        <div className="text-center mt-8">
          <button
            onClick={() => refetch({ limit: limit + 20 })}
            className="btn-secondary"
          >
            Load More Recommendations
          </button>
        </div>
      )}
    </section>
  );
};

export default PersonalizedRecommendations;
