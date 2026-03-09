// src/components/common/SearchBar.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { movieUrl } from '@/utils/urlHelpers';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiWifiOff, FiTrendingUp, FiClock, FiTrash2 } from 'react-icons/fi';
import Image from 'next/image';
import { SEARCH_MOVIES, SEARCH_SUGGESTIONS } from '@/graphql/queries/movieQueries';

const SearchBar = ({
  placeholder = 'Search movies...',
  autoFocus = false,
  hideDropdown = false,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const router = useRouter();
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);
  const localCache = useRef(new Map());
  const abortRef = useRef(null);

  const [searchMovies, { loading, data, error }] = useLazyQuery(SEARCH_MOVIES, {
    fetchPolicy: 'cache-first',
  });

  // Fetch trending suggestions (cached by Apollo)
  const { data: suggestionsData } = useQuery(SEARCH_SUGGESTIONS, {
    variables: { limit: 6 },
    fetchPolicy: 'cache-first',
  });

  // Load recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem('clipx_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch { }
  }, []);

  // Track online/offline
  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    setIsOffline(!navigator.onLine);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search — 150ms for fast feel
  const handleQueryChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);

    clearTimeout(debounceTimer.current);

    if (val.trim().length > 1 && !isOffline) {
      // Check local cache first
      const cacheKey = val.trim().toLowerCase();
      if (localCache.current.has(cacheKey)) {
        setIsOpen(true);
        return;
      }

      debounceTimer.current = setTimeout(() => {
        searchMovies({ variables: { query: val.trim(), limit: 7 } });
        setIsOpen(true);
      }, 150);
    } else if (val.trim().length === 0) {
      setIsOpen(isFocused && !hideDropdown);
    } else {
      setIsOpen(false);
    }
  }, [searchMovies, isOffline, isFocused, hideDropdown]);

  // Cache results locally when data arrives
  useEffect(() => {
    if (data?.searchMovies?.items && query.trim()) {
      localCache.current.set(query.trim().toLowerCase(), data.searchMovies.items);
    }
  }, [data, query]);

  // Cleanup
  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (!hideDropdown) {
      setIsOpen(true);
    }
  }, [hideDropdown]);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    saveToRecent(trimmed);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setIsOpen(false);
    setQuery('');
  };

  const saveToRecent = (term) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 8);
    setRecentSearches(updated);
    try { localStorage.setItem('clipx_recent_searches', JSON.stringify(updated)); } catch { }
  };

  const removeRecent = (term, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    try { localStorage.setItem('clipx_recent_searches', JSON.stringify(updated)); } catch { }
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try { localStorage.removeItem('clipx_recent_searches'); } catch { }
  };

  const handleResultClick = (movie) => {
    router.push(movieUrl(movie));
    if (typeof onClose === 'function') onClose();
    setIsOpen(false);
    setQuery('');
  };

  const handleRecentClick = (term) => {
    setQuery(term);
    saveToRecent(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
    setIsOpen(false);
  };

  const handleSuggestionClick = (movie) => {
    router.push(movieUrl(movie));
    if (typeof onClose === 'function') onClose();
    setIsOpen(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
  };

  // Get results from local cache or apollo
  const results = useMemo(() => {
    const cacheKey = query.trim().toLowerCase();
    if (localCache.current.has(cacheKey)) {
      return localCache.current.get(cacheKey);
    }
    return data?.searchMovies?.items || (Array.isArray(data?.searchMovies) ? data.searchMovies : []);
  }, [data, query]);

  const suggestions = suggestionsData?.searchSuggestions || [];
  const showEmptyState = isFocused && !query.trim() && !hideDropdown;
  const showResults = query.trim().length > 1 && !hideDropdown;

  // Keyboard navigation
  const allItems = showResults ? results : (showEmptyState ? suggestions : []);
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && allItems[selectedIndex]) {
      e.preventDefault();
      if (showResults) handleResultClick(allItems[selectedIndex]);
      else handleSuggestionClick(allItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={searchRef} className="relative w-full group">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 w-6 h-6 z-10" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={isOffline ? 'Offline — search unavailable' : placeholder}
            autoFocus={autoFocus}
            disabled={isOffline}
            className="w-full bg-black/40 backdrop-blur-xl text-white pl-16 pr-14 py-5 rounded-2xl
                     border border-white/10 focus:border-primary-500/50 focus:bg-black/60 focus:outline-none
                     shadow-[0_8px_32px_rgba(0,0,0,0.5)] focus:shadow-[0_0_40px_rgba(var(--color-primary-500),0.3)]
                     transition-all duration-500 text-lg md:text-xl font-medium tracking-wide placeholder:text-gray-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isOffline && (
            <FiWifiOff className="absolute right-6 top-1/2 -translate-y-1/2 text-yellow-500 w-5 h-5" />
          )}
          {query && !isOffline && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center
                       bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform hover:scale-110"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      <AnimatePresence mode="wait">
        {!hideDropdown && isOpen && (
          <motion.div
            key={query || 'suggestions'}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-[calc(100%+12px)] left-0 right-0 bg-black/80 backdrop-blur-2xl
                     rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-50"
          >
            {/* Empty state — show recent searches + trending */}
            {showEmptyState && (
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between px-3 py-2">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <FiClock className="w-3 h-3" /> Recent
                      </p>
                      <button onClick={clearAllRecent} className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
                        Clear all
                      </button>
                    </div>
                    {recentSearches.slice(0, 5).map((term, i) => (
                      <div
                        key={term}
                        onClick={() => handleRecentClick(term)}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-white/10 rounded-xl cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <FiClock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-300 text-sm font-medium">{term}</span>
                        </div>
                        <button
                          onClick={(e) => removeRecent(term, e)}
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-all p-1"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="w-full h-px bg-white/5 my-2" />
                  </div>
                )}

                {/* Trending Suggestions */}
                {suggestions.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2 flex items-center gap-2">
                      <FiTrendingUp className="w-3 h-3" /> Trending Now
                    </p>
                    {suggestions.map((movie, index) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        key={movie.id}
                        onClick={() => handleSuggestionClick(movie)}
                        className={`flex gap-4 p-3 hover:bg-white/10 rounded-xl cursor-pointer transition-all group items-center
                          ${selectedIndex === index ? 'bg-white/10' : ''}`}
                      >
                        <div className="relative w-10 h-14 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
                          <Image
                            src={movie.posterPath || '/images/placeholder.jpg'}
                            alt={movie.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white text-sm truncate group-hover:text-primary-400 transition-colors">
                            {movie.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            {movie.year && <span>{movie.year}</span>}
                            {movie.voteAverage > 0 && (
                              <span className="text-yellow-500">⭐ {movie.voteAverage.toFixed(1)}</span>
                            )}
                          </div>
                        </div>
                        <FiTrendingUp className="w-4 h-4 text-primary-500/50 flex-shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search results */}
            {showResults && (
              <>
                {loading ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-3 text-primary-500 font-bold tracking-widest uppercase text-sm">
                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    Searching…
                  </div>
                ) : error ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                    <FiWifiOff className="text-yellow-500 w-8 h-8 mb-1" />
                    <p className="text-yellow-400 font-medium">Search unavailable right now</p>
                    <p className="text-xs text-gray-500">Check your connection and try again.</p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                    {results.map((movie, index) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        key={movie.id}
                        onClick={() => handleResultClick(movie)}
                        className={`flex gap-4 p-3 hover:bg-white/10 rounded-xl cursor-pointer transition-all group items-center
                          ${selectedIndex === index ? 'bg-white/10' : ''}`}
                      >
                        <div className="relative w-14 h-20 md:w-16 md:h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-lg group-hover:shadow-primary-500/20">
                          <Image
                            src={movie.posterUrl || movie.posterPath || '/images/placeholder.jpg'}
                            alt={movie.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-bold text-white md:text-lg truncate group-hover:text-primary-400 transition-colors">
                            {movie.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-400 mt-1.5 font-medium tracking-wide">
                            {movie.year && <span>{movie.year}</span>}
                            {(movie.rating || movie.voteAverage) ? (
                              <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">
                                ⭐ <span>{(movie.rating || movie.voteAverage || 0).toFixed(1)}</span>
                              </div>
                            ) : null}
                            {movie.genres?.[0] && (
                              <span className="text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                                {movie.genres[0].name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-4">
                          <FiSearch className="w-5 h-5 text-primary-500" />
                        </div>
                      </motion.div>
                    ))}

                    <button
                      onClick={handleSubmit}
                      className="w-full mt-2 p-4 text-center text-white bg-primary-600 hover:bg-primary-500
                               rounded-xl transition-all duration-300 font-bold uppercase tracking-widest text-sm shadow-lg hover:shadow-primary-500/40"
                    >
                      View All Results
                    </button>
                  </div>
                ) : query.trim().length > 1 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                    <FiSearch className="text-gray-600 w-12 h-12 mb-2" />
                    <p className="text-gray-400 font-medium text-lg">
                      No matches for{' '}
                      <span className="text-white italic">&ldquo;{query}&rdquo;</span>
                    </p>
                    <p className="text-sm text-gray-500">Try adjusting your keywords.</p>
                  </div>
                ) : null}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;