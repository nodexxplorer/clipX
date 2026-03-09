// src/components/recommendations/RecommendationCard.jsx
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { FiZap, FiStar } from 'react-icons/fi';
import { movieUrl } from '@/utils/urlHelpers';

const RecommendationCard = ({ movie, showReason = true }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(movieUrl(movie));
  };

  return (
    <motion.div
      onClick={handleClick}
      className="group cursor-pointer"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      {/* Movie Card */}
      <div className="movie-card">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={movie.posterUrl || '/images/placeholder.jpg'}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* AI Badge */}
          <div className="absolute top-3 left-3 bg-primary-500 text-white px-2 py-1 
                        rounded-full text-xs font-bold flex items-center gap-1">
            <FiZap size={12} />
            AI Pick
          </div>

          {/* Rating Badge */}
          {movie.rating && (
            <div className="absolute top-3 right-3 rating-badge flex items-center gap-1">
              <FiStar size={12} />
              {movie.rating.toFixed(1)}
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Movie Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2 line-clamp-1 group-hover:text-primary-500 
                       transition-colors">
            {movie.title}
          </h3>

          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>{movie.year}</span>
            {movie.genres?.[0] && <span>{movie.genres[0].name}</span>}
          </div>

          {/* Match Score */}
          {movie.score && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Match</span>
                <span>{Math.round(movie.score * 100)}%</span>
              </div>
              <div className="h-1 bg-dark-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-green-500 rounded-full"
                  style={{ width: `${movie.score * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Reason */}
      {showReason && movie.reason && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 bg-dark-100 p-3 rounded-lg border border-primary-500/20"
        >
          <div className="flex items-start gap-2">
            <FiZap className="text-primary-500 flex-shrink-0 mt-0.5" size={14} />
            <p className="text-xs text-gray-300">{movie.reason}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RecommendationCard;
