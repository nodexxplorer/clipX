// src/components/movies/RecommendationSection.jsx
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { FiZap, FiChevronLeft, FiChevronRight, FiPlay } from 'react-icons/fi';
import { GET_SIMILAR_MOVIES, GET_BECAUSE_YOU_WATCHED } from '@/graphql/queries/recommendationQueries';
import { MovieCardSkeleton, EmptyState } from '@/components/common/LoadingSpinner';
import MovieCard from './MovieCard';
import { movieUrl } from '@/utils/urlHelpers';

const RecommendationSection = ({
  movieId,
  movieTitle,
  showBecauseYouWatched = true,
  limit = 10,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('similar');
  const [scrollPosition, setScrollPosition] = useState(0);

  const { loading: loadingSimilar, data: similarData } = useQuery(GET_SIMILAR_MOVIES, {
    variables: { movieId, limit },
    skip: !movieId,
  });

  const { loading: loadingBecause, data: becauseData } = useQuery(GET_BECAUSE_YOU_WATCHED, {
    variables: { movieId, limit },
    skip: !movieId || !showBecauseYouWatched,
  });

  const similarMovies = similarData?.similarMovies || [];
  const becauseYouWatched = becauseData?.becauseYouWatched?.recommendations || [];

  const currentMovies = activeTab === 'similar' ? similarMovies : becauseYouWatched;
  const loading = activeTab === 'similar' ? loadingSimilar : loadingBecause;

  const handleScroll = (direction) => {
    const container = document.getElementById('recommendations-scroll');
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left'
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;

      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (!movieId) return null;

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiZap className="text-primary-500" />
            You May Also Like
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Based on "{movieTitle}"
          </p>
        </div>

        {/* Tabs */}
        {showBecauseYouWatched && becauseYouWatched.length > 0 && (
          <div className="flex bg-dark-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('similar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${activeTab === 'similar'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              Similar
            </button>
            <button
              onClick={() => setActiveTab('because')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${activeTab === 'because'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              For You
            </button>
          </div>
        )}
      </div>

      {/* Movies Carousel */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-dark-100/90 
                   backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 
                   transition-opacity hover:bg-primary-500 -translate-x-4"
        >
          <FiChevronLeft size={24} />
        </button>

        {/* Movies Container */}
        <div
          id="recommendations-scroll"
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
          onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
        >
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-44">
                <MovieCardSkeleton />
              </div>
            ))
          ) : currentMovies.length > 0 ? (
            <AnimatePresence mode="wait">
              {currentMovies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-shrink-0 w-44"
                >
                  <div
                    onClick={() => router.push(movieUrl(movie))}
                    className="group/card cursor-pointer"
                  >
                    {/* Poster */}
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
                      <Image
                        src={movie.posterUrl || '/images/placeholder.jpg'}
                        alt={movie.title}
                        fill
                        className="object-cover group-hover/card:scale-110 transition-transform duration-300"
                      />

                      {/* Rating */}
                      {movie.rating && (
                        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm 
                                      px-2 py-0.5 rounded text-xs font-bold text-yellow-500">
                          ⭐ {movie.rating.toFixed(1)}
                        </div>
                      )}

                      {/* Match Score */}
                      {movie.matchScore && (
                        <div className="absolute bottom-2 left-2 bg-primary-500/90 backdrop-blur-sm 
                                      px-2 py-0.5 rounded text-xs font-bold text-white">
                          {Math.round(movie.matchScore * 100)}% Match
                        </div>
                      )}

                      {/* Play Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center 
                                    bg-black/50 opacity-0 group-hover/card:opacity-100 
                                    transition-opacity">
                        <div className="p-3 bg-primary-500 rounded-full">
                          <FiPlay size={20} className="text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <h4 className="text-sm font-semibold line-clamp-1 
                                 group-hover/card:text-primary-500 transition-colors">
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
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="w-full py-12 text-center text-gray-400">
              No recommendations available
            </div>
          )}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-dark-100/90 
                   backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 
                   transition-opacity hover:bg-primary-500 translate-x-4"
        >
          <FiChevronRight size={24} />
        </button>

        {/* Gradient Fades */}
        <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r 
                      from-dark-300 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l 
                      from-dark-300 to-transparent pointer-events-none" />
      </div>

      {/* View All Link */}
      {currentMovies.length >= limit && (
        <div className="text-center mt-4">
          <button
            onClick={() => router.push(`/recommendations?from=${movieId}`)}
            className="text-primary-500 hover:text-primary-400 font-semibold text-sm"
          >
            View All Recommendations →
          </button>
        </div>
      )}
    </section>
  );
};

export default RecommendationSection;