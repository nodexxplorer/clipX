// frontend/src/components/admin/genres/GenreStats.jsx
import { FiBarChart2, FiFilm, FiTrendingUp } from 'react-icons/fi';

export default function GenreStats({ genres = [], loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-white/[0.02] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!genres.length) {
    return (
      <div className="py-12 text-center">
        <FiBarChart2 className="w-8 h-8 text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No genre data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...genres.map(g => g.movieCount || 0), 1);
  const total = genres.reduce((sum, g) => sum + (g.movieCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-4 text-center">
          <p className="text-2xl font-black text-white">{genres.length}</p>
          <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Genres</p>
        </div>
        <div className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-4 text-center">
          <p className="text-2xl font-black text-white">{total.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Total Movies</p>
        </div>
        <div className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-4 text-center">
          <p className="text-2xl font-black text-white">{Math.round(total / genres.length)}</p>
          <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Avg / Genre</p>
        </div>
      </div>

      {/* Distribution bars */}
      <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Distribution</h3>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {genres.sort((a, b) => (b.movieCount || 0) - (a.movieCount || 0)).map((g, i) => (
            <div key={i} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-white">{g.name}</span>
                <span className="text-xs text-gray-500 tabular-nums">{g.movieCount || 0} ({total ? Math.round(((g.movieCount || 0) / total) * 100) : 0}%)</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all"
                  style={{ width: `${((g.movieCount || 0) / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
