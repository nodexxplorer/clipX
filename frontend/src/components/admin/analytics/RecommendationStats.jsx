// frontend/src/components/admin/analytics/RecommendationStats.jsx
import { FiCpu, FiTarget, FiActivity, FiThumbsUp } from 'react-icons/fi';

export default function RecommendationStats({ stats = {}, loading }) {
  const metrics = [
    { label: 'Recommendations Made', value: stats.totalRecommendations || 0, icon: FiCpu, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Click-through Rate', value: stats.ctr ? `${(stats.ctr * 100).toFixed(1)}%` : '—', icon: FiTarget, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Engagement Score', value: stats.engagementScore?.toFixed(1) || '—', icon: FiActivity, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Positive Feedback', value: stats.positiveFeedback || 0, icon: FiThumbsUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] rounded-2xl h-28 animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Algorithm performance */}
      <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Algorithm Performance</h3>
        <div className="space-y-4">
          {[
            { label: 'Collaborative Filtering', accuracy: stats.cfAccuracy || 72, color: 'from-blue-600 to-blue-400' },
            { label: 'Content-Based', accuracy: stats.cbAccuracy || 68, color: 'from-purple-600 to-purple-400' },
            { label: 'Trending-Based', accuracy: stats.trendAccuracy || 85, color: 'from-green-600 to-green-400' },
          ].map((algo, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-300">{algo.label}</span>
                <span className="text-xs font-bold text-white tabular-nums">{algo.accuracy}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${algo.color} rounded-full transition-all`} style={{ width: `${algo.accuracy}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
