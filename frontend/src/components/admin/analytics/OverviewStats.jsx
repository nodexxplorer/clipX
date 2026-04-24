// frontend/src/components/admin/analytics/OverviewStats.jsx
import { FiUsers, FiFilm, FiTrendingUp, FiDownload, FiBarChart2, FiActivity } from 'react-icons/fi';

export default function OverviewStats({ stats = {}, loading }) {
  const cards = [
    { label: 'Total Users', value: stats.totalUsers || 0, icon: FiUsers, color: 'text-blue-400', bg: 'bg-blue-500/10', change: stats.newUsersToday ? `+${stats.newUsersToday} today` : null },
    { label: 'Total Movies', value: stats.totalMovies || 0, icon: FiFilm, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Active Users', value: stats.activeUsers || 0, icon: FiActivity, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Total Downloads', value: stats.totalDownloads || 0, icon: FiDownload, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'New This Week', value: stats.newUsersThisWeek || 0, icon: FiTrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Genres', value: stats.totalGenres || 0, icon: FiBarChart2, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] rounded-2xl h-28 animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className={`${card.bg} w-10 h-10 rounded-xl flex items-center justify-center`}>
              <card.icon className={card.color} size={18} />
            </div>
            {card.change && (
              <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                {card.change}
              </span>
            )}
          </div>
          <p className="text-3xl font-black text-white tabular-nums">{card.value.toLocaleString()}</p>
          <p className="text-[11px] text-gray-600 uppercase tracking-wider font-bold mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
