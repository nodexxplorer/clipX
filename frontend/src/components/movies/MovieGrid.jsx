// src/components/movies/MovieGrid.jsx
import { motion } from 'framer-motion';
import MovieCard from './MovieCard';
import { MovieCardSkeleton } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/LoadingSpinner';
import { FiFilm } from 'react-icons/fi';

const MovieGrid = ({ 
  movies = [], 
  loading = false, 
  columns = 5,
  emptyMessage = 'No movies found',
  emptyAction,
  showAnimation = true 
}) => {
  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  };

  if (loading) {
    return (
      <div className={`grid ${columnClasses[columns]} gap-6`}>
        {[...Array(20)].map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <EmptyState
        icon={FiFilm}
        title="No movies found"
        message={emptyMessage}
        action={emptyAction}
      />
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: showAnimation ? 0.05 : 0,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      className={`grid ${columnClasses[columns]} gap-6`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {movies.map((movie, index) => (
        <motion.div
          key={movie.id}
          variants={showAnimation ? itemVariants : {}}
        >
          <MovieCard movie={movie} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default MovieGrid;