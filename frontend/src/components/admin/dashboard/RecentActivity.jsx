// frontend/src/components/admin/dashboard/RecentActivity.jsx
import { FiUser, FiFilm, FiDownload, FiHeart } from 'react-icons/fi';

const iconMap = {
  user_signup: FiUser,
  movie_view: FiFilm,
  download: FiDownload,
  watchlist_add: FiHeart,
};

export default function RecentActivity({ activities = [] }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No recent activity</p>
        ) : (
          activities.map((activity) => {
            const Icon = iconMap[activity.type] || FiUser;
            return (
              <div key={activity.id} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <Icon className="text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.description}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}