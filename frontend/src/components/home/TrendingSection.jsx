// src/components/home/TrendingSection.jsx
import { useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { GET_TRENDING } from '@/graphql/queries/movieQueries';

const TrendingCard = ({ movie, rank }) => {
  const router = useRouter();

  const formatDownloads = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count;
  };

  const rankColors = {
    1: 'bg-primary-500',
    2: 'bg-primary-600',
    3: 'bg-primary-700',
  };

  return (
    <motion.div
      onClick={() => router.push(`/movies/${movie.id}`)}
      className="movie-card flex gap-4 cursor-pointer"
      whileHover={{ x: 5 }}
    >
      {/* Rank Badge */}
      <div className={`${rankColors[rank] || 'bg-primary-800'} w-12 h-12 
                       rounded-full flex items-center justify-center 
                       text-2xl font-bold flex-shrink-0`}>
        {rank}
      </div>

      {/* Movie Poster */}
      <div className="relative w-24 h-36 rounded-lg overflow-hidden flex-shrink-0">
        <Image
          src={movie.posterUrl || '/images/placeholder.jpg'}
          alt={movie.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 right-2 rating-badge text-xs">
          {movie.rating?.toFixed(1)}
        </div>
      </div>

      {/* Movie Info */}
      <div className="flex-1 flex flex-col justify-center">
        <h3 className="text-lg font-semibold mb-1 line-clamp-1 
                       group-hover:text-primary-500 transition-colors">
          {movie.title}
        </h3>
        <p className="text-sm text-gray-400 mb-2">
          {movie.genres?.[0]?.name}
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{formatDownloads(movie.downloadCount)} downloads</span>
        </div>
      </div>
    </motion.div>
  );
};

const TrendingSection = () => {
  const router = useRouter();
  const { loading, error, data } = useQuery(GET_TRENDING, {
    variables: { timeWindow: 'week', limit: 5 },
  });

  if (loading) {
    return (
      <section className="py-16 px-6 bg-dark-200">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center">Trending This Week</h2>
          <p className="text-gray-400 text-center mb-12">Loading trending movies...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-6 bg-dark-200">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-500">Error loading trending movies</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 bg-dark-200">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold mb-4">Trending This Week</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            The most popular movies downloaded by our community
          </p>
        </motion.div>

        {/* Trending List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {data?.trendingMovies?.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <TrendingCard movie={movie} rank={index + 1} />
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <button
            onClick={() => router.push('/movies/trending')}
            className="btn-primary"
          >
            View All Trending Movies
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default TrendingSection;