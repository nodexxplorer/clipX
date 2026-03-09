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
  FiCalendar, FiFilm, FiShare2, FiHeart, FiX, FiChevronLeft, FiList
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
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [shareCopied, setShareCopied] = useState(false);

  // Extract actual ID from URL:
  //  1. Try numeric ID or UUID pattern (backward compat: /movies/12345-slug)
  //  2. If slug-only URL, look up sessionStorage mapping set by MovieCard
  const actualId = (() => {
    if (!id) return null;
    // Check numeric / UUID pattern at start (legacy URLs)
    const match = id.match(/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+)/i);
    if (match) return match[0];
    // Slug-only URL — resolve from sessionStorage
    try {
      const stored = sessionStorage.getItem('clipx_s_' + id);
      if (stored) return stored;
    } catch { }
    // Fallback: pass the slug as-is (backend will 404 but we handle that)
    return id;
  })();

  // Fetch movie data
  const { data, loading, error } = useQuery(GET_MOVIE, {
    variables: { id: actualId },
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
      variables: { movieId: actualId, type: 'STREAM' }
    });

    router.push(`/watch/${actualId}?s=${selectedSeason}&e=${selectedEpisode}`);
  };

  const handleDownload = () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/movies/${actualId}`);
      return;
    }
    setShowDownloadModal(true);
  };

  const handleToggleWatchlist = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/movies/${actualId}`);
      return;
    }

    if (isInWatchlist) {
      await removeFromWatchlist({ variables: { movieId: actualId } });
      setIsInWatchlist(false);
    } else {
      await addToWatchlist({ variables: { movieId: actualId } });
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

  if (error) {
    // Only 404 on actual GraphQL "not found" — not transient network blips
    const isNetworkError = !!error.networkError;
    const isNotFound = error.graphQLErrors?.some(
      e => e.extensions?.code === 'NOT_FOUND' || e.message?.includes('not found')
    );
    if (!isNetworkError || isNotFound) {
      router.replace('/404');
      return null;
    }
  }
  if (!loading && id && !movie) {
    router.replace('/404');
    return null;
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#050607] via-[#050607]/80 to-[#050607]/40" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#050607] via-transparent to-transparent" />
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
                  <button
                    onClick={async () => {
                      const url = window.location.href;
                      const title = movie?.title ? `Watch ${movie.title} on clipX` : 'Watch on clipX';
                      if (navigator.share) {
                        try { await navigator.share({ title, url }); } catch { }
                      } else {
                        await navigator.clipboard.writeText(url);
                        setShareCopied(true);
                        setTimeout(() => setShareCopied(false), 2000);
                      }
                    }}
                    className="relative w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-white/20 backdrop-blur-md text-white transition-all border border-white/10 hidden sm:flex"
                  >
                    <FiShare2 className="w-5 h-5" />
                    {shareCopied && (
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-green-500/90 text-white px-2 py-0.5 rounded-full whitespace-nowrap">Copied!</span>
                    )}
                  </button>
                </div>

                {/* Overview */}
                <div className="max-w-3xl mb-8">
                  <h2 className="text-lg font-semibold text-white mb-2">Overview</h2>
                  <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
                </div>

                {/* Season & Episode Selector */}
                {movie.seasons && movie.seasons.length > 0 && (
                  <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-md border border-white/5 max-w-3xl">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <FiList className="text-primary-500" /> Seasons & Episodes
                    </h2>

                    <div className="flex flex-wrap gap-4 mb-6">
                      {movie.seasons.map((season) => (
                        <button
                          key={season.id}
                          onClick={() => {
                            setSelectedSeason(season.seasonNumber);
                            setSelectedEpisode(1);
                          }}
                          className={`px-4 py-2 rounded-lg font-bold transition-all ${selectedSeason === season.seasonNumber
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                          Season {season.seasonNumber}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {movie.seasons
                        .find((s) => s.seasonNumber === selectedSeason)
                        ?.episodes.map((episode) => (
                          <button
                            key={episode.id}
                            onClick={() => setSelectedEpisode(episode.episodeNumber)}
                            className={`p-3 rounded-lg text-sm font-medium transition-all text-center ${selectedEpisode === episode.episodeNumber
                              ? 'bg-white text-black font-black'
                              : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white'
                              }`}
                          >
                            Ep {episode.episodeNumber}
                          </button>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-center md:justify-start">
                      <button
                        onClick={handleWatchNow}
                        className="flex items-center gap-2 px-6 py-2 bg-white text-black font-black rounded-full hover:scale-105 transition-transform"
                      >
                        <FiPlay size={18} fill="currentColor" /> Play S{selectedSeason} E{selectedEpisode}
                      </button>
                    </div>
                  </div>
                )}


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
          {actualId && <SimilarMovies movieId={actualId} limit={10} />}
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
          season={selectedSeason}
          episode={selectedEpisode}
        />
      </>
    </>
  );
}
