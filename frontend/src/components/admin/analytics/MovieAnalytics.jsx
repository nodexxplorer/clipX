// frontend/src/components/admin/analytics/MovieAnalytics.jsx
import Image from 'next/image';
import { FiStar, FiEye, FiDownload, FiHeart } from 'react-icons/fi';

export default function MovieAnalytics({ topMovies = [], genreDistribution = [], loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.02] rounded-2xl h-80 animate-pulse border border-white/5" />
        <div className="bg-white/[0.02] rounded-2xl h-80 animate-pulse border border-white/5" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Movies */}
      <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Performing Movies</h3>
        </div>
        <div className="divide-y divide-white/[0.03] max-h-[400px] overflow-y-auto">
          {topMovies.length > 0 ? topMovies.map((item, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
              <span className="text-xs font-black text-gray-600 w-5">{i + 1}</span>
              <div className="relative w-9 h-13 flex-shrink-0">
                <Image src={item.movie?.posterUrl || '/images/placeholder.jpg'} alt="" fill className="object-cover rounded-lg ring-1 ring-white/5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.movie?.title || 'Unknown'}</p>
              </div>
              <div className="flex gap-4 text-right">
                <div><p className="text-xs font-bold text-gray-300 tabular-nums">{(item.views || 0).toLocaleString()}</p><p className="text-[10px] text-gray-600">views</p></div>
                <div><p className="text-xs font-bold text-gray-300 tabular-nums">{(item.downloads || 0).toLocaleString()}</p><p className="text-[10px] text-gray-600">downloads</p></div>
              </div>
            </div>
          )) : <p className="text-sm text-gray-600 text-center py-8">No data</p>}
        </div>
      </div>

      {/* Genre Distribution */}
      <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Genre Distribution</h3>
        </div>
        <div className="divide-y divide-white/[0.03] max-h-[400px] overflow-y-auto">
          {genreDistribution.length > 0 ? genreDistribution.map((g, i) => {
            const maxCount = Math.max(...genreDistribution.map(x => x.movieCount || 0), 1);
            return (
              <div key={i} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-white">{g.genre?.name || g.name}</span>
                  <span className="text-xs text-gray-500 tabular-nums">{g.movieCount} movies</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all" style={{ width: `${((g.movieCount || 0) / maxCount) * 100}%` }} />
                </div>
              </div>
            );
          }) : <p className="text-sm text-gray-600 text-center py-8">No data</p>}
        </div>
      </div>
    </div>
  );
}
