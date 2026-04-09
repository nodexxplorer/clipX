// frontend/src/pages/admin/genres/[id].jsx
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiArrowLeft, FiFilm, FiHash } from 'react-icons/fi';
import { GET_GENRES } from '@/graphql/queries/adminQueries';
import Link from 'next/link';

export default function GenreDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { data, loading } = useQuery(GET_GENRES, { fetchPolicy: 'cache-and-network' });

    const genres = data?.genres || [];
    const genre = genres.find(g => g.id === id || g.slug === id);

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                            <FiArrowLeft size={16} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-white">Genre Detail</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{genre?.name || 'Loading...'}</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white/[0.02] rounded-2xl p-8 animate-pulse h-40 border border-white/5" />
                    ) : !genre ? (
                        <div className="text-center py-12 text-gray-500">
                            <FiHash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Genre not found</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/20 rounded-2xl p-8">
                                <h2 className="text-3xl font-black text-white">{genre.name}</h2>
                                <p className="text-gray-400 text-sm mt-2">Slug: <span className="text-white font-mono">{genre.slug}</span></p>
                                <div className="mt-4 flex items-center gap-2">
                                    <FiFilm className="text-primary-400" />
                                    <span className="text-white text-lg font-bold">{genre.movieCount || 0}</span>
                                    <span className="text-gray-500 text-sm">movies in this genre</span>
                                </div>
                            </div>

                            {/* All genres list */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-white font-bold mb-4">All Genres</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {genres.map((g) => (
                                        <Link key={g.id} href={`/admin/genres/${g.id}`} className={`p-3 rounded-xl text-center transition-all ${g.id === id ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-white/[0.02] border border-white/5 hover:border-white/10'}`}>
                                            <p className="text-white text-sm font-bold">{g.name}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{g.movieCount || 0} movies</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}