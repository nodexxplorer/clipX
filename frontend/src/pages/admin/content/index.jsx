// frontend/src/pages/admin/content/index.jsx
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {
    FiFilm, FiTrendingUp, FiStar, FiClock,
    FiSearch, FiEye, FiEdit2, FiTrash2
} from 'react-icons/fi';
import { GET_ADMIN_CONTENT_LIST } from '@/graphql/queries/adminQueries';

export default function ContentPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const { data, loading } = useQuery(GET_ADMIN_CONTENT_LIST, {
        variables: { limit: 100, search: debouncedSearch || undefined },
        fetchPolicy: 'cache-and-network',
    });

    const content = data?.adminContentList || [];

    // Simple debounce for search
    let searchTimer = null;
    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => setDebouncedSearch(val), 400);
    };

    const typeIcons = { movie: '🎬', series: '📺', anime: '🎌' };

    const filtered = content.filter(c => {
        const matchTab = activeTab === 'all' ||
            (activeTab === 'movies' && c.type === 'movie') ||
            (activeTab === 'series' && c.type === 'series');
        return matchTab;
    });

    const tabs = [
        { id: 'all', label: 'All Content', count: content.length },
        { id: 'movies', label: 'Movies', count: content.filter(c => c.type === 'movie').length },
        { id: 'series', label: 'Series', count: content.filter(c => c.type === 'series').length },
    ];

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white">Content Management</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Browse movies & series from library</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-white">{content.length}</p>
                            <p className="text-xs text-gray-500 font-bold">Total Indexed</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-primary-400">{content.filter(c => c.type === 'movie').length}</p>
                            <p className="text-xs text-gray-500 font-bold">Movies</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-purple-400">{content.filter(c => c.type === 'series').length}</p>
                            <p className="text-xs text-gray-500 font-bold">Series</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-white/[0.02] border border-white/5 rounded-xl p-1.5 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab.label}
                                <span className="text-xs opacity-60">{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                            <input
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search content..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30"
                            />
                        </div>
                    </div>

                    {/* Content Table */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-gray-500 text-sm mt-3">Loading content...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left px-5 py-3 text-xs text-gray-500 font-bold uppercase">Title</th>
                                            <th className="text-left px-3 py-3 text-xs text-gray-500 font-bold uppercase">Type</th>
                                            <th className="text-right px-3 py-3 text-xs text-gray-500 font-bold uppercase">Year</th>
                                            <th className="text-right px-3 py-3 text-xs text-gray-500 font-bold uppercase">Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filtered.map((item) => (
                                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {item.poster ? (
                                                            <img src={item.poster} alt="" className="w-10 h-14 object-cover rounded-lg ring-1 ring-white/5" />
                                                        ) : (
                                                            <div className="w-10 h-14 rounded-lg bg-white/5 flex items-center justify-center text-lg">
                                                                {typeIcons[item.type] || '🎬'}
                                                            </div>
                                                        )}
                                                        <span className="text-white text-sm font-bold">{item.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="text-xs text-gray-400 capitalize font-medium">{item.type}</span>
                                                </td>
                                                <td className="px-3 py-3 text-right text-sm text-gray-300">{item.year || '—'}</td>
                                                <td className="px-3 py-3 text-right text-sm text-yellow-400 font-bold">{item.rating || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!loading && filtered.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <FiFilm className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No content found</p>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
