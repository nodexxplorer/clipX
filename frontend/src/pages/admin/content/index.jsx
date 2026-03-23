// frontend/src/pages/admin/content/index.jsx
import { useState } from 'react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {
    FiFilm, FiTrendingUp, FiStar, FiClock, FiTag,
    FiSearch, FiFilter, FiEye, FiBookmark, FiArchive,
    FiCheck, FiX, FiEdit2, FiTrash2, FiPlus, FiUpload
} from 'react-icons/fi';

export default function ContentPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedTier, setSelectedTier] = useState('all');

    // Mock content
    const [content] = useState([
        { id: 1, title: 'Inception', type: 'movie', tier: 'free', status: 'published', trending: true, featured: false, views: 45200, bookmarks: 1200, rating: 8.8, poster: '' },
        { id: 2, title: 'Breaking Bad', type: 'series', tier: 'standard', status: 'published', trending: true, featured: true, views: 89100, bookmarks: 3400, rating: 9.5, poster: '' },
        { id: 3, title: 'Attack on Titan', type: 'anime', tier: 'free', status: 'published', trending: false, featured: false, views: 32100, bookmarks: 2100, rating: 9.0, poster: '' },
        { id: 4, title: 'The Crown', type: 'series', tier: 'pro', status: 'published', trending: false, featured: true, views: 18900, bookmarks: 890, rating: 8.1, poster: '' },
        { id: 5, title: 'Oppenheimer', type: 'movie', tier: 'standard', status: 'published', trending: true, featured: false, views: 67800, bookmarks: 2800, rating: 8.5, poster: '' },
        { id: 6, title: 'Demon Slayer S4', type: 'anime', tier: 'pro', status: 'scheduled', trending: false, featured: false, views: 0, bookmarks: 1500, rating: 0, poster: '' },
        { id: 7, title: 'Old Movie', type: 'movie', tier: 'free', status: 'archived', trending: false, featured: false, views: 1200, bookmarks: 45, rating: 5.2, poster: '' },
    ]);

    const tierColors = {
        free: 'bg-gray-500/20 text-gray-400',
        standard: 'bg-primary-500/20 text-primary-400',
        pro: 'bg-purple-500/20 text-purple-400',
    };
    const statusColors = {
        published: 'bg-green-500/20 text-green-400',
        scheduled: 'bg-yellow-500/20 text-yellow-400',
        archived: 'bg-gray-500/20 text-gray-500',
    };
    const typeIcons = { movie: '🎬', series: '📺', anime: '🎌' };

    const filtered = content.filter(c => {
        const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
        const matchTier = selectedTier === 'all' || c.tier === selectedTier;
        const matchTab = activeTab === 'all' ||
            (activeTab === 'trending' && c.trending) ||
            (activeTab === 'featured' && c.featured) ||
            (activeTab === 'scheduled' && c.status === 'scheduled') ||
            (activeTab === 'archived' && c.status === 'archived');
        return matchSearch && matchTier && matchTab;
    });

    const tabs = [
        { id: 'all', label: 'All Content', count: content.length },
        { id: 'trending', label: 'Trending', count: content.filter(c => c.trending).length },
        { id: 'featured', label: 'Featured', count: content.filter(c => c.featured).length },
        { id: 'scheduled', label: 'Scheduled', count: content.filter(c => c.status === 'scheduled').length },
        { id: 'archived', label: 'Archived', count: content.filter(c => c.status === 'archived').length },
    ];

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white">Content Management</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Manage movies, series & anime — assign tiers, feature, and schedule</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-colors">
                                <FiUpload size={14} /> Bulk Import
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors">
                                <FiPlus size={14} /> Add Content
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-white">{content.length}</p>
                            <p className="text-xs text-gray-500 font-bold">Total</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-green-400">{content.filter(c => c.status === 'published').length}</p>
                            <p className="text-xs text-gray-500 font-bold">Published</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-primary-400">{content.filter(c => c.trending).length}</p>
                            <p className="text-xs text-gray-500 font-bold">Trending</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-purple-400">{content.filter(c => c.tier === 'pro').length}</p>
                            <p className="text-xs text-gray-500 font-bold">Pro Only</p>
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

                    {/* Filters */}
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search content..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30"
                            />
                        </div>
                        <select
                            value={selectedTier}
                            onChange={(e) => setSelectedTier(e.target.value)}
                            className="bg-white/[0.03] text-sm text-gray-300 px-4 py-2.5 rounded-xl border border-white/5 outline-none"
                        >
                            <option value="all">All Tiers</option>
                            <option value="free">Free</option>
                            <option value="standard">Standard</option>
                            <option value="pro">Pro</option>
                        </select>
                    </div>

                    {/* Content Table */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left px-5 py-3 text-xs text-gray-500 font-bold uppercase">Title</th>
                                        <th className="text-left px-3 py-3 text-xs text-gray-500 font-bold uppercase">Type</th>
                                        <th className="text-left px-3 py-3 text-xs text-gray-500 font-bold uppercase">Tier</th>
                                        <th className="text-left px-3 py-3 text-xs text-gray-500 font-bold uppercase">Status</th>
                                        <th className="text-right px-3 py-3 text-xs text-gray-500 font-bold uppercase">Views</th>
                                        <th className="text-right px-3 py-3 text-xs text-gray-500 font-bold uppercase">Rating</th>
                                        <th className="text-left px-3 py-3 text-xs text-gray-500 font-bold uppercase">Tags</th>
                                        <th className="text-right px-5 py-3 text-xs text-gray-500 font-bold uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filtered.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-14 rounded-lg bg-white/5 flex items-center justify-center text-lg">
                                                        {typeIcons[item.type]}
                                                    </div>
                                                    <span className="text-white text-sm font-bold">{item.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="text-xs text-gray-400 capitalize font-medium">{item.type}</span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded-md capitalize ${tierColors[item.tier]}`}>
                                                    {item.tier}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded-md capitalize ${statusColors[item.status]}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right text-sm text-gray-300">{item.views.toLocaleString()}</td>
                                            <td className="px-3 py-3 text-right text-sm text-yellow-400 font-bold">{item.rating || '—'}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex gap-1">
                                                    {item.trending && <span className="px-1.5 py-0.5 text-[10px] bg-orange-500/20 text-orange-400 rounded font-bold">🔥</span>}
                                                    {item.featured && <span className="px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded font-bold">⭐</span>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button className="p-1.5 text-gray-500 hover:text-primary-400 transition-colors" title="Edit">
                                                        <FiEdit2 size={14} />
                                                    </button>
                                                    <button className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors" title="Toggle Trending">
                                                        <FiTrendingUp size={14} />
                                                    </button>
                                                    <button className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors" title="Toggle Featured">
                                                        <FiStar size={14} />
                                                    </button>
                                                    <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors" title="Archive">
                                                        <FiArchive size={14} />
                                                    </button>
                                                    <button className="p-1.5 text-gray-500 hover:text-red-400 transition-colors" title="Delete">
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filtered.length === 0 && (
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
