// src/pages/anime/[id].js

/**
 * Anime Detail Page
 * Based on Movie Detail Page but optimized for Anime content
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@apollo/client/react';
import { motion } from 'framer-motion';
import {
    FiPlay, FiDownload, FiPlus, FiCheck, FiStar, FiClock,
    FiCalendar, FiShare2, FiX, FiFilm
} from 'react-icons/fi';
import ReactPlayer from 'react-player';

import { useAuth } from '@/contexts/AuthContext';
import { GET_MOVIE } from '@/graphql/queries/movieQueries';
import { ADD_TO_WATCHLIST, REMOVE_FROM_WATCHLIST } from '@/graphql/mutations/watchlistMutations';
import { RECORD_INTERACTION } from '@/graphql/mutations/interactionMutations';
import CastList from '@/components/movies/CastList';
import SimilarMovies from '@/components/recommendations/SimilarMovies';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DownloadModal from '@/components/common/DownloadModal';
import Modal from '@/components/common/Modal';

export default function AnimeDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user, isAuthenticated } = useAuth();

    const [showTrailer, setShowTrailer] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);

    // Fetch data (using GET_MOVIE since DB schema is shared)
    const { data, loading, error } = useQuery(GET_MOVIE, {
        variables: { id },
        skip: !id,
        onCompleted: (data) => {
            setIsInWatchlist(data?.movie?.inWatchlist || false);
        }
    });

    const [addToWatchlist] = useMutation(ADD_TO_WATCHLIST);
    const [removeFromWatchlist] = useMutation(REMOVE_FROM_WATCHLIST);
    const [recordInteraction] = useMutation(RECORD_INTERACTION);

    const movie = data?.movie;

    const handleWatchNow = () => {
        if (!isAuthenticated) {
            router.push(`/auth/login?redirect=/anime/${id}`);
            return;
        }

        recordInteraction({ variables: { movieId: id, type: 'STREAM' } });
        router.push(`/watch/${id}`);
    };

    const handleDownload = () => {
        if (!isAuthenticated) {
            router.push(`/auth/login?redirect=/anime/${id}`);
            return;
        }
        setShowDownloadModal(true);
    };

    const handleToggleWatchlist = async () => {
        if (!isAuthenticated) {
            router.push(`/auth/login?redirect=/anime/${id}`);
            return;
        }
        if (isInWatchlist) {
            await removeFromWatchlist({ variables: { movieId: id } });
            setIsInWatchlist(false);
        } else {
            await addToWatchlist({ variables: { movieId: id } });
            setIsInWatchlist(true);
        }
    };

    if (!router.isReady || loading || !id) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }
    if (error || !movie) return <div className="text-center text-white mt-20">Anime not found</div>;

    const backdropUrl = movie.backdropPath ? `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE}/original${movie.backdropPath}` : null;
    const posterUrl = movie.posterPath ? `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE}/w500${movie.posterPath}` : '/images/placeholder.jpg';

    return (
        <>
            <Head>
                <title>{movie.title} - Anime - clipX</title>
            </Head>

            {/* Hero Section */}
            <div className="relative min-h-[70vh]">
                {backdropUrl && (
                    <div className="absolute inset-0">
                        <img src={backdropUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/40" />
                    </div>
                )}
                <div className="relative container mx-auto px-4 pt-32 pb-12">
                    <div className="flex flex-col md:flex-row gap-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-shrink-0">
                            <img src={posterUrl} className="w-64 rounded-xl shadow-2xl" />
                        </motion.div>

                        <div className="flex-1 text-white">
                            <h1 className="text-4xl font-bold mb-4">{movie.title}</h1>
                            <div className="flex gap-4 mb-6 text-gray-300">
                                <span className="flex items-center gap-1"><FiStar className="text-yellow-400" /> {movie.voteAverage?.toFixed(1)}</span>
                                <span>{movie.year}</span>
                                <span className="bg-primary-600/50 px-2 rounded text-xs py-1">ANIME</span>
                            </div>

                            <div className="flex gap-4 mb-8">
                                <button onClick={handleWatchNow} className="btn-primary flex gap-2 items-center px-6 py-3 bg-primary-600 rounded-lg hover:bg-primary-700"><FiPlay /> Watch</button>
                                <button onClick={handleDownload} className="flex gap-2 items-center px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700"><FiDownload /> Download</button>
                                {/* Trailer */}
                                {movie.trailerUrl && (
                                    <button
                                        onClick={() => setShowTrailer(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        <FiFilm className="w-5 h-5" />
                                        Trailer
                                    </button>
                                )}
                            </div>

                            <p className="text-gray-300 max-w-2xl">{movie.overview}</p>
                        </div>
                    </div>
                </div>
            </div>

            <DownloadModal
                isOpen={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                movie={movie}
            />

            {/* Trailer Modal */}
            {showTrailer && movie.trailerUrl && (
                <Modal isOpen={showTrailer} onClose={() => setShowTrailer(false)} size="xl">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                        <ReactPlayer
                            url={movie.trailerUrl}
                            width="100%"
                            height="100%"
                            playing={true}
                            controls={true}
                        />
                        <button
                            onClick={() => setShowTrailer(false)}
                            className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 z-10"
                        >
                            <FiX size={24} />
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
}
