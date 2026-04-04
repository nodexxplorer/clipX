// src/components/common/LoadingSpinner.jsx
import { motion } from 'framer-motion';
import { FiAlertCircle, FiRefreshCw, FiFilm } from 'react-icons/fi';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        className={`${sizes[size]} border-4 border-primary-500/30 border-t-primary-500 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && <p className="mt-4 text-gray-400">{text}</p>}
    </div>
  );
};



export const ErrorMessage = ({ message = 'Something went wrong', retry }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
        <div className="relative bg-red-500/10 p-5 rounded-2xl mb-5 border border-red-500/20">
          <FiAlertCircle className="text-red-400" size={40} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Oops!</h3>
      <p className="text-gray-400 mb-6 max-w-md leading-relaxed">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 font-bold text-sm rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </motion.div>
  );
};



export const EmptyState = ({
  icon: Icon = FiFilm,
  title = 'No movies found',
  message = 'Try adjusting your filters or search query',
  action
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-16 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-2xl scale-150" />
        <div className="relative bg-white/[0.03] p-6 rounded-2xl border border-white/5">
          <Icon className="text-gray-500" size={40} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md leading-relaxed">{message}</p>
      {action && action}
    </motion.div>
  );
};

// ──────────────── Skeleton Components ────────────────

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent';

export const MovieCardSkeleton = () => {
  return (
    <div className={`${shimmer} rounded-xl overflow-hidden`}>
      <div className="bg-white/[0.04] aspect-[2/3] rounded-xl" />
      <div className="mt-3 space-y-2">
        <div className="bg-white/[0.04] h-5 rounded-lg w-3/4" />
        <div className="flex gap-2">
          <div className="bg-white/[0.04] h-4 rounded-lg w-12" />
          <div className="bg-white/[0.04] h-4 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
};

export const MovieDetailSkeleton = () => {
  return (
    <div className="min-h-screen py-24 px-6 animate-pulse">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/[0.02] h-[60vh]" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className={`${shimmer} w-64 h-96 bg-white/[0.04] rounded-2xl flex-shrink-0`} />
          {/* Info */}
          <div className="flex-1 space-y-4 py-4">
            <div className="bg-white/[0.04] h-10 rounded-xl w-2/3" />
            <div className="flex gap-3">
              <div className="bg-white/[0.04] h-6 rounded-lg w-16" />
              <div className="bg-white/[0.04] h-6 rounded-lg w-20" />
              <div className="bg-white/[0.04] h-6 rounded-lg w-24" />
            </div>
            <div className="space-y-2 mt-6">
              <div className="bg-white/[0.04] h-4 rounded-lg w-full" />
              <div className="bg-white/[0.04] h-4 rounded-lg w-full" />
              <div className="bg-white/[0.04] h-4 rounded-lg w-3/4" />
            </div>
            <div className="flex gap-3 mt-8">
              <div className="bg-white/[0.04] h-12 rounded-xl w-36" />
              <div className="bg-white/[0.04] h-12 rounded-xl w-36" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen py-24 px-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome banner */}
        <div className={`${shimmer} bg-white/[0.04] h-40 rounded-2xl`} />
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`${shimmer} bg-white/[0.04] h-24 rounded-xl`} />
          ))}
        </div>
        {/* Movie row */}
        <div>
          <div className="bg-white/[0.04] h-8 rounded-lg w-48 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReviewSkeleton = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`${shimmer} p-5 bg-white/[0.02] border border-white/5 rounded-xl`}>
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-white/[0.04]" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="bg-white/[0.04] h-4 rounded w-24" />
                <div className="bg-white/[0.04] h-4 rounded w-20" />
              </div>
              <div className="bg-white/[0.04] h-3 rounded w-full" />
              <div className="bg-white/[0.04] h-3 rounded w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;