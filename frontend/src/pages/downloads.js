/**
 * Downloads Page — manage downloaded content for offline viewing
 */

import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiDownload, FiTrash2, FiPlay, FiHardDrive, FiArrowLeft,
    FiCheck, FiAlertTriangle, FiClock, FiX
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Mock downloads — in production these come from IndexedDB / Service Worker cache
const MOCK_DOWNLOADS = [
    { id: '1', title: 'Inception', poster: 'https://image.tmdb.org/t/p/w200/9gk7adHYeDvHkCSEhniJBRo0HVB.jpg', quality: '1080p', size: '2.4 GB', progress: 100, status: 'completed', downloadedAt: '2026-03-30T10:00:00Z' },
    { id: '2', title: 'The Dark Knight', poster: 'https://image.tmdb.org/t/p/w200/qJ2tW6WMUDux911r6m7haIt5EZi.jpg', quality: '720p', size: '1.8 GB', progress: 100, status: 'completed', downloadedAt: '2026-03-29T15:00:00Z' },
    { id: '3', title: 'Dune: Part Two', poster: 'https://image.tmdb.org/t/p/w200/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', quality: '4K', size: '5.1 GB', progress: 67, status: 'downloading', downloadedAt: null },
    { id: '4', title: 'Parasite', poster: 'https://image.tmdb.org/t/p/w200/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', quality: '1080p', size: '2.1 GB', progress: 100, status: 'completed', downloadedAt: '2026-03-28T09:00:00Z' },
];

export default function DownloadsPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [downloads, setDownloads] = useState(MOCK_DOWNLOADS);
    const [message, setMessage] = useState({ type: '', text: '' });

    const subscriptionTier = user?.subscriptionTier || 'free';
    const downloadLimit = subscriptionTier === 'pro' ? 50 : subscriptionTier === 'standard' ? 15 : 0;
    const completedCount = downloads.filter(d => d.status === 'completed').length;
    const totalSize = downloads.reduce((acc, d) => {
        const num = parseFloat(d.size);
        return acc + (isNaN(num) ? 0 : num);
    }, 0);

    const handleDelete = (id) => {
        setDownloads(prev => prev.filter(d => d.id !== id));
        setMessage({ type: 'success', text: 'Download removed' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleDeleteAll = () => {
        setDownloads([]);
        setMessage({ type: 'success', text: 'All downloads cleared' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-950"><LoadingSpinner size="lg" /></div>;
    }
    if (!isAuthenticated) {
        router.push('/auth/login');
        return null;
    }

    return (
        <>
            <Head>
                <title>Downloads - clipX</title>
                <meta name="description" content="Manage your downloaded movies and shows on clipX" />
            </Head>

            <div className="min-h-screen py-24 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-8"
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <FiArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white">Downloads</h1>
                                <p className="text-gray-400 text-sm mt-1">Watch your favorites offline</p>
                            </div>
                        </div>

                        {downloads.length > 0 && (
                            <button
                                onClick={handleDeleteAll}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition-all font-bold"
                            >
                                <FiTrash2 className="w-4 h-4" />
                                Clear All
                            </button>
                        )}
                    </motion.div>

                    {/* Status Message */}
                    <AnimatePresence>
                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 rounded-xl flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400"
                            >
                                <FiCheck className="w-5 h-5" />
                                <span className="text-sm font-medium">{message.text}</span>
                                <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto"><FiX className="w-4 h-4" /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Storage Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8 bg-white/[0.02] border border-white/10 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                                    <FiHardDrive className="w-5 h-5 text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Storage Used</p>
                                    <p className="text-gray-500 text-xs">{totalSize.toFixed(1)} GB total</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-bold text-sm">{completedCount}/{downloadLimit || '∞'}</p>
                                <p className="text-gray-500 text-xs">downloads this month</p>
                            </div>
                        </div>
                        {downloadLimit > 0 && (
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-blue-500 rounded-full transition-all"
                                    style={{ width: `${Math.min((completedCount / downloadLimit) * 100, 100)}%` }}
                                />
                            </div>
                        )}
                    </motion.div>

                    {/* Free tier upsell — subscription disabled */}

                    {/* Download List */}
                    {downloads.length > 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            {downloads.map((dl, idx) => (
                                <motion.div
                                    key={dl.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/15 transition-all group"
                                >
                                    {/* Poster */}
                                    <div className="relative w-16 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={dl.poster} alt={dl.title} className="w-full h-full object-cover" />
                                        {dl.status === 'completed' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FiPlay className="w-6 h-6 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm truncate">{dl.title}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs font-bold rounded">{dl.quality}</span>
                                            <span className="text-gray-500 text-xs">{dl.size}</span>
                                        </div>
                                        {dl.status === 'downloading' && (
                                            <div className="mt-2">
                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary-500 rounded-full transition-all"
                                                        style={{ width: `${dl.progress}%` }}
                                                    />
                                                </div>
                                                <p className="text-primary-400 text-xs mt-1 font-bold">{dl.progress}% — Downloading...</p>
                                            </div>
                                        )}
                                        {dl.status === 'completed' && dl.downloadedAt && (
                                            <p className="text-gray-600 text-xs mt-1">
                                                <FiClock className="inline w-3 h-3 mr-1" />
                                                Downloaded {new Date(dl.downloadedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {dl.status === 'completed' && (
                                            <Link href={`/movie/${dl.id}`} className="p-2 text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors">
                                                <FiPlay className="w-5 h-5" />
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => handleDelete(dl.id)}
                                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="text-center py-20">
                            <FiDownload className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">No downloads yet</p>
                            <p className="text-gray-600 text-sm mt-2">Downloaded movies and shows will appear here</p>
                            <Link href="/" className="inline-block mt-6 px-6 py-3 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-500 transition-colors">
                                Browse Movies
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
