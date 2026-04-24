// frontend/src/pages/admin/analytics/index.jsx
import Image from 'next/image';
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { GET_DASHBOARD_STATS } from '@/graphql/queries/adminQueries';
import { FiRefreshCw, FiUsers, FiFilm, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';

export default function AdminAnalytics() {
    const [days, setDays] = useState(30);
    const { data, loading, refetch } = useQuery(GET_DASHBOARD_STATS, {
        variables: {
            dateRange: {
                startDate: new Date(Date.now() - days * 86400000).toISOString(),
                endDate: new Date().toISOString(),
            },
        },
    });

    const stats = data?.dashboardStats;
    const genreDist = stats?.genreDistribution || [];
    const topMovies = stats?.topMovies || [];
    const userGrowth = stats?.userGrowth || [];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Analytics</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Platform insights and statistics</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => refetch()} className="p-2.5 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <select
                            value={days}
                            onChange={(e) => setDays(parseInt(e.target.value))}
                            className="bg-white/[0.03] text-sm text-gray-300 px-4 py-2 rounded-xl border border-white/5 outline-none cursor-pointer"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                        </select>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Users', value: stats?.totalUsers || 0, icon: FiUsers, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'Total Movies', value: stats?.totalMovies || 0, icon: FiFilm, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        { label: 'Active Users', value: stats?.activeUsers || 0, icon: FiTrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
                        { label: 'Total Genres', value: stats?.totalGenres || 0, icon: FiBarChart2, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    ].map((s, i) => (
                        <div key={i} className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-5">
                            <div className={`${s.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                                <s.icon className={s.color} size={18} />
                            </div>
                            <p className="text-3xl font-black text-white tabular-nums">{s.value.toLocaleString()}</p>
                            <p className="text-[11px] text-gray-600 uppercase tracking-wider font-bold mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Growth */}
                    <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-5 border-b border-white/5">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">User Growth</h2>
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
                            ) : <p className="text-sm text-gray-600 text-center py-8">No data</p>}
                        </div>
                    </div>

                    {/* Genre Distribution */}
                    <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-5 border-b border-white/5">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Genre Distribution</h2>
                        </div>
                        <div className="divide-y divide-white/[0.03] max-h-[300px] overflow-y-auto">
                            {genreDist.length > 0 ? genreDist.map((g, i) => {
                                const maxCount = Math.max(...genreDist.map(x => x.movieCount), 1);
                                return (
                                    <div key={i} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-medium text-white">{g.genre?.name}</span>
                                            <span className="text-xs text-gray-500 tabular-nums">{g.movieCount} movies</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all" style={{ width: `${(g.movieCount / maxCount) * 100}%` }} />
                                        </div>
                                    </div>
                                );
                            }) : <p className="text-sm text-gray-600 text-center py-8">No data</p>}
                        </div>
                    </div>
                </div>

                {/* Top Movies */}
                <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-5 border-b border-white/5">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top Performing Movies</h2>
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                        {topMovies.length > 0 ? topMovies.map((item, i) => (
                            <div key={i} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                                <span className="text-xs font-black text-gray-600 w-5">{i + 1}</span>
                                <div className="relative w-9 h-13"><Image src={item.movie?.posterUrl || '/images/placeholder.jpg'} alt="" fill className="object-cover rounded-lg ring-1 ring-white/5" /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{item.movie?.title}</p>
                                </div>
                                <div className="flex gap-6 text-right">
                                    <div><p className="text-xs font-bold text-gray-300 tabular-nums">{item.views?.toLocaleString()}</p><p className="text-[10px] text-gray-600">views</p></div>
                                    <div><p className="text-xs font-bold text-gray-300 tabular-nums">{item.downloads?.toLocaleString()}</p><p className="text-[10px] text-gray-600">downloads</p></div>
                                    <div><p className="text-xs font-bold text-gray-300 tabular-nums">{item.watchlistAdds?.toLocaleString()}</p><p className="text-[10px] text-gray-600">saves</p></div>
                                </div>
                            </div>
                        )) : <p className="text-sm text-gray-600 text-center py-8">No data</p>}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
