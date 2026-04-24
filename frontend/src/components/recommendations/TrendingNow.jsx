// src/components/recommendations/TrendingNow.jsx
import { useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { FiTrendingUp, FiPlay, FiDownload } from 'react-icons/fi';
import { GET_TRENDING } from '@/graphql/queries/movieQueries';
import { movieUrl } from '@/utils/urlHelpers';
import { MovieCardSkeleton, EmptyState } from '@/components/common/LoadingSpinner';
import { formatNumber } from '@/utils/formatters';

const TrendingCard = ({ movie, rank }) => {
  const router = useRouter();

  const rankColors = {
    1: 'from-yellow-500 to-amber-600',
    2: 'from-gray-400 to-gray-500',
    3: 'from-amber-700 to-amber-800',
  };

  return (
    <motion.div
      onClick={() => router.push(movieUrl(movie))}
      className="group relative bg-dark-100 rounded-xl overflow-hidden cursor-pointer
                hover:shadow-glow transition-all duration-300"
      whileHover={{ scale: 1.02, y: -5 }}
    >
      <div className="flex gap-4 p-4">
        {/* Rank Badge */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                       font-bold text-xl bg-gradient-to-br ${rankColors[rank] || 'from-primary-500 to-primary-600'}
                       text-white shadow-lg`}>
          {rank}
        </div>

        {/* Poster */}
        <div className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={movie.posterUrl || '/images/placeholder.jpg'}
            alt={movie.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-white group-hover:text-primary-500 
                       transition-colors line-clamp-1">
            {movie.title}
          </h3>

          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
            <span>{movie.year}</span>
            {movie.genres?.[0] && (
              <>
                <span>•</span>
                <span>{movie.genres[0].name}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {movie.rating && (
              <span className="flex items-center gap-1">
                ⭐ {movie.rating.toFixed(1)}
              </span>
            )}
            {movie.downloadCount && (
              <span className="flex items-center gap-1">
                <FiDownload size={12} />
                {formatNumber(movie.downloadCount)}
              </span>
            )}
          </div>
        </div>

        {/* Action Button (hidden on mobile) */}
        <div className="hidden sm:flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(movieUrl(movie));
            }}
            className="p-3 bg-primary-500 rounded-full text-white opacity-0 
                     group-hover:opacity-100 transition-opacity hover:bg-primary-600"
          >
            <FiPlay size={16} />
          </button>
        </div>
      </div>

      {/* Trending Indicator */}
      {rank <= 3 && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-primary-500/20 to-transparent 
                      px-3 py-1 text-xs text-primary-500 font-semibold">
          🔥 Hot
        </div>
      )}
    </motion.div>
  );
};

const TrendingNow = ({ limit = 10, showTitle = true }) => {
  const { loading, error, data } = useQuery(GET_TRENDING, {
    variables: { timeWindow: 'day', limit },
  });

  if (loading) {
    return (
      <section>
        {showTitle && (
          <div className="flex items-center gap-2 mb-6">
            <FiTrendingUp className="text-primary-500" size={24} />
            <h2 className="text-2xl font-bold">Trending Now</h2>
          </div>
        )}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-dark-100 h-32 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data?.trendingMovies?.length) {
    return (
      <EmptyState
        icon={FiTrendingUp}
        title="No trending movies"
        message="Check back later for trending content"
      />
    );
  }

  return (
    <section>
      {showTitle && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 mb-6"
        >
          <FiTrendingUp className="text-primary-500" size={24} />
          <h2 className="text-2xl font-bold">Trending Now</h2>
          <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-bold rounded-full">
            LIVE
          </span>
        </motion.div>
      )}

      <div className="space-y-4">
        {data.trendingMovies.map((movie, index) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <TrendingCard movie={movie} rank={index + 1} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TrendingNow;