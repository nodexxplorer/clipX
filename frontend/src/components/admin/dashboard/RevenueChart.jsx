/**
 * RevenueChart — Bar chart for admin dashboard revenue/user growth.
 * Pure CSS bars, no external chart library needed.
 */
import { useMemo } from 'react';
import { FiBarChart2, FiTrendingUp } from 'react-icons/fi';

export default function RevenueChart({ data = [], title = 'User Growth', type = 'growth' }) {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value || 0), 1), [data]);
    const total = useMemo(() => data.reduce((sum, d) => sum + (d.value || 0), 0), [data]);

    if (!data || data.length === 0) {
        return (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <FiBarChart2 className="w-4 h-4 text-primary-400" />
                    {title}
                </h3>
                <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
                    No data available yet
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <FiBarChart2 className="w-4 h-4 text-primary-400" />
                    {title}
                </h3>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-lg">
                    <FiTrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-bold text-green-400">{total.toLocaleString()} total</span>
                </div>
            </div>

            {/* Chart */}
            <div className="flex items-end gap-2 h-48">
                {data.map((item, i) => {
                    const pct = (item.value / maxValue) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                            {/* Value label */}
                            <span className="text-[10px] text-gray-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.value}
                            </span>
                            {/* Bar */}
                            <div
                                className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-lg transition-all duration-700 min-h-[4px] hover:from-primary-500 hover:to-primary-300 cursor-default"
                                style={{
                                    height: `${Math.max(pct, 3)}%`,
                                    animationDelay: `${i * 80}ms`,
                                }}
                                title={`${item.month || item.label}: ${item.value}`}
                            />
                            {/* Label */}
                            <span className="text-[10px] text-gray-500 font-medium truncate w-full text-center">
                                {item.month || item.label || ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
