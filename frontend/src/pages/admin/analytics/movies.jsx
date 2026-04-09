// frontend/src/pages/admin/analytics/movies.jsx
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiFilm, FiTrendingUp, FiStar, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { GET_ADMIN_CONTENT_LIST } from '@/graphql/queries/adminQueries';

export default function MovieAnalyticsPage() {
    const [search, setSearch] = useState('');

    const { data, loading, refetch } = useQuery(GET_ADMIN_CONTENT_LIST, {
        variables: { limit: 100, search: search || undefined },
        fetchPolicy: 'cache-and-network',
    });

    const content = data?.adminContentList || [];
    const movies = content.filter(c => c.type === 'movie');
    const series = content.filter(c => c.type === 'series');
    const avgRating = content.length > 0 ? (content.reduce((a, c) => a + (c.rating || 0), 0) / content.length).toFixed(1) : '0';

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white">Movie & Content Analytics</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Content library overview</p>
                        </div>
                        <button onClick={() => refetch()} className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-white">{content.length}</p>
                            <p className="text-xs text-gray-500 font-bold">Total Content</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-primary-400">{movies.length}</p>
                            <p className="text-xs text-gray-500 font-bold">Movies</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-purple-400">{series.length}</p>
                            <p className="text-xs text-gray-500 font-bold">Series</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-yellow-400">{avgRating}</p>
                            <p className="text-xs text-gray-500 font-bold">Avg Rating</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content..." className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30" />
                    </div>

                    {/* Content Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="bg-white/[0.02] rounded-xl aspect-[2/3] animate-pulse border border-white/5" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {content.map((item) => (
                                <div key={item.id} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden group hover:border-primary-500/30 transition-all">
                                    {item.poster ? (
                                        <img src={item.poster} alt={item.title} className="w-full aspect-[2/3] object-cover" />
                                    ) : (
                                        <div className="w-full aspect-[2/3] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                            <FiFilm className="w-8 h-8 text-gray-600" />
                                        </div>
                                    )}
                                    <div className="p-3">
                                        <p className="text-white text-sm font-bold truncate">{item.title}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] text-gray-500 capitalize">{item.type} • {item.year || '?'}</span>
                                            {item.rating > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold">
                                                    <FiStar size={10} /> {item.rating}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!loading && content.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <FiFilm className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No content found</p>
                        </div>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
