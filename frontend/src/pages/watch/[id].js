/**
 * Video Streaming/Watch Page
 * Full-featured video player with streaming support
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize,
  FiSkipBack, FiSkipForward, FiSettings, FiChevronLeft, FiDownload,
  FiShare2, FiHeart, FiBookmark, FiMessageCircle, FiList
} from 'react-icons/fi';

import { useAuth } from '@/contexts/AuthContext';
import { GET_MOVIE, GET_STREAMING_URL } from '@/graphql/queries/movieQueries';
import { RECORD_WATCH_PROGRESS } from '@/graphql/mutations/interactionMutations';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function WatchPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();

  // Video player refs and state
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const inactivityTimer = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('auto');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch movie data
  const { data: movieData, loading } = useQuery(GET_MOVIE, {
    variables: { id },
    skip: !id
  });

  // Fetch streaming URL
  const { data: streamData } = useQuery(GET_STREAMING_URL, {
    variables: { movieId: id },
    skip: !id
  });

  // Save watch progress mutation
  const [recordProgress] = useMutation(RECORD_WATCH_PROGRESS);

  const movie = movieData?.movie;
  const streamingUrl = streamData?.streamingUrl || movie?.streamingUrl;

  // Save progress periodically
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const interval = setInterval(() => {
      if (currentTime > 0) {
        recordProgress({
          variables: {
            movieId: id,
            currentTime: Math.floor(currentTime),
            duration: Math.floor(duration)
          }
        }).catch(console.error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [id, currentTime, duration, isAuthenticated, recordProgress]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'arrowleft':
          skip(-10);
          break;
        case 'arrowright':
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Auto-hide controls
  const resetInactivityTimer = useCallback(() => {
    setShowControls(true);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

    if (isPlaying) {
      inactivityTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [isPlaying, resetInactivityTimer]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);

      const bufferedEnd = videoRef.current.buffered.length > 0
        ? videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
        : 0;
      setBuffered((bufferedEnd / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const adjustVolume = (delta) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleProgressClick = (e) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * duration;
    }
  };

  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    setShowSettings(false);
    // In a real implementation, this would switch video source
  };

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettings(false);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{movie?.title ? `Watch ${movie.title}` : 'Watch'} - clipX</title>
      </Head>

      <div
        ref={containerRef}
        className="relative w-full h-screen bg-black"
        onMouseMove={resetInactivityTimer}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* Video Player */}
        <video
          ref={videoRef}
          src={streamingUrl || '/sample-video.mp4'}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onEnded={() => setIsPlaying(false)}
          playsInline
        />

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col justify-between"
            >
              {/* Top Bar */}
              <div className="bg-gradient-to-b from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/movies/${id}`}
                    className="flex items-center gap-2 text-white hover:text-primary-400 transition-colors"
                  >
                    <FiChevronLeft className="w-6 h-6" />
                    <span className="hidden sm:inline">Back</span>
                  </Link>

                  <h1 className="text-white font-medium text-lg truncate max-w-md">
                    {movie?.title}
                  </h1>

                  <div className="flex items-center gap-4">
                    <button className="text-white hover:text-primary-400">
                      <FiShare2 className="w-5 h-5" />
                    </button>
                    <button className="text-white hover:text-primary-400">
                      <FiDownload className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Center Play Button */}
              {!isPlaying && (
                <div className="flex items-center justify-center">
                  <button
                    onClick={togglePlay}
                    className="w-20 h-20 bg-primary-600/90 rounded-full flex items-center justify-center hover:bg-primary-500 transition-colors"
                  >
                    <FiPlay className="w-10 h-10 text-white ml-1" />
                  </button>
                </div>
              )}

              {/* Bottom Controls */}
              <div className="bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Progress Bar */}
                <div
                  ref={progressRef}
                  className="relative h-1 bg-gray-600 rounded-full mb-4 cursor-pointer group"
                  onClick={handleProgressClick}
                >
                  {/* Buffered */}
                  <div
                    className="absolute h-full bg-gray-500 rounded-full"
                    style={{ width: `${buffered}%` }}
                  />
                  {/* Progress */}
                  <div
                    className="absolute h-full bg-primary-500 rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  {/* Scrubber */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
                  />
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Play/Pause */}
                    <button onClick={togglePlay} className="text-white hover:text-primary-400">
                      {isPlaying ? <FiPause className="w-6 h-6" /> : <FiPlay className="w-6 h-6" />}
                    </button>

                    {/* Skip Buttons */}
                    <button onClick={() => skip(-10)} className="text-white hover:text-primary-400">
                      <FiSkipBack className="w-5 h-5" />
                    </button>
                    <button onClick={() => skip(10)} className="text-white hover:text-primary-400">
                      <FiSkipForward className="w-5 h-5" />
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-2 group">
                      <button onClick={toggleMute} className="text-white hover:text-primary-400">
                        {isMuted || volume === 0 ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => {
                          setVolume(parseFloat(e.target.value));
                          if (videoRef.current) videoRef.current.volume = parseFloat(e.target.value);
                        }}
                        className="w-20 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>

                    {/* Time */}
                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Settings */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-white hover:text-primary-400"
                      >
                        <FiSettings className="w-5 h-5" />
                      </button>

                      {showSettings && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 rounded-lg shadow-xl overflow-hidden">
                          <div className="p-2 border-b border-gray-800">
                            <p className="text-xs text-gray-400 px-2 mb-1">Quality</p>
                            {['auto', '1080p', '720p', '480p'].map((q) => (
                              <button
                                key={q}
                                onClick={() => handleQualityChange(q)}
                                className={`w-full text-left px-2 py-1 text-sm rounded ${quality === q ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                                  }`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                          <div className="p-2">
                            <p className="text-xs text-gray-400 px-2 mb-1">Speed</p>
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                              <button
                                key={speed}
                                onClick={() => handleSpeedChange(speed)}
                                className={`w-full text-left px-2 py-1 text-sm rounded ${playbackRate === speed ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                                  }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fullscreen */}
                    <button onClick={toggleFullscreen} className="text-white hover:text-primary-400">
                      {isFullscreen ? <FiMinimize className="w-5 h-5" /> : <FiMaximize className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}