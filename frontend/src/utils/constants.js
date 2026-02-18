// src/utils/constants.js

export const APP_NAME = 'clipX';
export const APP_DESCRIPTION = 'Discover & Download Amazing Movies';

// Genre configurations
export const GENRES = {
  ACTION: { id: 28, name: 'Action', slug: 'action', color: 'from-red-500 to-orange-500' },
  COMEDY: { id: 35, name: 'Comedy', slug: 'comedy', color: 'from-yellow-500 to-amber-500' },
  DRAMA: { id: 18, name: 'Drama', slug: 'drama', color: 'from-purple-500 to-pink-500' },
  HORROR: { id: 27, name: 'Horror', slug: 'horror', color: 'from-gray-700 to-gray-900' },
  SCIFI: { id: 878, name: 'Sci-Fi', slug: 'sci-fi', color: 'from-blue-500 to-cyan-500' },
  ROMANCE: { id: 10749, name: 'Romance', slug: 'romance', color: 'from-pink-500 to-rose-500' },
};

// TMDb image sizes
export const IMAGE_SIZES = {
  POSTER: {
    SMALL: 'w185',
    MEDIUM: 'w342',
    LARGE: 'w500',
    XLARGE: 'w780',
    ORIGINAL: 'original',
  },
  BACKDROP: {
    SMALL: 'w300',
    MEDIUM: 'w780',
    LARGE: 'w1280',
    ORIGINAL: 'original',
  },
  PROFILE: {
    SMALL: 'w45',
    MEDIUM: 'w185',
    LARGE: 'h632',
    ORIGINAL: 'original',
  },
};

// Sort options
export const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'title', label: 'A-Z' },
  { value: 'year', label: 'Release Year' },
];

// Time windows for trending
export const TIME_WINDOWS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

// Pagination
export const ITEMS_PER_PAGE = {
  MOVIES: 20,
  SEARCH: 10,
  RECOMMENDATIONS: 20,
  CAST: 12,
};

// Rating colors
export const RATING_COLORS = {
  EXCELLENT: 'text-green-500', // 8+
  GOOD: 'text-blue-500',       // 6-8
  AVERAGE: 'text-yellow-500',  // 4-6
  POOR: 'text-red-500',        // <4
};

// Quality badges
export const VIDEO_QUALITIES = ['4K', '1080p', '720p', '480p'];

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 30 * 60 * 1000,    // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
};

// API endpoints
export const API_ENDPOINTS = {
  GRAPHQL: process.env.NEXT_PUBLIC_GRAPHQL_URI || 'http://localhost:4000/graphql',
};

// Local storage keys
export const STORAGE_KEYS = {
  WATCHLIST: 'watchlist',
  RECENTLY_VIEWED: 'recentlyViewed',
  THEME: 'theme',
  REDUCED_MOTION: 'reducedMotion',
  PREFERENCES: 'preferences',
};

// Animation durations (for Framer Motion)
export const ANIMATION = {
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5,
};

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};

// Social media links
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/clipX',
  TWITTER: 'https://twitter.com/clipX',
  INSTAGRAM: 'https://instagram.com/clipX',
  YOUTUBE: 'https://youtube.com/clipX',
};

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  NOT_FOUND: 'The requested content was not found.',
  SERVER: 'Server error. Please try again later.',
  INVALID_INPUT: 'Invalid input. Please check your data.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  ADDED_TO_WATCHLIST: 'Added to watchlist',
  REMOVED_FROM_WATCHLIST: 'Removed from watchlist',
  DOWNLOAD_STARTED: 'Download started',
  RATING_SUBMITTED: 'Rating submitted successfully',
};

// Feature flags
export const FEATURES = {
  WATCHLIST: true,
  DOWNLOAD: true,
  RECOMMENDATIONS: true,
  SEARCH: true,
  FILTERS: true,
  SHARE: true,
};

// src/utils/helpers.js
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

export const scrollToTop = (smooth = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto',
  });
};

export const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

export const uniqueBy = (array, key) => {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  debounce,
  throttle,
  copyToClipboard,
  scrollToTop,
  getRandomItems,
  groupBy,
  uniqueBy,
  sleep,
};