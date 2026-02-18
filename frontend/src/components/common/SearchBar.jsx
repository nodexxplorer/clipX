// src/components/common/SearchBar.jsx

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useLazyQuery } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX } from 'react-icons/fi';
import Image from 'next/image';
import { SEARCH_MOVIES } from '@/graphql/queries/movieQueries';

const SearchBar = ({ placeholder = "Search movies...", autoFocus = false }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef(null);

  const [searchMovies, { loading, data }] = useLazyQuery(SEARCH_MOVIES);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length > 2) {
      const timer = setTimeout(() => {
        searchMovies({ variables: { query: query.trim(), limit: 5 } });
        setIsOpen(true);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [query, searchMovies]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleResultClick = (movieId) => {
    router.push(`/movies/${movieId}`);
    setIsOpen(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full bg-dark-100 text-white pl-12 pr-12 py-3 rounded-lg
                     border border-white/10 focus:border-primary-500 focus:outline-none
                     transition-all duration-300"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 
                       hover:text-white transition-colors"
            >
              <FiX size={20} />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-dark-100 
                     rounded-lg border border-white/10 shadow-2xl overflow-hidden z-50"
          >
            {loading ? (
              <div className="p-4 text-center text-gray-400">Searching...</div>
            ) : data?.searchMovies?.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {data.searchMovies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => handleResultClick(movie.id)}
                    className="flex gap-3 p-3 hover:bg-dark-200 cursor-pointer 
                             transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={movie.posterUrl || '/images/placeholder.jpg'}
                        alt={movie.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">{movie.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <span>{movie.year}</span>
                        {movie.rating && (
                          <>
                            <span>•</span>
                            <span>⭐ {movie.rating.toFixed(1)}</span>
                          </>
                        )}
                      </div>
                      {movie.genres?.[0] && (
                        <span className="text-xs text-primary-500 mt-1 inline-block">
                          {movie.genres[0].name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleSubmit}
                  className="w-full p-3 text-center text-primary-500 hover:bg-dark-200 
                           transition-colors font-semibold"
                >
                  View all results for "{query}"
                </button>
              </div>
            ) : query.trim().length > 2 ? (
              <div className="p-4 text-center text-gray-400">
                No movies found for "{query}"
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;