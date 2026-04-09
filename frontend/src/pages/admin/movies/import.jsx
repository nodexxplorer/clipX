// frontend/src/pages/admin/movies/import.jsx
import { useState } from 'react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiUpload, FiFilm, FiSearch, FiCheck, FiRefreshCw, FiDownload } from 'react-icons/fi';

export default function MovieImportPage() {
    const [tmdbId, setTmdbId] = useState('');
    const [importing, setImporting] = useState(false);
    const [imported, setImported] = useState([]);

    const handleImport = async () => {
        if (!tmdbId.trim()) return;
        setImporting(true);
        // Simulate import for now
        setTimeout(() => {
            setImported(prev => [...prev, { id: tmdbId, title: `Movie #${tmdbId}`, status: 'success' }]);
            setTmdbId('');
            setImporting(false);
        }, 1500);
    };

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="max-w-2xl space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">Import Content</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Import movies and series from TMDB or MovieBox</p>
                    </div>

                    {/* Quick Import */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><FiSearch size={16} /> Import by ID</h3>
                        <div className="flex gap-3">
                            <input
                                value={tmdbId}
                                onChange={(e) => setTmdbId(e.target.value)}
                                placeholder="Enter TMDB or MovieBox ID..."
                                className="flex-1 px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30"
                            />
                            <button
                                onClick={handleImport}
                                disabled={importing || !tmdbId.trim()}
                                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors disabled:opacity-50"
                            >
                                {importing ? <FiRefreshCw size={16} className="animate-spin" /> : <FiDownload size={16} />}
                                Import
                            </button>
                        </div>
                    </div>

                    {/* Bulk Import */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><FiUpload size={16} /> Bulk Import</h3>
                        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary-500/30 transition-colors cursor-pointer">
                            <FiUpload className="w-8 h-8 mx-auto text-gray-500 mb-3" />
                            <p className="text-gray-400 text-sm font-medium">Drag & drop a CSV file or click to browse</p>
                            <p className="text-gray-600 text-xs mt-1">Expected format: one TMDB ID per line</p>
                        </div>
                    </div>

                    {/* Recent Imports */}
                    {imported.length > 0 && (
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-white/5">
                                <h3 className="text-white font-bold">Recent Imports</h3>
                            </div>
                            <div className="divide-y divide-white/5">
                                {imported.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <FiFilm className="w-4 h-4 text-primary-400" />
                                            <span className="text-white text-sm">{item.title}</span>
                                        </div>
                                        <span className="flex items-center gap-1 text-xs text-green-400 font-bold">
                                            <FiCheck size={12} /> Imported
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
