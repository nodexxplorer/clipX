// frontend/src/pages/admin/genres/index.jsx
import { useQuery } from '@apollo/client/react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { GET_GENRES } from '@/graphql/queries/adminQueries';
import { FiRefreshCw, FiGrid, FiFilm } from 'react-icons/fi';

export default function AdminGenres() {
    const { data, loading, refetch } = useQuery(GET_GENRES);
    const genres = data?.genres || [];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Genres</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{genres.length} genres in library</p>
                    </div>
                    <button onClick={() => refetch()} className="p-2.5 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                        <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white/[0.02] rounded-2xl h-28 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {genres.map((g) => (
                            <div key={g.id} className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-5 group hover:border-primary-500/20 hover:scale-[1.02] transition-all duration-200">
                                <div className="flex items-center justify-between mb-3">
                                    <FiGrid className="text-primary-400" size={18} />
                                    <span className="text-xs font-bold bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">{g.slug}</span>
                                </div>
                                <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">{g.name}</h3>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <FiFilm size={12} className="text-gray-600" />
                                    <span className="text-xs text-gray-500">{g.movieCount} movies</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
