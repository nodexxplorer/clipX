// src/hooks/useSearch.js
import { useState, useEffect, useCallback } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { useRouter } from 'next/router';
import { useDebounce } from './useInfiniteScroll';
import { SEARCH_MOVIES } from '@/graphql/queries/movieQueries';
import { TRACK_SEARCH } from '@/graphql/mutations/movieMutations';

export const useSearch = (options = {}) => {
  const {
    minLength = 2,
    debounceDelay = 300,
    limit = 10,
    trackSearches = true,
  } = options;

  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const debouncedQuery = useDebounce(query, debounceDelay);

  const [searchMovies, { loading, data, error }] = useLazyQuery(SEARCH_MOVIES);
  const [trackSearch] = useMutation(TRACK_SEARCH);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    }
  }, []);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= minLength) {
      searchMovies({ variables: { query: debouncedQuery, limit } });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery, minLength, limit, searchMovies]);

  // Save search to recent
  const saveToRecent = useCallback((searchTerm) => {
    const updated = [
      searchTerm,
      ...recentSearches.filter((s) => s !== searchTerm),
    ].slice(0, 10);
    
    setRecentSearches(updated);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }

    // Track search on server
    if (trackSearches) {
      trackSearch({ variables: { query: searchTerm } }).catch(() => {});
    }
  }, [recentSearches, trackSearch, trackSearches]);

  // Handle search submit
  const handleSearch = useCallback((searchQuery = query) => {
    const trimmed = searchQuery.trim();
    if (trimmed.length >= minLength) {
      saveToRecent(trimmed);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setQuery('');
      setIsOpen(false);
    }
  }, [query, minLength, router, saveToRecent]);

  // Handle result click
  const handleResultClick = useCallback((movieId) => {
    router.push(`/movies/${movieId}`);
    setQuery('');
    setIsOpen(false);
  }, [router]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setIsOpen(false);
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('recentSearches');
    }
  }, []);

  // Remove single recent search
  const removeRecentSearch = useCallback((searchTerm) => {
    const updated = recentSearches.filter((s) => s !== searchTerm);
    setRecentSearches(updated);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
  }, [recentSearches]);

  return {
    // State
    query,
    setQuery,
    isOpen,
    setIsOpen,
    
    // Results
    results: data?.searchMovies || [],
    loading,
    error,
    
    // Recent searches
    recentSearches,
    clearRecentSearches,
    removeRecentSearch,
    
    // Actions
    handleSearch,
    handleResultClick,
    clearSearch,
    saveToRecent,
  };
};

export default useSearch;