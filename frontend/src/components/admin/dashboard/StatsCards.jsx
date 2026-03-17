// frontend/src/components/admin/dashboard/StatsCards.jsx
import { FiUsers, FiFilm, FiDownload, FiTrendingUp, FiBookmark, FiClock } from 'react-icons/fi';

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: `+${stats?.newUsersToday || 0} today`,
      sub: `${stats?.newUsersThisWeek || 0} this week`,
      icon: FiUsers,
      gradient: 'from-blue-500/20 to-cyan-500/5',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/10',
    },
    {
      title: 'Total Movies',
      value: stats?.totalMovies || 0,
      change: `${stats?.totalGenres || 0} genres`,
      sub: 'in library',
      icon: FiFilm,
      gradient: 'from-purple-500/20 to-pink-500/5',
      iconBg: 'bg-purple-500/15',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/10',
    },
    {
      title: 'Watchlist Items',
      value: stats?.totalWatchlistItems || 0,
      change: 'All time',
      sub: 'saves by users',
      icon: FiBookmark,
      gradient: 'from-emerald-500/20 to-green-500/5',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/10',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      change: 'Last 7 days',
      sub: `avg. ${stats?.avgSessionDuration || '0m'} session`,
      icon: FiTrendingUp,
      gradient: 'from-amber-500/20 to-orange-500/5',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} rounded-2xl p-5 border ${card.borderColor} backdrop-blur-sm group hover:scale-[1.02] transition-transform duration-200`}>
          {/* Glow effect */}
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/[0.02] group-hover:bg-white/[0.04] transition-colors" />

          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{card.title}</p>
              <p className="text-3xl font-black text-white mt-2 tabular-nums tracking-tight">
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-medium text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">{card.change}</span>
              </div>
            </div>
            <div className={`${card.iconBg} p-3 rounded-xl`}>
              <card.icon size={20} className={card.iconColor} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}