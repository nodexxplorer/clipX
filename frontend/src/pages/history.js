/**
 * Watch History Page
 * Shows all movies/series the user has watched with progress
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiClock, FiPlay, FiTrash2, FiSearch, FiFilter,
    FiChevronLeft, FiFilm, FiTv, FiCalendar, FiX
} from 'react-icons/fi';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const GET_WATCH_HISTORY = gql`
  query GetWatchHistory($limit: Int, $offset: Int) {
    watchHistory(limit: $limit, offset: $offset) {
      id
      movieboxId
      title
      posterUrl
      contentType
      currentTime
      duration
      progress
      watchedAt
    }
  }
`;

const CLEAR_WATCH_HISTORY = gql`
  mutation ClearWatchHistory {
    clearWatchHistory {
      success
      message
    }
  }
`;

function formatDuration(seconds) {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatTime(seconds) {
    if (!seconds) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function WatchHistoryPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, movie, series
    const [showClearModal, setShowClearModal] = useState(false);

    const { data, loading, error, refetch } = useQuery(GET_WATCH_HISTORY, {
        variables: { limit: 100, offset: 0 },
        skip: !isAuthenticated,
        fetchPolicy: 'cache-and-network',
    });

    const [clearHistory, { loading: clearing }] = useMutation(CLEAR_WATCH_HISTORY);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login?redirect=/history');
        }
    }, [authLoading, isAuthenticated, router]);

    const handleClear = async () => {
        try {
            await clearHistory();
            await refetch();
            setShowClearModal(false);
        } catch (err) {
            console.error('Failed to clear history:', err);
        }
    };

    const allItems = data?.watchHistory || [];

    // Apply filters
    const filteredItems = allItems.filter((item) => {
        const matchesSearch = !search || item.title.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || item.contentType === filter;
        return matchesSearch && matchesFilter;
    });

    // Group by date
    const grouped = {};
    filteredItems.forEach((item) => {
        const date = item.watchedAt ? new Date(item.watchedAt) : null;
        const now = new Date();
        let key = 'Earlier';
        if (date) {
            const diffDays = Math.floor((now - date) / 86400000);
            if (diffDays === 0) key = 'Today';
            else if (diffDays === 1) key = 'Yesterday';
            else if (diffDays < 7) key = 'This Week';
            else if (diffDays < 30) key = 'This Month';
        }
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
    });

    const groupOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Earlier'];

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Watch History — clipX</title>
                <meta name="description" content="View your complete watch history on clipX" />
            </Head>

            <div className="min-h-screen bg-gray-950" style={{ paddingTop: '100px' }}>
                <div className="max-w-6xl mx-auto px-4 pb-20">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                                <FiChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                                        <FiClock className="w-5 h-5 text-white" />
                                    </div>
                                    Watch History
                                </h1>
                                <p className="text-gray-400 text-sm mt-1 ml-14">
                                    {allItems.length} {allItems.length === 1 ? 'item' : 'items'} in your history
                                </p>
                            </div>
                        </div>

                        {allItems.length > 0 && (
                            <button
                                onClick={() => setShowClearModal(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors"
                            >
                                <FiTrash2 className="w-4 h-4" />
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Search & Filter Bar */}
                    {allItems.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-3 mb-8">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search your history..."
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                    >
                                        <FiX className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {[
                                    { key: 'all', label: 'All', icon: FiFilter },
                                    { key: 'movie', label: 'Movies', icon: FiFilm },
                                    { key: 'series', label: 'Series', icon: FiTv },
                                ].map((f) => (
                                    <button
                                        key={f.key}
                                        onClick={() => setFilter(f.key)}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${filter === f.key
                                                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <f.icon className="w-4 h-4" />
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && !data && (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && allItems.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-24 text-center"
                        >
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 flex items-center justify-center mb-6">
                                <FiClock className="w-12 h-12 text-gray-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">No Watch History Yet</h2>
                            <p className="text-gray-400 mb-6 max-w-md">
                                Start watching movies and series on clipX and they'll appear here so you can pick up where you left off.
                            </p>
                            <Link
                                href="/movies"
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold rounded-xl hover:from-primary-500 hover:to-purple-500 transition-all shadow-lg shadow-primary-500/20"
                            >
                                <FiPlay className="w-5 h-5" />
                                Browse Movies
                            </Link>
                        </motion.div>
                    )}

                    {/* No results for filter/search */}
                    {!loading && allItems.length > 0 && filteredItems.length === 0 && (
                        <div className="flex flex-col items-center py-16 text-center">
                            <FiSearch className="w-12 h-12 text-gray-600 mb-4" />
                            <p className="text-gray-400 text-lg">No results found</p>
                            <p className="text-gray-500 text-sm mt-1">Try a different search or filter</p>
                        </div>
                    )}

                    {/* History Items Grouped by Date */}
                    <div className="space-y-8">
                        {groupOrder.map((groupKey) => {
                            const items = grouped[groupKey];
                            if (!items || items.length === 0) return null;
                            return (
                                <motion.div
                                    key={groupKey}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <FiCalendar className="w-4 h-4" />
                                        {groupKey}
                                        <span className="text-gray-600 font-normal lowercase">({items.length})</span>
                                    </h3>

                                    <div className="space-y-2">
                                        {items.map((item, idx) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="group bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-xl p-3 sm:p-4 flex items-center gap-4 cursor-pointer transition-all"
                                                onClick={() => router.push(`/watch/${item.movieboxId}`)}
                                            >
                                                {/* Poster */}
                                                <div className="relative w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
                                                    {item.posterUrl ? (
                                                        <Image
                                                            src={item.posterUrl}
                                                            alt={item.title}
                                                            fill
                                                            className="object-cover"
                                                            sizes="80px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                            <FiFilm className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                    {/* Play overlay on hover */}
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <FiPlay className="w-6 h-6 text-white" />
                                                    </div>
                                                    {/* Progress bar on poster */}
                                                    {item.progress > 0 && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                                            <div
                                                                className="h-full bg-primary-500 rounded-full"
                                                                style={{ width: `${Math.min(item.progress, 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-white font-bold text-sm sm:text-base truncate group-hover:text-primary-400 transition-colors">
                                                        {item.title}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                                        <span className={`px-2 py-0.5 rounded ${item.contentType === 'series' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'} font-bold uppercase text-[10px]`}>
                                                            {item.contentType === 'series' ? 'Series' : 'Movie'}
                                                        </span>
                                                        {item.duration > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <FiClock className="w-3 h-3" />
                                                                {formatDuration(item.duration)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Progress */}
                                                    {item.duration > 0 && (
                                                        <div className="mt-2 hidden sm:block">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[200px]">
                                                                    <div
                                                                        className={`h-full rounded-full ${item.progress >= 90 ? 'bg-green-500' : 'bg-primary-500'}`}
                                                                        style={{ width: `${Math.min(item.progress, 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[11px] text-gray-500 font-mono">
                                                                    {formatTime(item.currentTime)} / {formatTime(item.duration)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right side */}
                                                <div className="flex-shrink-0 text-right hidden sm:block">
                                                    <p className="text-xs text-gray-500">{timeAgo(item.watchedAt)}</p>
                                                    {item.progress >= 90 ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-green-400 font-bold mt-1">
                                                            ✓ Watched
                                                        </span>
                                                    ) : item.progress > 0 ? (
                                                        <span className="text-[10px] text-primary-400 font-bold mt-1">
                                                            {Math.round(item.progress)}% done
                                                        </span>
                                                    ) : null}
                                                </div>

                                                {/* Continue button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/watch/${item.movieboxId}`);
                                                    }}
                                                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-primary-600/80 hover:bg-primary-500 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    <FiPlay className="w-3.5 h-3.5" />
                                                    {item.progress >= 90 ? 'Rewatch' : item.progress > 0 ? 'Continue' : 'Watch'}
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Clear History Modal */}
            <AnimatePresence>
                {showClearModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => setShowClearModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <FiTrash2 className="w-8 h-8 text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Clear Watch History?</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                This will permanently delete all your watch history and progress data. This cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowClearModal(false)}
                                    className="px-6 py-2.5 bg-white/5 text-white rounded-xl hover:bg-white/10 font-medium transition-colors border border-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClear}
                                    disabled={clearing}
                                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 font-bold transition-colors disabled:opacity-50"
                                >
                                    {clearing ? 'Clearing...' : 'Clear All'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
