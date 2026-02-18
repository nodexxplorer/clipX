// src/components/common/Rating.jsx
import { FiStar } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Rating = ({ rating, maxRating = 10, size = 'md', showNumber = true, interactive = false, onChange }) => {
  const percentage = (rating / maxRating) * 100;
  
  const sizes = {
    sm: { star: 16, text: 'text-sm' },
    md: { star: 20, text: 'text-base' },
    lg: { star: 24, text: 'text-lg' },
  };

  const getRatingColor = (rating) => {
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-blue-500';
    if (rating >= 4) return 'text-yellow-500';
    return 'text-red-500';
  };

  const stars = Array.from({ length: 5 }, (_, i) => {
    const starValue = (i + 1) * 2;
    const fillPercentage = Math.min(Math.max(((rating - (starValue - 2)) / 2) * 100, 0), 100);
    
    return (
      <div key={i} className="relative inline-block">
        <FiStar size={sizes[size].star} className="text-gray-600" />
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${fillPercentage}%` }}
        >
          <FiStar 
            size={sizes[size].star} 
            className={getRatingColor(rating)} 
            fill="currentColor"
          />
        </div>
      </div>
    );
  });

  if (interactive) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <motion.button
              key={value}
              onClick={() => onChange?.(value)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="focus:outline-none"
            >
              <FiStar
                size={sizes[size].star}
                className={value <= rating ? getRatingColor(rating) : 'text-gray-600'}
                fill={value <= rating ? 'currentColor' : 'none'}
              />
            </motion.button>
          ))}
        </div>
        {showNumber && (
          <span className={`${sizes[size].text} font-semibold ${getRatingColor(rating)}`}>
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {stars}
      </div>
      {showNumber && (
        <span className={`${sizes[size].text} font-semibold ${getRatingColor(rating)}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default Rating;