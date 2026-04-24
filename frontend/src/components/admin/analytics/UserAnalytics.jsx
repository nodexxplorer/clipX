// frontend/src/components/admin/analytics/UserAnalytics.jsx
import { FiUsers, FiTrendingUp, FiUserPlus, FiUserCheck } from 'react-icons/fi';

export default function UserAnalytics({ userGrowth = [], stats = {}, loading }) {
  if (loading) {
    return <div className="bg-white/[0.02] rounded-2xl h-72 animate-pulse border border-white/5" />;
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers || 0, icon: FiUsers, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'New Today', value: stats.newUsersToday || 0, icon: FiUserPlus, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'New This Week', value: stats.newUsersThisWeek || 0, icon: FiTrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Active Users', value: stats.activeUsers || 0, icon: FiUserCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((s, i) => (
          <div key={i} className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-4">
            <div className={`${s.bg} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
              <s.icon className={s.color} size={15} />
            </div>
            <p className="text-2xl font-black text-white tabular-nums">{s.value.toLocaleString()}</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider font-bold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Growth Chart */}
      <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">User Growth</h3>
        </div>
        <div className="p-5">
          {userGrowth.length > 0 ? (
            <div className="flex items-end gap-1 h-40">
              {userGrowth.map((item, i) => {
                const max = Math.max(...userGrowth.map(d => d?.count || 0), 1);
                const h = ((item?.count || 0) / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 tabular-nums">{item?.count}</span>
                    <div className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm min-h-[2px] transition-all group-hover:from-primary-500" style={{ height: `${Math.max(h, 2)}%` }} />
                    <span className="text-[8px] text-gray-700 truncate w-full text-center">{item?.date?.slice(-5)}</span>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-gray-600 text-center py-8">No growth data available</p>}
        </div>
      </div>
    </div>
  );
}
