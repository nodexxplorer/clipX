// frontend/src/components/admin/dashboard/TopMoviesTable.jsx
import { FiTrendingUp } from 'react-icons/fi';

export default function TopMoviesTable({ movies = [] }) {
  return (
    <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Movies</h3>
        <FiTrendingUp className="text-primary-400" size={16} />
      </div>
      <div className="divide-y divide-white/[0.03]">
        {movies?.length > 0 ? movies.slice(0, 5).map((item, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
            <span className="text-xs font-black text-gray-600 w-5">{i + 1}</span>
            <img
              src={item.movie?.posterUrl || '/placeholder.jpg'}
              alt={item.movie?.title}
              className="w-9 h-13 object-cover rounded-lg ring-1 ring-white/5 group-hover:ring-primary-500/20 transition-all"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-primary-400 transition-colors">{item.movie?.title}</p>
              <p className="text-[11px] text-gray-500">{item.views?.toLocaleString()} views</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-300 tabular-nums">{item.downloads?.toLocaleString()}</p>
              <p className="text-[10px] text-gray-600">downloads</p>
            </div>
          </div>
        )) : (
          <div className="px-5 py-8 text-center text-gray-600 text-sm">No movie data yet</div>
        )}
      </div>
    </div>
  );
}