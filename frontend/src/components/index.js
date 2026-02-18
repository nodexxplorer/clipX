// src/components/index.js

// Layout
export { default as Layout } from './layout/Layout';
export { default as Header } from './layout/Header';
export { default as Footer } from './layout/Footer';

// Home
export { default as HeroSection } from './home/HeroSection';
export { default as FeaturedMovies } from './home/FeaturedMovies';
export { default as GenreGrid } from './home/GenreGrid';
export { default as TrendingSection } from './home/TrendingSection';

// Movies
export { default as MovieCard } from './movies/MovieCard';
export { default as MovieFilters } from './movies/MovieFilters';
export { default as MovieGrid } from './movies/MovieGrid';

export { default as CastList } from './movies/CastList';
export { default as RecommendationSection } from './movies/RecommendationSection';

// Recommendations
export { default as RecommendationCard } from './recommendations/RecommendationCard';
export { default as PersonalizedRecommendations } from './recommendations/PersonalizedRecommendations';
export { default as TrendingNow } from './recommendations/TrendingNow';
export { default as SimilarMovies } from './recommendations/SimilarMovies';

// Common
export { default as SearchBar } from './common/SearchBar';
export { default as Button } from './common/Button';
export { default as Rating } from './common/Rating';
export { default as Modal } from './common/Modal';
export { default as Pagination } from './common/Pagination';
export { default as LoadingSpinner } from './common/LoadingSpinner';
export { default as ErrorMessage, NetworkError, NotFoundError, ServerError } from './common/ErrorMessage';
export {
  EmptyState,
  MovieCardSkeleton
} from './common/LoadingSpinner';