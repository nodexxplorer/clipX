// src/utils/validators.js

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate movie rating (0-10)
 */
export const isValidRating = (rating) => {
  const num = parseFloat(rating);
  return !isNaN(num) && num >= 0 && num <= 10;
};

/**
 * Validate year
 */
export const isValidYear = (year) => {
  const currentYear = new Date().getFullYear();
  const num = parseInt(year);
  return !isNaN(num) && num >= 1888 && num <= currentYear + 5;
};

/**
 * Validate search query
 */
export const isValidSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return false;
  const trimmed = query.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
};

/**
 * Sanitize search query
 */
export const sanitizeSearchQuery = (query) => {
  if (!query) return '';
  return query.trim().replace(/[<>]/g, '');
};

/**
 * Validate movie ID
 */
export const isValidMovieId = (id) => {
  return id && (typeof id === 'string' || typeof id === 'number');
};

/**
 * Validate page number
 */
export const isValidPage = (page, maxPage = Infinity) => {
  const num = parseInt(page);
  return !isNaN(num) && num >= 1 && num <= maxPage;
};

/**
 * Check if value is empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Validate genre slug
 */
export const isValidGenreSlug = (slug) => {
  const validGenres = ['action', 'comedy', 'drama', 'horror', 'sci-fi', 'romance', 'thriller', 'animation', 'documentary'];
  return validGenres.includes(slug?.toLowerCase());
};

/**
 * Clean filename for download
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return 'movie';
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/{2,}/g, '')
    .toLowerCase();
};

/**
 * Validate image URL
 */
export const isValidImageUrl = (url) => {
  if (!isValidUrl(url)) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
};

/**
 * Check if string contains only alphanumeric characters
 */
export const isAlphanumeric = (str) => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

/**
 * Validate duration (in minutes)
 */
export const isValidDuration = (minutes) => {
  const num = parseInt(minutes);
  return !isNaN(num) && num > 0 && num < 600; // Max 10 hours
};

/**
 * Check if date is in the future
 */
export const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

/**
 * Validate sort option
 */
export const isValidSortOption = (sort) => {
  const validOptions = ['popular', 'rating', 'recent', 'title', 'year'];
  return validOptions.includes(sort);
};

/**
 * Validate filter object
 */
export const validateFilters = (filters) => {
  const errors = {};

  if (filters.year && !isValidYear(filters.year)) {
    errors.year = 'Invalid year';
  }

  if (filters.rating && !isValidRating(filters.rating)) {
    errors.rating = 'Rating must be between 0 and 10';
  }

  if (filters.genre && !isValidGenreSlug(filters.genre)) {
    errors.genre = 'Invalid genre';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  isValidEmail,
  isValidUrl,
  isValidRating,
  isValidYear,
  isValidSearchQuery,
  sanitizeSearchQuery,
  isValidMovieId,
  isValidPage,
  isEmpty,
  isValidGenreSlug,
  sanitizeFilename,
  isValidImageUrl,
  isAlphanumeric,
  isValidDuration,
  isFutureDate,
  isValidSortOption,
  validateFilters,
};