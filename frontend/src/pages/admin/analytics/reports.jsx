// frontend/src/pages/admin/analytics/reports.jsx
import Image from 'next/image';
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiBarChart2, FiTrendingUp, FiUsers, FiFilm, FiRefreshCw, FiDownload } from 'react-icons/fi';
import { GET_DASHBOARD_STATS } from '@/graphql/queries/adminQueries';

export default function AnalyticsReportsPage() {
    const { data, loading, refetch } = useQuery(GET_DASHBOARD_STATS, { fetchPolicy: 'cache-and-network' });
    const stats = data?.dashboardStats;

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white">Analytics Reports</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Platform growth, engagement, and genre insights</p>
                        </div>
                        <button onClick={() => refetch()} className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white/[0.02] rounded-2xl p-6 animate-pulse h-28 border border-white/5" />
                            ))}
                        </div>
                    ) : stats && (
                        <>
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-primary-500/20 to-primary-500/5 border border-primary-500/20 rounded-2xl p-5">
                                    <FiUsers className="w-5 h-5 text-primary-400 mb-2" />
                                    <p className="text-2xl font-black text-white">{stats.totalUsers || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">Total Users</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-2xl p-5">
                                    <FiTrendingUp className="w-5 h-5 text-green-400 mb-2" />
                                    <p className="text-2xl font-black text-white">{stats.activeUsers || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">Active Users</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 rounded-2xl p-5">
                                    <FiFilm className="w-5 h-5 text-purple-400 mb-2" />
                                    <p className="text-2xl font-black text-white">{stats.totalMovies || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">Total Content</p>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
                                    <FiDownload className="w-5 h-5 text-yellow-400 mb-2" />
                                    <p className="text-2xl font-black text-white">{stats.totalDownloads || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">Total Downloads</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* User Growth Chart */}
                                {stats.userGrowth && stats.userGrowth.length > 0 && (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                            <FiBarChart2 className="w-4 h-4 text-primary-400" /> User Growth
                                        </h3>
                                        <div className="flex items-end gap-2 h-40">
                                            {stats.userGrowth.slice(-14).map((item, i) => {
                                                const max = Math.max(...stats.userGrowth.map(g => g.count), 1);
                                                return (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                        <span className="text-[9px] text-gray-600 font-bold">{item.count}</span>
                                                        <div
                                                            className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-md transition-all duration-700 min-h-[4px]"
                                                            style={{ height: `${(item.count / max) * 100}%` }}
                                                        />
                                                        <span className="text-[8px] text-gray-600 rotate-[-45deg] origin-top-left whitespace-nowrap">{item.date?.slice(5) || ''}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Genre Distribution */}
                                {stats.genreDistribution && stats.genreDistribution.length > 0 && (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                            <FiBarChart2 className="w-4 h-4 text-purple-400" /> Genre Distribution
                                        </h3>
                                        <div className="space-y-3">
                                            {stats.genreDistribution.slice(0, 8).map((g, i) => {
                                                const max = Math.max(...stats.genreDistribution.map(x => x.movieCount), 1);
                                                const pct = (g.movieCount / max) * 100;
                                                return (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-400 w-20 truncate font-medium">{g.genre?.name || 'Unknown'}</span>
                                                        <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-purple-500 to-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-xs text-white font-bold w-8 text-right">{g.movieCount}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Top Movies */}
                            {stats.topMovies && stats.topMovies.length > 0 && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-white font-bold mb-4">Top Performing Content</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-bold uppercase">Title</th>
                                                    <th className="text-right px-3 py-2 text-xs text-gray-500 font-bold uppercase">Views</th>
                                                    <th className="text-right px-3 py-2 text-xs text-gray-500 font-bold uppercase">Downloads</th>
                                                    <th className="text-right px-3 py-2 text-xs text-gray-500 font-bold uppercase">Watchlist</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {stats.topMovies.map((t, i) => (
                                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-3 py-2">
                                                            <div className="flex items-center gap-3">
                                                                {t.movie?.posterUrl ? (
                                                                    <div className="relative w-8 h-12"><Image src={t.movie.posterUrl || '/images/placeholder.jpg'} alt="" fill className="object-cover rounded-md ring-1 ring-white/5" /></div>
                                                                ) : (
                                                                    <div className="w-8 h-12 rounded-md bg-white/5 flex items-center justify-center">
                                                                        <FiFilm className="w-4 h-4 text-gray-600" />
                                                                    </div>
                                                                )}
                                                                <span className="text-white text-sm font-bold">{t.movie?.title || 'Untitled'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-sm text-gray-300">{(t.views || 0).toLocaleString()}</td>
                                                        <td className="px-3 py-2 text-right text-sm text-gray-300">{(t.downloads || 0).toLocaleString()}</td>
                                                        <td className="px-3 py-2 text-right text-sm text-gray-300">{(t.watchlistAdds || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Recent Activity */}
                            {stats.recentActivity && stats.recentActivity.length > 0 && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="p-5 border-b border-white/5">
                                        <h3 className="text-white font-bold">Recent Activity</h3>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        {stats.recentActivity.slice(0, 10).map((a) => (
                                            <div key={a.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                                <p className="text-white text-sm">{a.description}</p>
                                                <p className="text-xs text-gray-600 mt-0.5">{a.timestamp}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
