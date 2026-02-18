// src/contexts/MovieContext.js
import { createContext, useContext, useState, useCallback } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useMovieDownload } from '@/hooks/useMovies';

const MovieContext = createContext();

export const MovieProvider = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentlyViewed');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const watchlist = useWatchlist();
  const { downloadMovie } = useMovieDownload();

  // Track recently viewed movies
  const addToRecentlyViewed = useCallback((movie) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((m) => m.id !== movie.id);
      const updated = [movie, ...filtered].slice(0, 20); // Keep last 20
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      }
      
      return updated;
    });
  }, []);

  // Clear recently viewed
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('recentlyViewed');
    }
  }, []);

  // Handle movie download
  const handleDownload = useCallback(
    async (movieId, title) => {
      const result = await downloadMovie(movieId, title);
      return result;
    },
    [downloadMovie]
  );

  const value = {
    // Recently viewed
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    
    // Watchlist
    watchlist: watchlist.watchlist,
    isInWatchlist: watchlist.isInWatchlist,
    addToWatchlist: watchlist.addToWatchlist,
    removeFromWatchlist: watchlist.removeFromWatchlist,
    toggleWatchlist: watchlist.toggleWatchlist,
    clearWatchlist: watchlist.clearWatchlist,
    watchlistCount: watchlist.count,
    
    // Download
    handleDownload,
  };

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>;
};

export const useMovieContext = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovieContext must be used within MovieProvider');
  }
  return context;
};

export default MovieContext;