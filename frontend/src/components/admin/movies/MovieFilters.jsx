// frontend/src/components/admin/movies/MovieFilters.jsx
import { FiSearch, FiFilter } from 'react-icons/fi';

const GENRE_OPTIONS = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music',
  'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western',
];

export default function MovieFilters({ search, onSearchChange, genre, onGenreChange, sort, onSortChange, contentType, onContentTypeChange }) {
  return (
    <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={15} />
        <input
          type="text"
          placeholder="Search movies..."
          value={search || ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full bg-white/5 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-white/5 focus:border-primary-500/30 outline-none transition-colors placeholder-gray-600"
        />
      </div>
      <select
        value={genre || 'all'}
        onChange={(e) => onGenreChange?.(e.target.value)}
        className="bg-white/5 text-sm text-gray-300 px-4 py-2.5 rounded-xl border border-white/5 outline-none cursor-pointer"
      >
        <option value="all">All Genres</option>
        {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
      <select
        value={contentType || 'all'}
        onChange={(e) => onContentTypeChange?.(e.target.value)}
        className="bg-white/5 text-sm text-gray-300 px-4 py-2.5 rounded-xl border border-white/5 outline-none cursor-pointer"
      >
        <option value="all">All Types</option>
        <option value="movie">Movies</option>
        <option value="series">Series</option>
        <option value="documentary">Documentary</option>
      </select>
      <select
        value={sort || 'newest'}
        onChange={(e) => onSortChange?.(e.target.value)}
        className="bg-white/5 text-sm text-gray-300 px-4 py-2.5 rounded-xl border border-white/5 outline-none cursor-pointer"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="rating">Top Rated</option>
        <option value="title">A-Z</option>
      </select>
    </div>
  );
}
