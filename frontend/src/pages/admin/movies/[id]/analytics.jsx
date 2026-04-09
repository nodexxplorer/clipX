// frontend/src/pages/admin/movies/[id]/analytics.jsx
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiArrowLeft, FiFilm, FiEye, FiDownload, FiHeart, FiStar } from 'react-icons/fi';
import { GET_ADMIN_MOVIE } from '@/graphql/queries/adminQueries';
import Link from 'next/link';

export default function MovieAnalyticsPage() {
    const router = useRouter();
    const { id } = router.query;
    const { data, loading } = useQuery(GET_ADMIN_MOVIE, { variables: { id }, skip: !id, fetchPolicy: 'cache-and-network' });

    const movie = data?.movie;

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/content" className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                            <FiArrowLeft size={16} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-white">Movie Analytics</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{movie?.title || 'Loading...'}</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white/[0.02] rounded-xl p-5 animate-pulse h-24 border border-white/5" />
                            ))}
                        </div>
                    ) : !movie ? (
                        <div className="text-center py-12 text-gray-500">
                            <FiFilm className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Movie not found</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-5 bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                                {movie.posterUrl && <img src={movie.posterUrl} alt="" className="w-20 h-28 object-cover rounded-xl ring-1 ring-white/10" />}
                                <div>
                                    <p className="text-white font-black text-xl">{movie.title}</p>
                                    <p className="text-gray-500 text-sm mt-1">{movie.year} • {movie.runtime}min • {movie.genres?.map(g => g.name).join(', ')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-primary-500/20 to-primary-500/5 border border-primary-500/20 rounded-2xl p-5 text-center">
                                    <FiEye className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                                    <p className="text-2xl font-black text-white">{movie.voteCount || 0}</p>
                                    <p className="text-xs text-gray-500 font-bold mt-1">Votes</p>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5 text-center">
                                    <FiStar className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                                    <p className="text-2xl font-black text-white">{movie.rating || 0}</p>
                                    <p className="text-xs text-gray-500 font-bold mt-1">Rating</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 rounded-2xl p-5 text-center">
                                    <FiDownload className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                    <p className="text-2xl font-black text-white">{movie.downloadCount || 0}</p>
                                    <p className="text-xs text-gray-500 font-bold mt-1">Downloads</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 rounded-2xl p-5 text-center">
                                    <FiHeart className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                                    <p className="text-2xl font-black text-white">{(movie.popularity || 0).toFixed(0)}</p>
                                    <p className="text-xs text-gray-500 font-bold mt-1">Popularity</p>
                                </div>
                            </div>

                            {/* Cast */}
                            {movie.cast && movie.cast.length > 0 && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-white font-bold mb-4">Cast ({movie.cast.length})</h3>
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {movie.cast.slice(0, 12).map((c) => (
                                            <div key={c.id} className="flex-shrink-0 text-center w-20">
                                                {c.profileImage ? (
                                                    <img src={c.profileImage} alt={c.name} className="w-14 h-14 rounded-full mx-auto object-cover ring-2 ring-white/10" />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-full mx-auto bg-gradient-to-br from-primary-500/30 to-purple-500/30 flex items-center justify-center text-white text-xs font-bold">
                                                        {c.name?.charAt(0)}
                                                    </div>
                                                )}
                                                <p className="text-white text-[10px] font-bold mt-1.5 truncate">{c.name}</p>
                                                <p className="text-gray-600 text-[9px] truncate">{c.character}</p>
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