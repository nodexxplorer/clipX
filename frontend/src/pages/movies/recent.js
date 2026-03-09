// src/pages/movies/recent.js
import { useState } from 'react';
import Head from 'next/head';
import { useQuery } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiTrendingUp, FiFilter, FiFilm, FiTv } from 'react-icons/fi';
import MovieCard from '@/components/movies/MovieCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { GET_MOVIES } from '@/graphql/queries/movieQueries';

const TABS = [
    { key: 'all', label: 'All', icon: FiTrendingUp },
    { key: 'movies', label: 'Movies', icon: FiFilm },
    { key: 'series', label: 'Series', icon: FiTv },
];
const SORT_OPTIONS = [
    { value: 'recent', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Top Rated' },
];
const LIMIT = 30;

export default function RecentPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [sort, setSort] = useState('recent');
    const [offset, setOffset] = useState(0);

    // GET_MOVIES: movies(limit, offset, sort, filter) → { movies[], total, hasMore }
    const { data, loading, fetchMore } = useQuery(GET_MOVIES, {
        variables: { limit: LIMIT, offset: 0, sort },
        notifyOnNetworkStatusChange: true,
    });

    const movies = data?.movies?.movies || [];
    const hasMore = data?.movies?.hasMore;

    const handleLoadMore = () => {
        const nextOffset = offset + LIMIT;
        setOffset(nextOffset);
        fetchMore({
            variables: { offset: nextOffset },
            updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;
                return {
                    movies: {
                        ...fetchMoreResult.movies,
                        movies: [...(prev.movies?.movies || []), ...(fetchMoreResult.movies?.movies || [])],
                    },
                };
            },
        });
    };

    return (
        <>
            <Head>
                <title>New &amp; Recent - clipX</title>
                <meta name="description" content="Discover the latest movies and series just added to clipX." />
            </Head>

            <div className="min-h-screen pt-24 pb-20 px-4 md:px-12">
                {/* Page Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-primary-500" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
                            New &amp; Recent
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg ml-[52px]">Just added — catch them before everyone else</p>
                </motion.div>

                {/* Filter Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10"
                >
                    <div className="flex bg-white/5 backdrop-blur-xl rounded-xl p-1 border border-white/10">
                        {TABS.map((tab) => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.key
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}>
                                <tab.icon className="w-4 h-4" />{tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <FiFilter className="w-4 h-4 text-gray-500" />
                        <select value={sort} onChange={(e) => { setSort(e.target.value); setOffset(0); }}
                            className="bg-white/5 backdrop-blur-xl text-white px-4 py-2.5 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none text-sm font-bold">
                            {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                </motion.div>

                {/* Grid */}
                {loading && movies.length === 0 ? (
                    <div className="flex items-center justify-center py-32">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : movies.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-32 text-center">
                        <FiFilm className="w-16 h-16 text-gray-700 mb-6" />
                        <h3 className="text-2xl font-black text-white mb-2">No content found</h3>
                        <p className="text-gray-500">Try changing the filter or check back later.</p>
                    </motion.div>
                ) : (
                    <>
                        <motion.div
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                            <AnimatePresence>
                                {movies.map((movie, i) => (
                                    <motion.div key={movie.id}
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(i * 0.03, 0.5) }}>
                                        <MovieCard movie={movie} size="md" isSeries={activeTab === 'series'} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                        {hasMore && (
                            <div className="flex justify-center mt-12">
                                <button onClick={handleLoadMore} disabled={loading}
                                    className="btn-primary flex items-center gap-2 disabled:opacity-50">
                                    {loading ? 'Loading…' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
