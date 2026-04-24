// frontend/src/pages/admin/cast/index.jsx
import Image from 'next/image';
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiUser, FiSearch, FiRefreshCw, FiFilm } from 'react-icons/fi';
import { gql } from '@apollo/client';

const GET_ALL_CAST = gql`
  query AllCast($limit: Int, $search: String) {
    allCast(limit: $limit, search: $search) {
      id name character profileImage
    }
  }
`;

export default function CastPage() {
    const [search, setSearch] = useState('');
    const { data, loading, refetch } = useQuery(GET_ALL_CAST, {
        variables: { limit: 100, search: search || undefined },
        fetchPolicy: 'cache-and-network',
        // This query may not exist yet; gracefully handle
        onError: () => {},
    });

    const cast = data?.allCast || [];

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white">Cast & Crew</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Browse cast members across the content library</p>
                        </div>
                        <button onClick={() => refetch()} className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cast..." className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30" />
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="bg-white/[0.02] rounded-xl p-4 animate-pulse h-40 border border-white/5" />
                            ))}
                        </div>
                    ) : cast.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {cast.map((person) => (
                                <div key={person.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center hover:border-primary-500/20 transition-all">
                                    {person.profileImage ? (
                                        <Image src={person.profileImage || '/images/placeholder.jpg'} alt={person.name} width={64} height={64} className="rounded-full mx-auto object-cover ring-2 ring-white/10" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-br from-primary-500/30 to-purple-500/30 flex items-center justify-center">
                                            <FiUser className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <p className="text-white text-sm font-bold mt-3 truncate">{person.name}</p>
                                    {person.character && <p className="text-gray-500 text-xs truncate mt-0.5">{person.character}</p>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <FiUser className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No cast data available yet. Cast will appear once movies are imported.</p>
                        </div>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
