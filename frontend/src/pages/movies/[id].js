// src/pages/movies/[id].js

/**
 * Movie Detail Page
 * Full movie information with streaming and download options
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@apollo/client/react';
import { motion } from 'framer-motion';
import {
  FiPlay, FiDownload, FiPlus, FiCheck, FiStar, FiClock,
  FiCalendar, FiFilm, FiShare2, FiHeart, FiX
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

export default function MovieDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();

  const [showTrailer, setShowTrailer] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // Fetch movie data
  const { data, loading, error } = useQuery(GET_MOVIE, {
    variables: { id },
    skip: !id,
    onCompleted: (data) => {
      setIsInWatchlist(data?.movie?.inWatchlist || false);
    }
  });

  // Mutations
  const [addToWatchlist] = useMutation(ADD_TO_WATCHLIST);
  const [removeFromWatchlist] = useMutation(REMOVE_FROM_WATCHLIST);
  const [recordInteraction] = useMutation(RECORD_INTERACTION);

  const movie = data?.movie;

  const handleWatchNow = () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/watch/${id}`);
      return;
    }

    recordInteraction({
      variables: { movieId: id, type: 'STREAM' }
    });

    router.push(`/watch/${id}`);
  };

  const handleDownload = () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/movies/${id}`);
      return;
    }
    setShowDownloadModal(true);
  };

  const handleToggleWatchlist = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/movies/${id}`);
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

  if (error || !movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-white mb-4">Movie not found</h1>
        <Link href="/movies" className="text-primary-400 hover:underline">
          Browse Movies
        </Link>
      </div>
    );
  }

  const backdropUrl = movie.backdropUrl || movie.backdropPath || movie.posterPath;
  const posterUrl = movie.posterUrl || movie.posterPath || '/images/placeholder.jpg';

  return (
    <>
      <Head>
        <title>{movie.title} - clipX</title>
        <meta name="description" content={movie.overview} />
        <meta property="og:title" content={movie.title} />
        <meta property="og:description" content={movie.overview} />
        <meta property="og:image" content={backdropUrl} />
      </Head>

      <>
        {/* Hero Section with Backdrop */}
        <div className="relative min-h-[70vh]">
          {backdropUrl && (
            <div className="absolute inset-0">
              <img
                src={backdropUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/40" />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-transparent" />
            </div>
          )}

          <div className="relative container mx-auto px-4 pt-32 pb-12">
            {/* Back Button */}
            <Link
              href="/movies"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
            >
              <FiChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold uppercase tracking-widest text-xs">Back to Browse</span>
            </Link>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Poster */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-shrink-0"
              >
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-64 rounded-xl shadow-2xl mx-auto md:mx-0"
                />
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 text-center md:text-left"
              >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {movie.title}
                </h1>

                {movie.tagline && (
                  <p className="text-xl text-gray-400 italic mb-4">{movie.tagline}</p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6 text-gray-300">
                  <span className="flex items-center gap-1">
                    <FiStar className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold">{movie.voteAverage?.toFixed(1)}</span>
                    <span className="text-gray-500">({movie.voteCount} votes)</span>
                  </span>
                  {movie.runtime && (
                    <span className="flex items-center gap-1">
                      <FiClock className="w-4 h-4" />
                      {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                    </span>
                  )}
                  {movie.releaseDate && (
                    <span className="flex items-center gap-1">
                      <FiCalendar className="w-4 h-4" />
                      {new Date(movie.releaseDate).getFullYear()}
                    </span>
                  )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                  {movie.genres?.map((genre) => (
                    <Link
                      key={genre.id}
                      href={`/genres/${genre.slug}`}
                      className="px-3 py-1 bg-gray-800/80 text-gray-300 rounded-full text-sm hover:bg-primary-600 hover:text-white transition-colors"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-8">
                  {/* Watch Now (Streaming) */}
                  <button
                    onClick={handleWatchNow}
                    className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30"
                  >
                    <FiPlay className="w-5 h-5" />
                    Watch Now
                  </button>

                  {/* Download */}
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FiDownload className="w-5 h-5" />
                    Download
                  </button>

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

                  {/* Watchlist */}
                  <button
                    onClick={handleToggleWatchlist}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${isInWatchlist
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                      }`}
                  >
                    {isInWatchlist ? <FiCheck className="w-5 h-5" /> : <FiPlus className="w-5 h-5" />}
                  </button>

                  {/* Share */}
                  <button className="flex items-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <FiShare2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Overview */}
                <div className="max-w-3xl">
                  <h2 className="text-lg font-semibold text-white mb-2">Overview</h2>
                  <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
                </div>


              </motion.div>
            </div>
          </div>
        </div>

        {/* Cast Section */}
        {movie.cast?.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold text-white mb-6">Cast</h2>
            <CastList cast={movie.cast} />
          </section>
        )}

        {/* Similar Movies */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-white mb-6">Similar Movies</h2>
          <SimilarMovies movieId={id} limit={10} />
        </section>

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

        {/* Download Modal */}
        <DownloadModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          movie={movie}
        />
      </>
    </>
  );
}
