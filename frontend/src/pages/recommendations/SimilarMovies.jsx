// src/components/recommendations/SimilarMovies.jsx
import { useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { FiFilm, FiChevronRight } from 'react-icons/fi';
import { GET_SIMILAR_MOVIES } from '@/graphql/queries/recommendationQueries';
import { MovieCardSkeleton, EmptyState } from '@/components/common/LoadingSpinner';
import MovieCard from '@/components/movies/MovieCard';
import { movieUrl } from '@/utils/urlHelpers';

const SimilarMovieCard = ({ movie }) => {
  const router = useRouter();

  return (
    <motion.div
      onClick={() => router.push(movieUrl(movie))}
      className="group cursor-pointer flex-shrink-0 w-36 sm:w-44"
      whileHover={{ scale: 1.05 }}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
        <Image
          src={movie.posterUrl || '/images/placeholder.jpg'}
          alt={movie.title}
          fill
          className="object-cover"
        />

        {/* Rating Badge */}
        {movie.rating && (
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 
                        rounded text-xs font-bold text-yellow-500">
            ⭐ {movie.rating.toFixed(1)}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      flex items-end p-3">
          <span className="text-primary-500 text-sm font-semibold">View Details →</span>
        </div>
      </div>

      <h4 className="text-sm font-semibold line-clamp-1 group-hover:text-primary-500 
                   transition-colors">
        {movie.title}
      </h4>

      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
        <span>{movie.year}</span>
        {movie.genres?.[0] && (
          <>
            <span>•</span>
            <span>{movie.genres[0].name}</span>
          </>
        )}
      </div>
    </motion.div>
  );
};

const SimilarMovies = ({
  movieId,
  title = 'Similar Movies',
  subtitle,
  limit = 10,
  layout = 'scroll', // 'scroll' or 'grid'
  showViewAll = true,
}) => {
  const router = useRouter();

  const { loading, error, data } = useQuery(GET_SIMILAR_MOVIES, {
    variables: { movieId, limit },
    skip: !movieId,
  });

  const movies = data?.similarMovies || [];

  if (loading) {
    if (layout === 'scroll') {
      return (
        <section>
          <h2 className="text-xl font-bold mb-4">{title}</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-36">
                <MovieCardSkeleton />
              </div>
            ))}
          </div>
        </section>
      );
    }

    return (
      <section>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(limit)].map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error || movies.length === 0) {
    return null; // Don't show section if no similar movies
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FiFilm className="text-primary-500" />
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>

        {showViewAll && movies.length >= limit && (
          <button
            onClick={() => router.push(`/movies/${movieId}?tab=similar`)}
            className="flex items-center gap-1 text-primary-500 hover:text-primary-400 
                     text-sm font-semibold"
          >
            View All
            <FiChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Movies */}
      {layout === 'scroll' ? (
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {movies.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SimilarMovieCard movie={movie} />
              </motion.div>
            ))}
          </div>

          {/* Gradient Fade */}
          <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l 
                        from-dark-300 to-transparent pointer-events-none" />
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <MovieCard movie={movie} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
};

export default SimilarMovies;