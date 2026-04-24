// frontend/src/components/admin/genres/GenreTable.jsx
import { FiGrid, FiFilm, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function GenreTable({ genres = [], onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] rounded-2xl h-28 animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  if (!genres.length) {
    return (
      <div className="py-16 text-center">
        <FiGrid className="w-8 h-8 text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No genres found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {genres.map((genre) => (
        <div key={genre.id} className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-5 group hover:border-primary-500/20 hover:scale-[1.02] transition-all duration-200 relative">
          <div className="flex items-center justify-between mb-3">
            <FiGrid className="text-primary-400" size={18} />
            <span className="text-xs font-bold bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">{genre.slug || genre.id}</span>
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">{genre.name}</h3>
          <div className="flex items-center gap-1.5 mt-2">
            <FiFilm size={12} className="text-gray-600" />
            <span className="text-xs text-gray-500">{genre.movieCount || 0} movies</span>
          </div>

          {/* Hover actions */}
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button onClick={() => onEdit(genre)} className="p-1.5 bg-white/5 hover:bg-blue-500/10 rounded-lg transition-colors">
                <FiEdit2 size={12} className="text-gray-400 hover:text-blue-400" />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(genre)} className="p-1.5 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors">
                <FiTrash2 size={12} className="text-gray-400 hover:text-red-400" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
