// frontend/src/components/admin/dashboard/RecentActivity.jsx
import { FiUser, FiFilm, FiDownload, FiHeart, FiBookmark, FiPlay, FiAward, FiStar, FiFlag, FiBell, FiUserPlus, FiClock } from 'react-icons/fi';

const iconMap = {
  user_signup: { icon: FiUserPlus, bg: 'bg-blue-500/10', color: 'text-blue-400' },
  movie_view: { icon: FiFilm, bg: 'bg-purple-500/10', color: 'text-purple-400' },
  download: { icon: FiDownload, bg: 'bg-green-500/10', color: 'text-green-400' },
  watchlist_add: { icon: FiHeart, bg: 'bg-pink-500/10', color: 'text-pink-400' },
  watchlist: { icon: FiBookmark, bg: 'bg-amber-500/10', color: 'text-amber-400' },
  watch: { icon: FiPlay, bg: 'bg-cyan-500/10', color: 'text-cyan-400' },
  milestone: { icon: FiAward, bg: 'bg-yellow-500/10', color: 'text-yellow-400' },
  content: { icon: FiFilm, bg: 'bg-indigo-500/10', color: 'text-indigo-400' },
  review: { icon: FiStar, bg: 'bg-orange-500/10', color: 'text-orange-400' },
  report: { icon: FiFlag, bg: 'bg-red-500/10', color: 'text-red-400' },
  system: { icon: FiBell, bg: 'bg-gray-500/10', color: 'text-gray-400' },
  social: { icon: FiUser, bg: 'bg-teal-500/10', color: 'text-teal-400' },
};

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function RecentActivity({ activities = [] }) {
  return (
    <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity</h3>
        <FiClock className="text-gray-600" size={16} />
      </div>
      <div className="divide-y divide-white/[0.03]">
        {activities.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <FiBell className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No recent activity</p>
          </div>
        ) : (
          activities.slice(0, 8).map((activity) => {
            const config = iconMap[activity.type] || iconMap.system;
            const Icon = config.icon;
            return (
              <div key={activity.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className={`w-9 h-9 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={config.color} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{activity.description}</p>
                </div>
                <span className="text-[11px] text-gray-600 flex-shrink-0 tabular-nums">{timeAgo(activity.timestamp)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}