// frontend/src/components/admin/movies/MovieTable.jsx
import Image from 'next/image';
import Link from 'next/link';
import { FiEye, FiEdit2, FiTrash2, FiStar } from 'react-icons/fi';

export default function MovieTable({ movies = [], onDelete, loading }) {
  if (loading) {
    return (
      <div className="divide-y divide-white/[0.03]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-14 rounded-lg bg-white/5 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-40 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-24 bg-white/[0.03] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!movies.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-sm">No movies found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Movie</th>
            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Rating</th>
            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Genres</th>
            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Year</th>
            <th className="px-5 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {movies.map((movie) => (
            <tr key={movie.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-14 flex-shrink-0">
                    <Image src={movie.posterUrl || '/images/placeholder.jpg'} alt="" fill className="object-cover rounded-lg ring-1 ring-white/5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{movie.title}</p>
                    {movie.tagline && <p className="text-xs text-gray-600 truncate italic">{movie.tagline}</p>}
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <span className="flex items-center gap-1 text-sm">
                  <FiStar className="text-yellow-400 fill-yellow-400" size={12} />
                  <span className="text-yellow-400 font-bold tabular-nums">{movie.rating?.toFixed(1) || '—'}</span>
                </span>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex flex-wrap gap-1">
                  {(movie.genres || []).slice(0, 2).map((g, i) => (
                    <span key={i} className="text-[10px] font-medium bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">
                      {typeof g === 'string' ? g : g.name}
                    </span>
                  ))}
                  {(movie.genres?.length || 0) > 2 && (
                    <span className="text-[10px] text-gray-600">+{movie.genres.length - 2}</span>
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5 text-sm text-gray-500 tabular-nums">{movie.year || '—'}</td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/admin/movies/${movie.id}`}>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group"><FiEye className="text-gray-500 group-hover:text-white" size={15} /></button>
                  </Link>
                  <Link href={`/admin/movies/${movie.id}/edit`}>
                    <button className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors group"><FiEdit2 className="text-gray-500 group-hover:text-blue-400" size={15} /></button>
                  </Link>
                  <button onClick={() => onDelete?.(movie)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group">
                    <FiTrash2 className="text-gray-500 group-hover:text-red-400" size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
