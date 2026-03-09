import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { FiPlay, FiHeart, FiStar, FiFilm, FiDownload } from 'react-icons/fi';
import Image from 'next/image';

const getSlug = (text) => text ? text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '') : '';

/**
 * Stores slug→id mapping in sessionStorage so [id].js can resolve
 * a clean slug URL back to the real API id on page load / refresh.
 */
const storeSlugMapping = (slug, id) => {
  try { sessionStorage.setItem('clipx_s_' + slug, String(id)); } catch { }
};

const MovieCard = ({ movie, size = 'md', showWatchlistButton = false, isSeries = false, isAnime = false }) => {
  const router = useRouter();

  // Normalize field names (handle both posterUrl and posterPath)
  const posterUrl = movie.posterUrl || movie.posterPath;
  const rating = movie.rating || movie.voteAverage;

  const sizeClasses = { sm: 'aspect-[2/3]', md: 'aspect-[2/3]', lg: 'aspect-[2/3]' };

  const slug = getSlug(movie.title);

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
    // TODO: wire to Apollo mutation
  };

  const [imgError, setImgError] = useState(false);

  // ── Determine media type badge ─────────────────
  const getMediaLabel = () => {
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
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {rating && (
            <div className="px-1.5 py-0.5 bg-yellow-500 text-black text-[10px] font-black rounded flex items-center gap-0.5">
              <FiStar className="fill-current" />
              {rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Hover Info */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
          <h3 className="text-white font-black text-xs sm:text-sm md:text-base uppercase italic leading-tight mb-1 text-shadow line-clamp-2">
            {movie.title}
          </h3>

          <div className="flex items-center gap-2 text-[10px] text-gray-300 mb-2 font-bold uppercase tracking-tighter">
            {movie.year && <span>{movie.year}</span>}
            <span className="w-1 h-1 bg-gray-500 rounded-full" />
            <span>{getMediaLabel()}</span>
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
              className="w-8 h-8 bg-white/20 backdrop-blur-md rounded flex items-center justify-center text-white hover:bg-white/40 transition-colors"
            >
              <FiHeart size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;