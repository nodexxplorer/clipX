// src/components/movies/MovieFilters.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_GENRES } from '@/graphql/queries/genreQueries';

const MovieFilters = ({ onFilterChange, initialFilters = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    genre: initialFilters.genre || '',
    year: initialFilters.year || '',
    rating: initialFilters.rating || '',
    sort: initialFilters.sort || 'popular',
  });

  const { data: genresData } = useQuery(GET_ALL_GENRES);

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial value on mount
    setIsDesktop(window.innerWidth >= 1024);

    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'recent', label: 'Recently Added' },
    { value: 'title', label: 'A-Z' },
    { value: 'year', label: 'Release Year' },
  ];

  const ratingOptions = [
    { value: '', label: 'All Ratings' },
    { value: '9', label: '9+ ⭐' },
    { value: '8', label: '8+ ⭐' },
    { value: '7', label: '7+ ⭐' },
    { value: '6', label: '6+ ⭐' },
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters = { genre: '', year: '', rating: '', sort: 'popular' };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = filters.genre || filters.year || filters.rating;

  return (
    <div className="mb-8">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-dark-100 px-4 py-3 
                   rounded-lg border border-white/10"
        >
          <span className="flex items-center gap-2">
            <FiFilter />
            Filters {hasActiveFilters && (Object.values(filters).filter(Boolean).length)}
          </span>
          <FiChevronDown
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {(isOpen || isDesktop) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:block"
          >
            <div className="bg-dark-100 rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FiFilter className="text-primary-500" />
                  Filter Movies
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-500 hover:text-primary-400 
                             flex items-center gap-1"
                  >
                    <FiX size={16} />
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-full bg-dark-200 text-white px-4 py-2 rounded-lg 
                             border border-white/10 focus:border-primary-500 
                             focus:outline-none"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Genre
                  </label>
                  <select
                    value={filters.genre}
                    onChange={(e) => handleFilterChange('genre', e.target.value)}
                    className="w-full bg-dark-200 text-white px-4 py-2 rounded-lg 
                             border border-white/10 focus:border-primary-500 
                             focus:outline-none"
                  >
                    <option value="">All Genres</option>
                    {genresData?.genres?.map((genre) => (
                      <option key={genre.id} value={genre.slug}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Release Year
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="w-full bg-dark-200 text-white px-4 py-2 rounded-lg 
                             border border-white/10 focus:border-primary-500 
                             focus:outline-none"
                  >
                    <option value="">All Years</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                    className="w-full bg-dark-200 text-white px-4 py-2 rounded-lg 
                             border border-white/10 focus:border-primary-500 
                             focus:outline-none"
                  >
                    {ratingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MovieFilters;