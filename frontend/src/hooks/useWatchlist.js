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
    const handleStorageChange = () => {
      try {
        const raw = localStorage.getItem('watchlist');
        setWatchlist(raw ? JSON.parse(raw) : []);
      } catch (e) { }
    };

    // Listen for custom event from other instances
    window.addEventListener('watchlist_updated', handleStorageChange);
    // Listen for storage event from other tabs
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('watchlist_updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const saveAndDispatch = (newWatchlist) => {
    try {
      localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
      window.dispatchEvent(new Event('watchlist_updated'));
      setWatchlist(newWatchlist);
    } catch (e) { }
  };

  const addToWatchlist = (movieId) => {
    const newWatchlist = watchlist.includes(movieId) ? watchlist : [...watchlist, movieId];
    saveAndDispatch(newWatchlist);
  };

  const removeFromWatchlist = (movieId) => {
    const newWatchlist = watchlist.filter((id) => id !== movieId);
    saveAndDispatch(newWatchlist);
  };

  const clearWatchlist = () => {
    saveAndDispatch([]);
  };

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
    count: watchlist.length,
  };
}

export default useWatchlist;