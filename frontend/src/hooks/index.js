// src/hooks/index.js
export { default as useMovie, useMovieDownload, useMovieSearch, useGenreMovies } from './useMovies';
export { default as useWatchlist } from './useWatchlist';
export { default as useRecommendations, useSimilarMovies, useRecommendationFilters } from './useRecommendations';
export { default as useSearch } from './useSearch';
export { default as useInfiniteScroll, useIntersectionObserver, useDebounce, useLocalStorage, useMediaQuery, useOnClickOutside, useKeyPress, useWindowSize } from './useInfiniteScroll';