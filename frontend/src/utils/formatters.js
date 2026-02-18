// src/utils/formatters.js

/**
 * Format number to readable format (1000 -> 1K, 1000000 -> 1M)
 */
export const formatNumber = (num) => {
  if (!num) return '0';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Format duration in minutes to hours and minutes
 */
export const formatDuration = (minutes) => {
  if (!minutes) return 'N/A';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * Format rating to 1 decimal place
 */
export const formatRating = (rating) => {
  if (!rating) return 'N/A';
  return rating.toFixed(1);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Format date to readable format
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  
  return d.toLocaleDateString('en-US', options);
};

/**
 * Format year only
 */
export const formatYear = (date) => {
  if (!date) return '';
  return new Date(date).getFullYear();
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format movie title with year
 */
export const formatMovieTitle = (title, year) => {
  if (!title) return '';
  if (!year) return title;
  return `${title} (${year})`;
};

/**
 * Format genre list to string
 */
export const formatGenres = (genres) => {
  if (!genres || genres.length === 0) return 'Unknown';
  return genres.map((g) => g.name).join(', ');
};

/**
 * Format cast list
 */
export const formatCastNames = (cast, limit = 3) => {
  if (!cast || cast.length === 0) return 'Cast unknown';
  
  const names = cast.slice(0, limit).map((c) => c.name);
  
  if (cast.length > limit) {
    names.push(`+${cast.length - limit} more`);
  }
  
  return names.join(', ');
};

/**
 * Generate TMDb image URL
 */
export const getTMDbImageUrl = (path, size = 'w500') => {
  if (!path) return '/images/placeholder.jpg';
  return `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE}/${size}${path}`;
};

/**
 * Get quality badge color
 */
export const getQualityColor = (quality) => {
  const colors = {
    '4K': 'bg-purple-500',
    '1080p': 'bg-blue-500',
    '720p': 'bg-green-500',
    '480p': 'bg-yellow-500',
  };
  return colors[quality] || 'bg-gray-500';
};

/**
 * Format price (if needed for premium features)
 */
export const formatPrice = (amount, currency = 'USD') => {
  if (!amount) return 'Free';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Pluralize word
 */
export const pluralize = (count, singular, plural = null) => {
  if (count === 1) return singular;
  return plural || `${singular}s`;
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

export default {
  formatNumber,
  formatDuration,
  formatRating,
  formatFileSize,
  formatDate,
  formatYear,
  truncateText,
  formatMovieTitle,
  formatGenres,
  formatCastNames,
  getTMDbImageUrl,
  getQualityColor,
  formatPrice,
  pluralize,
  calculatePercentage,
};