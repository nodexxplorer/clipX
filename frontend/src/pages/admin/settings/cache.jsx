// frontend/src/pages/admin/settings/cache.jsx
import { useState } from 'react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiDatabase, FiTrash2, FiCheck, FiRefreshCw, FiHardDrive } from 'react-icons/fi';

export default function CacheSettingsPage() {
    const [clearing, setClearing] = useState('');
    const [cleared, setCleared] = useState('');

    const caches = [
        { id: 'graphql', label: 'GraphQL Response Cache', description: 'Cached query responses for faster load times', size: '~12 MB' },
        { id: 'images', label: 'Image / CDN Cache', description: 'Poster and backdrop image cache', size: '~85 MB' },
        { id: 'sessions', label: 'Session Cache', description: 'Active user session data stored in memory', size: '~2 MB' },
        { id: 'search', label: 'Search Index Cache', description: 'Pre-computed search indices for fast lookup', size: '~5 MB' },
    ];

    const handleClear = (id) => {
        setClearing(id);
        setTimeout(() => {
            setClearing('');
            setCleared(id);
            setTimeout(() => setCleared(''), 2000);
        }, 1000);
    };

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="max-w-2xl space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">Cache Management</h1>
                        <p className="text-sm text-gray-500 mt-0.5">View and clear application caches</p>
                    </div>

                    <div className="space-y-4">
                        {caches.map((cache) => (
                            <div key={cache.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                                        <FiHardDrive className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">{cache.label}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">{cache.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500 font-mono">{cache.size}</span>
                                    <button
                                        onClick={() => handleClear(cache.id)}
                                        disabled={clearing === cache.id}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                    >
                                        {clearing === cache.id ? (
                                            <FiRefreshCw size={12} className="animate-spin" />
                                        ) : cleared === cache.id ? (
                                            <FiCheck size={12} className="text-green-400" />
                                        ) : (
                                            <FiTrash2 size={12} />
                                        )}
                                        {cleared === cache.id ? 'Cleared!' : 'Clear'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => caches.forEach(c => handleClear(c.id))}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 font-bold text-sm rounded-xl hover:bg-red-500/30 transition-colors"
                    >
                        <FiTrash2 size={16} /> Clear All Caches
                    </button>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
