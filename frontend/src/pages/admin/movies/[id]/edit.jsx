// frontend/src/pages/admin/movies/[id]/edit.jsx
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiArrowLeft, FiSave, FiFilm } from 'react-icons/fi';
import { GET_ADMIN_MOVIE } from '@/graphql/queries/adminQueries';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function EditMoviePage() {
    const router = useRouter();
    const { id } = router.query;
    const { data, loading } = useQuery(GET_ADMIN_MOVIE, { variables: { id }, skip: !id, fetchPolicy: 'cache-and-network' });

    const movie = data?.movie;
    const [form, setForm] = useState({ title: '', overview: '', tagline: '' });

    useEffect(() => {
        if (movie) {
            setForm({ title: movie.title || '', overview: movie.overview || '', tagline: movie.tagline || '' });
        }
    }, [movie]);

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="max-w-2xl space-y-6">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/content" className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                            <FiArrowLeft size={16} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-white">Edit Movie</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Modify metadata for this content</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white/[0.02] rounded-2xl p-8 animate-pulse h-64 border border-white/5" />
                    ) : !movie ? (
                        <div className="text-center py-12 text-gray-500">
                            <FiFilm className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Movie not found</p>
                        </div>
                    ) : (
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-4 mb-4">
                                {movie.posterUrl && <img src={movie.posterUrl} alt="" className="w-16 h-24 object-cover rounded-xl ring-1 ring-white/10" />}
                                <div>
                                    <p className="text-white font-bold text-lg">{movie.title}</p>
                                    <p className="text-gray-500 text-xs">{movie.year} • {movie.runtime}min • Rating: {movie.rating}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Title</label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Tagline</label>
                                <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Overview</label>
                                <textarea value={form.overview} onChange={e => setForm(f => ({ ...f, overview: e.target.value }))} rows={5} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30 resize-none" />
                            </div>

                            <button className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors">
                                <FiSave size={16} /> Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}