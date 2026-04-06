/**
 * ContinueWatching Row
 * Shows the user's in-progress movies/series with progress bars
 * Uses the watch history query from the backend
 */

import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiPlay, FiClock, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { GET_WATCHLIST, GET_WATCH_HISTORY } from '@/graphql/queries/userQueries';

function formatTime(seconds) {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function ProgressCard({ item }) {
    const progress = item.duration ? Math.min((item.currentTime / item.duration) * 100, 100) : 0;
    const remaining = item.duration ? Math.max(0, item.duration - item.currentTime) : 0;

    return (
        <Link href={`/watch/${item.movieboxId || item.id}`} className="group block flex-shrink-0 w-[280px] sm:w-[300px]">
            <div className="relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/5 hover:border-primary-500/30 transition-all">
                {/* Poster / Backdrop */}
                <div className="relative h-40 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                    {item.posterUrl ? (
                        <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <FiPlay className="w-8 h-8 text-gray-600" />
                        </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary-600/90 flex items-center justify-center">
                            <FiPlay className="w-5 h-5 text-white ml-0.5" />
                        </div>
                    </div>
                    {/* Time remaining */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-md text-[10px] text-gray-300 font-bold flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {formatTime(remaining)} left
                    </div>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-primary-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {/* Title */}
                <div className="p-3">
                    <h4 className="text-white text-sm font-bold truncate group-hover:text-primary-400 transition-colors">
                        {item.title || 'Untitled'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{Math.round(progress)}% watched</p>
                </div>
            </div>
        </Link>
    );
}

export default function ContinueWatching() {
    const { isAuthenticated } = useAuth();
    const { data, loading } = useQuery(GET_WATCH_HISTORY, {
        skip: !isAuthenticated,
        variables: { limit: 10 },
        fetchPolicy: 'cache-and-network',
    });

    const history = data?.watchHistory || [];
    // Only show items that are not fully watched (< 95%)
    const inProgress = history.filter(
        (item) => item.duration && (item.currentTime / item.duration) < 0.95
    );

    if (!isAuthenticated || loading || inProgress.length === 0) return null;

    return (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
                        <FiPlay className="w-4 h-4 text-primary-400" />
                    </div>
                    <h2 className="text-xl font-black text-white">Continue Watching</h2>
                </div>
                <Link href="/history" className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-400 transition-colors font-bold">
                    View All <FiChevronRight className="w-3 h-3" />
                </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {inProgress.map((item, i) => (
                    <motion.div
                        key={item.id || i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <ProgressCard item={item} />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
