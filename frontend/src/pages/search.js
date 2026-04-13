// src/pages/search.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '@/components/common/SearchBar';
import MovieCard from '@/components/movies/MovieCard';
import { LoadingSpinner, EmptyState, MovieCardSkeleton } from '@/components/common/LoadingSpinner';
import { SEARCH_MOVIES } from '@/graphql/queries/movieQueries';
import { GET_TRENDING_SEARCHES } from '@/graphql/queries/adminQueries';
import ContentRating from '@/components/common/ContentRating';
import { FiSearch, FiDatabase, FiChevronLeft, FiFilter, FiX, FiChevronDown, FiCalendar, FiClock, FiTrendingUp, FiTrash2 } from 'react-icons/fi';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'rating_asc', label: 'Lowest Rated' },
  { value: 'year_desc', label: 'Newest First' },
  { value: 'year_asc', label: 'Oldest First' },
  { value: 'title_asc', label: 'Title A-Z' },
  { value: 'title_desc', label: 'Title Z-A' },
];

const GENRE_FILTERS = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance',
  'Sci-Fi', 'Thriller', 'War', 'Documentary',
];

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;

  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [yearMin, setYearMin] = useState(1970);
  const [yearMax, setYearMax] = useState(new Date().getFullYear());
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showTrending, setShowTrending] = useState(false);

  const { loading, data } = useQuery(SEARCH_MOVIES, {
    variables: { query: q || '', limit: 50 },
    skip: !q,
    fetchPolicy: 'cache-first',
  });

  // Trending searches query
  const { data: trendingData } = useQuery(GET_TRENDING_SEARCHES, {
    variables: { limit: 8 },
    fetchPolicy: 'cache-first',
  });
  const trendingSearches = trendingData?.trendingSearches || [];

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('clipx_search_history') || '[]');
      setSearchHistory(saved.slice(0, 10));
    } catch { setSearchHistory([]); }
  }, []);

  // Save search to history when q changes
  useEffect(() => {
    if (q && q.trim()) {
      setSearchHistory(prev => {
        const updated = [q, ...prev.filter(h => h !== q)].slice(0, 10);
        try { localStorage.setItem('clipx_search_history', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  }, [q]);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    try { localStorage.removeItem('clipx_search_history'); } catch {}
  }, []);

  const handleHistoryClick = useCallback((term) => {
    router.push({ pathname: '/search', query: { q: term } });
  }, [router]);

  const rawResults = data?.searchMovies?.items || [];

  // Client-side filtering and sorting
  const filteredResults = useMemo(() => {
    let items = [...rawResults];

    // Genre filter
    if (selectedGenres.length > 0) {
      items = items.filter(movie => {
        const movieGenres = movie.genres?.map(g => g.name?.toLowerCase()) || [];
        return selectedGenres.some(sg => movieGenres.includes(sg.toLowerCase()));
      });
    }

    // Rating filter
    if (minRating > 0) {
      items = items.filter(movie => (movie.voteAverage || movie.rating || 0) >= minRating);
    }

    // Year range filter
    if (yearMin > 1970 || yearMax < new Date().getFullYear()) {
      items = items.filter(movie => {
        const year = parseInt(movie.releaseDate?.slice(0, 4) || movie.year || '0');
        return year >= yearMin && year <= yearMax;
      });
    }

    // Sorting
    switch (sortBy) {
      case 'rating_desc':
        items.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
        break;
      case 'rating_asc':
        items.sort((a, b) => (a.voteAverage || 0) - (b.voteAverage || 0));
        break;
      case 'year_desc':
        items.sort((a, b) => {
          const ya = parseInt(a.releaseDate || a.year || '0');
          const yb = parseInt(b.releaseDate || b.year || '0');
          return yb - ya;
        });
        break;
      case 'year_asc':
        items.sort((a, b) => {
          const ya = parseInt(a.releaseDate || a.year || '0');
          const yb = parseInt(b.releaseDate || b.year || '0');
          return ya - yb;
        });
        break;
      case 'title_asc':
        items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'title_desc':
        items.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      default:
        break;
    }

    return items;
  }, [rawResults, selectedGenres, minRating, sortBy]);

  // Reset visible count when filters/query change
  useEffect(() => {
    setVisibleCount(20);
  }, [q, selectedGenres, minRating, sortBy]);

  const visibleResults = filteredResults.slice(0, visibleCount);
  const hasMore = visibleCount < filteredResults.length;

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setMinRating(0);
    setYearMin(1970);
    setYearMax(new Date().getFullYear());
    setSortBy('relevance');
  };

  const hasActiveFilters = selectedGenres.length > 0 || minRating > 0 || sortBy !== 'relevance' || yearMin > 1970 || yearMax < new Date().getFullYear();

  return (
    <>
      <Head>
        <title>{q ? `Search: ${q}` : 'Search'} - clipX</title>
        <meta name="description" content="Search for movies" />
      </Head>

      <div className="min-h-screen py-24 px-6 bg-[#050607]">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors mb-6 group"
          >
            <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          {/* Search Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 italic uppercase tracking-tighter">
              Search <span className="text-primary-500">Universe</span>
            </h1>
            <div className="max-w-2xl relative">
              <SearchBar placeholder="Scan for cinematic signals..." autoFocus hideDropdown={true} />
              <div className="absolute inset-0 -z-10 bg-primary-500/5 blur-2xl rounded-full" />
            </div>
          </motion.div>

          {/* Filter & Sort Bar */}
          {q && !loading && rawResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-3 mb-6"
            >
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border
                  ${showFilters || hasActiveFilters
                    ? 'bg-primary-500/20 text-primary-400 border-primary-500/30'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
              >
                <FiFilter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center font-black">
                    {selectedGenres.length + (minRating > 0 ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                >
                  {SORT_OPTIONS.find(s => s.value === sortBy)?.label || 'Sort'}
                  <FiChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
                    >
                      {SORT_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => { setSortBy(option.value); setShowSortMenu(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors
                            ${sortBy === option.value ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:bg-white/10'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="w-4 h-4" /> Clear
                </button>
              )}

              {/* Result count */}
              <span className="text-gray-500 text-sm ml-auto">
                {filteredResults.length} of {rawResults.length} results
              </span>
            </motion.div>
          )}

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                  {/* Genre Tags */}
                  <div className="mb-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {GENRE_FILTERS.map(genre => (
                        <button
                          key={genre}
                          onClick={() => toggleGenre(genre)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                            ${selectedGenres.includes(genre)
                              ? 'bg-primary-500/20 text-primary-400 border-primary-500/30'
                              : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Minimum Rating */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                      Minimum Rating: <span className="text-primary-400">{minRating > 0 ? `${minRating}+` : 'Any'}</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="9"
                        step="1"
                        value={minRating}
                        onChange={(e) => setMinRating(Number(e.target.value))}
                        className="w-full max-w-xs accent-primary-500 cursor-pointer"
                      />
                      <div className="flex gap-1">
                        {[0, 5, 7, 8].map(r => (
                          <button
                            key={r}
                            onClick={() => setMinRating(r)}
                            className={`px-2 py-1 text-xs font-bold rounded transition-colors
                              ${minRating === r ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                          >
                            {r === 0 ? 'Any' : `${r}+`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Year Range */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FiCalendar className="w-3 h-3" />
                      Year Range: <span className="text-primary-400">{yearMin} – {yearMax}</span>
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">From</span>
                        <input
                          type="number"
                          min="1950"
                          max={yearMax}
                          value={yearMin}
                          onChange={(e) => setYearMin(Math.max(1950, parseInt(e.target.value) || 1950))}
                          className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-primary-500/30 text-center"
                        />
                      </div>
                      <div className="w-8 h-px bg-white/20" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">To</span>
                        <input
                          type="number"
                          min={yearMin}
                          max={new Date().getFullYear()}
                          value={yearMax}
                          onChange={(e) => setYearMax(Math.min(new Date().getFullYear(), parseInt(e.target.value) || new Date().getFullYear()))}
                          className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-primary-500/30 text-center"
                        />
                      </div>
                      <div className="flex gap-1 ml-auto">
                        {[{l: '2020s', min: 2020, max: 2029}, {l: '2010s', min: 2010, max: 2019}, {l: '2000s', min: 2000, max: 2009}, {l: 'All', min: 1970, max: new Date().getFullYear()}].map(p => (
                          <button
                            key={p.l}
                            onClick={() => { setYearMin(p.min); setYearMax(Math.min(p.max, new Date().getFullYear())); }}
                            className={`px-2 py-1 text-xs font-bold rounded transition-colors
                              ${yearMin === p.min && yearMax === Math.min(p.max, new Date().getFullYear()) ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                          >
                            {p.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search History Chiplets */}
          {searchHistory.length > 0 && !q && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-400 text-sm font-bold">
                  <FiClock className="w-4 h-4" />
                  Recent Searches
                </div>
                <button
                  onClick={clearSearchHistory} id="clear-search-history"
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-400 transition-colors"
                >
                  <FiTrash2 className="w-3 h-3" /> Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term, i) => (
                  <button
                    key={i} onClick={() => handleHistoryClick(term)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 hover:bg-primary-500/10 hover:border-primary-500/30 hover:text-primary-400 transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Trending Searches Panel */}
          {!q && trendingSearches.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
              <div className="flex items-center gap-2 text-gray-400 text-sm font-bold mb-3">
                <FiTrendingUp className="w-4 h-4 text-primary-400" />
                Trending Searches
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {trendingSearches.map((item, i) => (
                  <button
                    key={i} onClick={() => router.push({ pathname: '/search', query: { q: item.query } })}
                    className="group flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:border-primary-500/20 hover:bg-primary-500/5 transition-all text-left"
                  >
                    <span className="text-2xl font-black text-gray-700 group-hover:text-primary-500/50 transition-colors">{i + 1}</span>
                    <span className="text-sm text-gray-300 font-medium truncate group-hover:text-white transition-colors">{item.query}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results Content */}
          <AnimatePresence mode="wait">
            {!q ? (
              !searchHistory.length && !trendingSearches.length && (
                <EmptyState
                  icon={FiSearch}
                  title="Start searching"
                  message="Enter a movie title, actor, or director to find what you're looking for"
                />
              )
            ) : (
              <motion.div
                key="library"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {loading ? (
                  <div>
                    <p className="text-gray-400 mb-6">{`Searching for "${q}"...`}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {[...Array(10)].map((_, i) => (
                        <MovieCardSkeleton key={i} />
                      ))}
                    </div>
                  </div>
                ) : filteredResults.length > 0 ? (
                  <div>
                    <p className="text-gray-400 mb-6">
                      {`Found ${filteredResults.length} results for "${q}"`}
                      {hasActiveFilters && ` (filtered from ${rawResults.length})`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {visibleResults.map((movie, index) => (
                        <motion.div
                          key={movie.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}
                        >
                          <MovieCard movie={movie} />
                        </motion.div>
                      ))}
                    </div>
                    {hasMore && (
                      <div className="flex justify-center mt-10">
                        <button
                          onClick={() => setVisibleCount(prev => prev + 20)}
                          className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl border border-white/10 hover:border-primary-500/30 transition-all"
                        >
                          Load More ({filteredResults.length - visibleCount} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Zero-Results Fallback with Trending Suggestions */
                  <div>
                    <EmptyState
                      icon={FiDatabase}
                      title={hasActiveFilters ? 'No results match your filters' : `No results for "${q}"`}
                      message={hasActiveFilters ? 'Try adjusting your filters or search terms.' : "We couldn't find any content matching your search."}
                    />
                    {/* "You might also like" trending suggestions */}
                    {!hasActiveFilters && trendingSearches.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                        <p className="text-gray-400 text-sm font-bold mb-4 text-center">You might also like</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {trendingSearches.slice(0, 6).map((item, i) => (
                            <button
                              key={i}
                              onClick={() => router.push({ pathname: '/search', query: { q: item.query } })}
                              className="px-4 py-2 bg-white/5 text-gray-300 rounded-full text-sm hover:bg-primary-500/10 hover:text-primary-400 border border-white/10 hover:border-primary-500/30 transition-all"
                            >
                              {item.query}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}