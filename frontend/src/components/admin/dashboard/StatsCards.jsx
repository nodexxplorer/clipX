// frontend/src/components/admin/dashboard/StatsCards.jsx
import { FiUsers, FiFilm, FiDownload, FiTrendingUp } from 'react-icons/fi';

export default function StatsCards({ stats }) {
  const cards = [
    { 
      title: 'Total Users', 
      value: stats?.totalUsers || 0, 
      change: `+${stats?.newUsersToday || 0} today`,
      icon: FiUsers, 
      color: 'bg-blue-600' 
    },
    { 
      title: 'Total Movies', 
      value: stats?.totalMovies || 0, 
      change: `${stats?.totalGenres || 0} genres`,
      icon: FiFilm, 
      color: 'bg-purple-600' 
    },
    { 
      title: 'Downloads', 
      value: stats?.totalDownloads || 0, 
      change: 'All time',
      icon: FiDownload, 
      color: 'bg-green-600' 
    },
    { 
      title: 'Active Users', 
      value: stats?.activeUsers || 0, 
      change: 'Last 7 days',
      icon: FiTrendingUp, 
      color: 'bg-orange-600' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{card.title}</p>
              <p className="text-3xl font-bold text-white mt-1">
                {card.value.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">{card.change}</p>
            </div>
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon size={24} className="text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}