// frontend/src/components/admin/users/UserActivity.jsx
import { FiClock, FiLogIn, FiFilm, FiHeart, FiDownload, FiAlertCircle } from 'react-icons/fi';

const ICONS = {
  login: FiLogIn,
  login_failed: FiAlertCircle,
  account_locked: FiAlertCircle,
  watchlist_add: FiHeart,
  download: FiDownload,
  watch: FiFilm,
  default: FiClock,
};

const COLORS = {
  login: 'text-green-400 bg-green-500/10',
  login_failed: 'text-red-400 bg-red-500/10',
  account_locked: 'text-red-400 bg-red-500/10',
  watchlist_add: 'text-pink-400 bg-pink-500/10',
  download: 'text-blue-400 bg-blue-500/10',
  watch: 'text-purple-400 bg-purple-500/10',
  default: 'text-gray-400 bg-gray-500/10',
};

export default function UserActivity({ activities = [], loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-white/5" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-40 bg-white/5 rounded" />
              <div className="h-2.5 w-24 bg-white/[0.03] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="py-12 text-center">
        <FiClock className="w-8 h-8 text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((item, i) => {
        const Icon = ICONS[item.type] || ICONS.default;
        const color = COLORS[item.type] || COLORS.default;
        return (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{item.description || item.type}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {item.ip && <span className="text-[10px] text-gray-600 tabular-nums">{item.ip}</span>}
                {item.device && <span className="text-[10px] text-gray-600 truncate">{item.device}</span>}
              </div>
            </div>
            <span className="text-[11px] text-gray-600 tabular-nums whitespace-nowrap">
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
