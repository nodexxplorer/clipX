// frontend/src/pages/admin/content/featured.jsx
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiStar, FiFilm, FiRefreshCw } from 'react-icons/fi';
import { GET_ADMIN_CONTENT_LIST } from '@/graphql/queries/adminQueries';

export default function FeaturedContentPage() {
    const { data, loading, refetch } = useQuery(GET_ADMIN_CONTENT_LIST, {
        variables: { limit: 100 },
        fetchPolicy: 'cache-and-network',
    });

    const content = data?.adminContentList || [];
    // Show top rated content as "featured"
    const featured = [...content].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 20);

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white">Featured Content</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Top rated movies & series in the library</p>
                        </div>
                        <button onClick={() => refetch()} className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="bg-white/[0.02] rounded-xl aspect-[2/3] animate-pulse border border-white/5" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {featured.map((item, idx) => (
                                <div key={item.id} className="bg-white/[0.02] border border-yellow-500/10 rounded-xl overflow-hidden group hover:border-yellow-500/30 transition-all relative">
                                    {idx < 3 && (
                                        <div className="absolute top-2 left-2 z-10 bg-yellow-500/90 text-black text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <FiStar size={10} /> #{idx + 1}
                                        </div>
                                    )}
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
                                            <span className="text-[10px] text-gray-500 capitalize">{item.type}</span>
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
                    {!loading && featured.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <FiStar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No featured content yet</p>
                        </div>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
