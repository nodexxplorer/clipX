import { useState, useEffect } from 'react';

// Simple localStorage-backed watchlist hook used by the frontend.
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' && localStorage.getItem('watchlist');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
    } catch (e) {
      // ignore
    }
  }, [watchlist]);

  const addToWatchlist = (movieId) => {
    setWatchlist((prev) => (prev.includes(movieId) ? prev : [...prev, movieId]));
  };

  const removeFromWatchlist = (movieId) => {
    setWatchlist((prev) => prev.filter((id) => id !== movieId));
  };

  const clearWatchlist = () => setWatchlist([]);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
    count: watchlist.length,
  };
}

export default useWatchlist;