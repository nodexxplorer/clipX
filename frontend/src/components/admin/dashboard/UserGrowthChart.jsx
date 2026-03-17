// frontend/src/components/admin/dashboard/UserGrowthChart.jsx
import { FiTrendingUp } from 'react-icons/fi';

export default function UserGrowthChart({ data = [] }) {
  // Simple bar chart without recharts dependency
  const maxCount = Math.max(...data.map(d => d?.count || 0), 1);

  return (
    <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">User Growth</h3>
        <FiTrendingUp className="text-primary-400" size={16} />
      </div>
      <div className="p-5">
        {data.length > 0 ? (
          <div className="flex items-end gap-1.5 h-48">
            {data.map((item, i) => {
              const height = ((item?.count || 0) / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                    {item?.count || 0}
                  </span>
                  <div className="w-full relative">
                    <div
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-md transition-all duration-300 group-hover:from-primary-500 group-hover:to-primary-300 min-h-[2px]"
                      style={{ height: `${Math.max(height, 2)}%`, maxHeight: '160px' }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-600 truncate w-full text-center">{item?.date?.slice(-5) || ''}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-gray-600">No growth data available</p>
          </div>
        )}
      </div>
    </div>
  );
}