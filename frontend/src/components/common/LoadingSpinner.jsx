// src/components/common/LoadingSpinner.jsx
import { motion } from 'framer-motion';

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

// src/components/common/ErrorMessage.jsx
import { FiAlertCircle } from 'react-icons/fi';

export const ErrorMessage = ({ message = 'Something went wrong', retry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-red-500/10 p-4 rounded-full mb-4">
        <FiAlertCircle className="text-red-500" size={48} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Oops!</h3>
      <p className="text-gray-400 mb-4 max-w-md">{message}</p>
      {retry && (
        <button onClick={retry} className="btn-primary">
          Try Again
        </button>
      )}
    </div>
  );
};

// src/components/common/EmptyState.jsx
import { FiFilm } from 'react-icons/fi';

export const EmptyState = ({ 
  icon: Icon = FiFilm,
  title = 'No movies found',
  message = 'Try adjusting your filters or search query',
  action 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="bg-primary-500/10 p-6 rounded-full mb-4">
        <Icon className="text-primary-500" size={48} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md">{message}</p>
      {action && action}
    </div>
  );
};

// src/components/common/MovieCardSkeleton.jsx
export const MovieCardSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="bg-dark-100 aspect-[2/3] rounded-xl mb-4" />
      <div className="bg-dark-100 h-6 rounded mb-2" />
      <div className="bg-dark-100 h-4 rounded w-2/3 mb-2" />
      <div className="bg-dark-100 h-4 rounded w-1/2" />
    </div>
  );
};

export default LoadingSpinner;