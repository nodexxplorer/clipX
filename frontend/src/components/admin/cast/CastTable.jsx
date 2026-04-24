// frontend/src/components/admin/cast/CastTable.jsx
import Image from 'next/image';
import { FiUser, FiEdit2, FiTrash2, FiFilm } from 'react-icons/fi';

export default function CastTable({ cast = [], onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] rounded-xl p-4 animate-pulse h-40 border border-white/5" />
        ))}
      </div>
    );
  }

  if (!cast.length) {
    return (
      <div className="text-center py-16">
        <FiUser className="w-8 h-8 mx-auto mb-3 text-gray-700" />
        <p className="text-sm text-gray-500">No cast members found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {cast.map((person) => (
        <div key={person.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center hover:border-primary-500/20 transition-all group relative">
          {person.profileImage ? (
            <Image src={person.profileImage} alt={person.name} width={64} height={64} className="rounded-full mx-auto object-cover ring-2 ring-white/10" />
          ) : (
            <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-br from-primary-500/30 to-purple-500/30 flex items-center justify-center">
              <FiUser className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <p className="text-white text-sm font-bold mt-3 truncate">{person.name}</p>
          {person.character && <p className="text-gray-500 text-xs truncate mt-0.5">{person.character}</p>}
          {person.movieCount != null && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <FiFilm size={10} className="text-gray-600" />
              <span className="text-[10px] text-gray-500">{person.movieCount} movies</span>
            </div>
          )}

          {/* Hover actions */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button onClick={() => onEdit(person)} className="p-1.5 bg-black/40 hover:bg-blue-500/20 rounded-lg transition-colors">
                <FiEdit2 size={11} className="text-gray-400" />
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(person)} className="p-1.5 bg-black/40 hover:bg-red-500/20 rounded-lg transition-colors">
                <FiTrash2 size={11} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
