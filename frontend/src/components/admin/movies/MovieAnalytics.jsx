// frontend/src/components/admin/movies/MovieAnalytics.jsx
import { FiEye, FiDownload, FiHeart, FiTrendingUp } from 'react-icons/fi';

export default function MovieAnalytics({ movie, stats = {} }) {
  const metrics = [
    { label: 'Total Views', value: stats.views || 0, icon: FiEye, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Downloads', value: stats.downloads || 0, icon: FiDownload, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Watchlist Adds', value: stats.watchlistAdds || 0, icon: FiHeart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { label: 'Avg. Watch Time', value: stats.avgWatchTime ? `${Math.round(stats.avgWatchTime)}m` : '—', icon: FiTrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-5">
            <div className={`${m.bg} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>
              <m.icon className={m.color} size={16} />
            </div>
            <p className="text-2xl font-black text-white tabular-nums">
              {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
            </p>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Trend */}
      {stats.weeklyViews?.length > 0 && (
        <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Views Trend</h3>
          </div>
          <div className="p-5">
            <div className="flex items-end gap-1 h-32">
              {stats.weeklyViews.map((val, i) => {
                const max = Math.max(...stats.weeklyViews, 1);
                const h = (val / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 tabular-nums">{val}</span>
                    <div className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm min-h-[2px] transition-all group-hover:from-primary-500"
                      style={{ height: `${Math.max(h, 2)}%` }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
