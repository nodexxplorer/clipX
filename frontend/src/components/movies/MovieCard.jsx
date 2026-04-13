import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { FiPlay, FiHeart, FiStar, FiFilm, FiDownload, FiCheck } from 'react-icons/fi';
import Image from 'next/image';
import { toSlug, storeSlugMapping } from '@/utils/slug';

const MovieCard = ({ movie, size = 'md', showWatchlistButton = false, isSeries = false, isAnime = false }) => {
  const router = useRouter();

  // Normalize field names (handle both posterUrl and posterPath)
  const posterUrl = movie.posterUrl || movie.posterPath;
  const rating = movie.rating || movie.voteAverage;

  const sizeClasses = { sm: 'aspect-[2/3]', md: 'aspect-[2/3]', lg: 'aspect-[2/3]' };

  const slug = toSlug(movie.title, movie.id);

  // Watchlist state backed by localStorage
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('watchlist');
      const list = raw ? JSON.parse(raw) : [];
      setIsInWatchlist(list.includes(String(movie.id)));
    } catch { }

    const handleUpdate = () => {
      try {
        const raw = localStorage.getItem('watchlist');
        const list = raw ? JSON.parse(raw) : [];
        setIsInWatchlist(list.includes(String(movie.id)));
      } catch { }
    };
    window.addEventListener('watchlist_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('watchlist_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [movie.id]);

  // Prefetch the movie detail + watch page on hover for instant navigation
  const handlePrefetch = useCallback(() => {
    storeSlugMapping(slug, movie.id);
    router.prefetch(`/movies/${slug}`);
    router.prefetch(`/watch/${slug}?s=1&e=1`);
  }, [slug, movie.id, router]);

  const handleCardClick = () => {
    storeSlugMapping(slug, movie.id);
    router.push(`/movies/${slug}`);
  };

  const handleWatch = (e) => {
    e.stopPropagation();
    storeSlugMapping(slug, movie.id);
    router.push(`/watch/${slug}?s=1&e=1`);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    storeSlugMapping(slug, movie.id);
    router.push(`/movies/${slug}#download`);
  };

  const handleAddToWatchlist = (e) => {
    e.stopPropagation();
    try {
      const raw = localStorage.getItem('watchlist');
      const list = raw ? JSON.parse(raw) : [];
      const mid = String(movie.id);
      let updated;
      if (list.includes(mid)) {
        updated = list.filter(id => id !== mid);
      } else {
        updated = [...list, mid];
      }
      localStorage.setItem('watchlist', JSON.stringify(updated));
      window.dispatchEvent(new Event('watchlist_updated'));
      setIsInWatchlist(updated.includes(mid));
    } catch { }
  };

  const [imgError, setImgError] = useState(false);

  // ── Determine media type badge ─────────────────
  // Series classification: anything with episodes/seasons = series
  const getMediaLabel = () => {
    if (movie.seasons?.length > 0) return 'Series';
    if (movie.type) {
      const t = movie.type.toLowerCase();
      if (t === 'tv' || t === 'series') return 'Series';
      if (t === 'anime') return 'Anime';
      return movie.type.charAt(0).toUpperCase() + movie.type.slice(1);
    }
    if (isSeries) return 'Series';
    if (isAnime) return 'Anime';
    if (movie.mediaType === 'tv') return 'Series';
    if (movie.seasons && movie.seasons.length > 0) return 'Series';
    if (movie.firstAirDate && !movie.releaseDate) return 'Series';
    if (movie.isSeries) return 'Series';
    return 'Movie';
  };

  return (
    <motion.div
      className="relative group cursor-pointer h-full"
      onClick={handleCardClick}
      onMouseEnter={handlePrefetch}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className={`relative ${sizeClasses[size]} overflow-hidden rounded-md bg-gray-900 shadow-lg group-hover:shadow-primary-500/20 transition-all duration-300`}>
        {posterUrl && !imgError ? (
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-500 p-4 text-center">
            <FiFilm size={40} className="mb-2 opacity-20" />
            <span className="text-xs uppercase tracking-widest font-bold">{movie.title}</span>
          </div>
        )}

        {/* Cinematic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {rating && (
            <div className="px-1.5 py-0.5 bg-yellow-500 text-black text-[10px] font-black rounded flex items-center gap-0.5">
              <FiStar className="fill-current" />
              {rating.toFixed(1)}
            </div>
          )}
          {/* "New" badge — content added within last 30 days */}
          {(() => {
            const date = movie.releaseDate || movie.firstAirDate || movie.createdAt;
            if (!date) return null;
            const daysSince = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince <= 30 && daysSince >= 0) {
              return (
                <div className="px-1.5 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-black rounded uppercase tracking-wider">
                  New
                </div>
              );
            }
            return null;
          })()}
          {/* Content rating badge */}
          {movie.contentRating && (
            <div className="px-1.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[9px] font-black rounded border border-white/20">
              {movie.contentRating}
            </div>
          )}
        </div>

        {/* Hover Info */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
          <h3 className="text-white font-black text-xs sm:text-sm md:text-base uppercase italic leading-tight mb-1 text-shadow line-clamp-2">
            {movie.title}
          </h3>

          <div className="flex items-center gap-2 text-[10px] text-gray-300 mb-2 font-bold uppercase tracking-tighter flex-wrap">
            {movie.year && <span>{movie.year}</span>}
            <span className="w-1 h-1 bg-gray-500 rounded-full" />
            <span>{getMediaLabel()}</span>
            {movie.runtime && (
              <>
                <span className="w-1 h-1 bg-gray-500 rounded-full" />
                <span>{movie.runtime >= 60 ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : `${movie.runtime}m`}</span>
              </>
            )}
          </div>

          {/* Action buttons — Watch + Download + Heart */}
          <div className="flex gap-1.5">
            <button
              onClick={handleWatch}
              className="flex-1 bg-white text-black py-1.5 rounded text-[10px] font-black uppercase flex items-center justify-center gap-1 hover:bg-primary-500 hover:text-white transition-colors"
            >
              <FiPlay className="fill-current" /> Watch
            </button>
            <button
              onClick={handleDownload}
              className="w-8 h-8 bg-green-500/80 backdrop-blur-md rounded flex items-center justify-center text-white hover:bg-green-400 transition-colors"
              title="Download"
            >
              <FiDownload size={13} />
            </button>
            <button
              onClick={handleAddToWatchlist}
              className={`w-8 h-8 backdrop-blur-md rounded flex items-center justify-center text-white transition-colors ${isInWatchlist ? 'bg-primary-500/80 hover:bg-primary-400' : 'bg-white/20 hover:bg-white/40'
                }`}
            >
              {isInWatchlist ? <FiCheck size={13} /> : <FiHeart size={13} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;