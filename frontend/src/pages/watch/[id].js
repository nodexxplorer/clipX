/**
 * Video Streaming/Watch Page
 * Full-featured video player with streaming support
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQuery, useMutation } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize,
  FiSkipBack, FiSkipForward, FiSettings, FiChevronLeft, FiDownload,
  FiShare2, FiHeart, FiBookmark, FiMessageCircle, FiList, FiSun, FiMessageSquare,
  FiAlertTriangle, FiRefreshCw, FiWifi, FiWifiOff
} from 'react-icons/fi';

import { useAuth } from '@/contexts/AuthContext';
import { GET_MOVIE, GET_STREAMING_URL } from '@/graphql/queries/movieQueries';
import { RECORD_WATCH_PROGRESS } from '@/graphql/mutations/interactionMutations';

// Code splitting: only load spinner when needed
const LoadingSpinner = dynamic(() => import('@/components/common/LoadingSpinner'), { ssr: false });

export default function WatchPage() {
  const router = useRouter();
  const { id, s, e } = router.query;
  const { user, isAuthenticated } = useAuth();

  const season = s ? parseInt(s) : null;
  const episode = e ? parseInt(e) : null;

  // Extract actual ID from potential slug string — declared early so all hooks below can reference it
  const actualId = (() => {
    if (!id) return null;
    const match = id.match(/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+)/i);
    if (match) return match[0];
    try {
      const stored = sessionStorage.getItem('clipx_s_' + id);
      if (stored) return stored;
    } catch { }
    return id;
  })();

  // Video player refs and state
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const inactivityTimer = useRef(null);
  const restoringTimeRef = useRef(null);
  const wasPlayingRef = useRef(false);

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
  const [brightness, setBrightness] = useState(1);
  const [streamDataFetch, setStreamDataFetch] = useState(null);
  const [localSubtitles, setLocalSubtitles] = useState([]);
  const subtitleInputRef = useRef(null);
  // Resume playback
  const [resumePrompt, setResumePrompt] = useState(null);
  const hasSeekedRef = useRef(false);
  // Stream error handling
  const [streamError, setStreamError] = useState(null); // null | { code, message, type }
  const [streamRetrying, setStreamRetrying] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  // Online/offline
  const [isOnline, setIsOnline] = useState(true);
  // Aspect ratio detection
  const [aspectRatio, setAspectRatio] = useState(null); // e.g. '16:9'
  // Video fit mode — user-selectable
  const [videoFit, setVideoFit] = useState('contain');
  // Mobile landscape prompt
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  // Share feedback
  const [shareCopied, setShareCopied] = useState(false);
  // Volume OSD
  const [volumeOSD, setVolumeOSD] = useState(false);
  const volumeOSDTimer = useRef(null);

  // Restore persisted volume on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('clipx_volume');
      if (saved !== null) {
        const v = parseFloat(saved);
        if (!isNaN(v) && v >= 0 && v <= 1) {
          setVolume(v);
          setIsMuted(v === 0);
          if (videoRef.current) videoRef.current.volume = v;
        }
      }
    } catch { }
  }, []);

  // Track connectivity
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Compute human-readable aspect ratio from video intrinsic dimensions
  const computeAspectRatio = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const w = video.videoWidth;
    const h = video.videoHeight;
    const d = gcd(w, h);
    const rw = w / d;
    const rh = h / d;
    // Normalise common ratios
    const ratio = w / h;
    if (ratio >= 2.3) setAspectRatio('21:9');
    else if (ratio >= 1.7) setAspectRatio('16:9');
    else if (ratio >= 1.55) setAspectRatio('3:2');
    else if (ratio >= 1.3) setAspectRatio('4:3');
    else setAspectRatio(`${rw}:${rh}`);
  }, []);

  // Mobile portrait → landscape prompt
  useEffect(() => {
    const isTouchDevice = () =>
      typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const checkOrientation = () => {
      if (!isTouchDevice()) { setIsMobilePortrait(false); return; }
      const portrait = window.matchMedia('(orientation: portrait)').matches;
      setIsMobilePortrait(portrait);
      if (portrait && isPlaying) {
        setShowRotatePrompt(true);
      } else {
        setShowRotatePrompt(false);
      }
    };

    checkOrientation();
    const mq = window.matchMedia('(orientation: portrait)');
    mq.addEventListener('change', checkOrientation);
    return () => mq.removeEventListener('change', checkOrientation);
  }, [isPlaying]);

  // Request landscape orientation (Screen Orientation API)
  const requestLandscape = useCallback(async () => {
    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock('landscape');
      } else if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
      setShowRotatePrompt(false);
    } catch {
      // API not supported — user must rotate manually
    }
  }, []);

  // Validate a stream URL (quick HEAD request, fallback to true if CORS blocks)
  const validateStreamUrl = useCallback(async (url) => {
    if (!url) return false;
    try {
      const res = await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(4000) });
      // 'no-cors' gives opaque response — if it didn't throw the URL is likely reachable
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchStreamData = useCallback(() => {
    if (!actualId) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || 'http://localhost:8000';
    setStreamError(null);
    setStreamRetrying(true);
    fetch(`${baseUrl}/api/movie/${actualId}/stream?season=${season || 0}&episode=${episode || 1}&bust=${Date.now()}`)
      .then(res => {
        if (res.status === 404) throw Object.assign(new Error('Content not found'), { type: 'not_found' });
        if (res.status === 403) throw Object.assign(new Error('Access denied'), { type: 'forbidden' });
        if (res.status === 410) throw Object.assign(new Error('Stream link has expired'), { type: 'expired' });
        if (!res.ok) throw Object.assign(new Error(`Server error (${res.status})`), { type: 'server' });
        return res.json();
      })
      .then(data => {
        setStreamDataFetch(data);
        setStreamRetrying(false);
        retryCountRef.current = 0;
      })
      .catch(err => {
        console.error('Stream fetch error:', err);
        setStreamRetrying(false);
        // Only show error if we've retried or it's a permanent error
        if (!navigator.onLine) {
          setStreamError({ type: 'offline', message: 'You\'re offline. Connect to the internet to stream.' });
        } else {
          setStreamError({ type: err.type || 'network', message: err.message || 'Could not load stream.' });
        }
      });
  }, [actualId, season, episode]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // (actualId already declared above — before all hooks)

  // Fetch movie data
  const { data: movieData, loading, error: movieQueryError } = useQuery(GET_MOVIE, {
    variables: { id: actualId },
    skip: !actualId
  });

  // Fetch streaming URL
  const { data: streamData } = useQuery(GET_STREAMING_URL, {
    variables: {
      movieId: actualId,
      season: season,
      episode: episode
    },
    skip: !actualId
  });

  // Fetch full stream details for multiple qualities and subtitles
  useEffect(() => { fetchStreamData(); }, [fetchStreamData]);


  // --- Watch History & Resume Playback ---
  const HISTORY_KEY = actualId ? `clipx_progress_${actualId}_s${season || 0}_e${episode || 1}` : null;

  // Load saved position and show resume prompt once stream is ready
  const handleStreamReady = useCallback(() => {
    if (!HISTORY_KEY || hasSeekedRef.current) return;
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || 'null');
      if (saved && saved.currentTime > 30 && (!saved.duration || saved.currentTime < saved.duration - 60)) {
        setResumePrompt(saved);
      }
    } catch (_) { }
  }, [HISTORY_KEY]);

  // Stable ref for movieData so the progress interval doesn't restart
  // every time Apollo re-renders the query result
  const movieDataRef = useRef(movieData);
  useEffect(() => { movieDataRef.current = movieData; }, [movieData]);

  // Save progress to localStorage every 10s (fast, no network)
  useEffect(() => {
    if (!actualId) return;
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.currentTime > 5) {
        const snap = {
          currentTime: Math.floor(videoRef.current.currentTime),
          duration: Math.floor(videoRef.current.duration || 0),
          title: movieDataRef.current?.movie?.title,
          poster: movieDataRef.current?.movie?.posterPath,
          movieId: actualId,
          season: season || 0,
          episode: episode || 1,
          savedAt: Date.now()
        };
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(snap)); } catch (_) { }

        // Also maintain a global recently-watched list
        try {
          const list = JSON.parse(localStorage.getItem('clipx_history') || '[]');
          const filtered = list.filter(h => h.movieId !== actualId || h.season !== (season || 0) || h.episode !== (episode || 1));
          filtered.unshift(snap);
          localStorage.setItem('clipx_history', JSON.stringify(filtered.slice(0, 50)));
        } catch (_) { }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [actualId, season, episode, HISTORY_KEY]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.currentTime > 5 && HISTORY_KEY) {
        const snap = {
          currentTime: Math.floor(videoRef.current.currentTime),
          duration: Math.floor(videoRef.current.duration || 0),
          title: movieDataRef.current?.movie?.title,
          poster: movieDataRef.current?.movie?.posterPath,
          movieId: actualId,
          season: season || 0,
          episode: episode || 1,
          savedAt: Date.now()
        };
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(snap)); } catch (_) { }
      }
    };
  }, [HISTORY_KEY, actualId, season, episode]);

  // GraphQL progress mutation (every 30s, only when authenticated)
  const [recordProgress] = useMutation(RECORD_WATCH_PROGRESS);
  useEffect(() => {
    if (!isAuthenticated || !actualId) return;
    const interval = setInterval(() => {
      if (currentTime > 0) {
        recordProgress({
          variables: { movieId: actualId, currentTime: Math.floor(currentTime), duration: Math.floor(duration) }
        }).catch(console.error);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [actualId, currentTime, duration, isAuthenticated, recordProgress]);

  const movie = movieData?.movie;
  // Get active streaming URL based on selected quality
  const availableLinks = streamDataFetch?.links || [];
  const selectedLink = quality === 'auto'
    ? availableLinks[0]
    : availableLinks.find(l => l.quality.includes(quality));

  const streamingUrl = selectedLink?.url || streamData?.streamingUrl || movie?.streamingUrl;
  // Memoize subtitles so the array reference is stable (avoids re-fetch loop)
  const subtitles = useMemo(
    () => [...(streamDataFetch?.subtitles || []), ...localSubtitles],
    [streamDataFetch?.subtitles, localSubtitles]
  );

  const handleLocalSubtitleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newSub = {
        lang: file.name,
        code: `local-${Date.now()}`,
        url: url
      };
      setLocalSubtitles(prev => [...prev, newSub]);
      handleSubtitleChange(newSub.code);
    }
  };

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
      setStreamError(null); // cleared — stream is valid
      retryCountRef.current = 0;
      computeAspectRatio(); // detect aspect ratio from intrinsic dimensions
      if (restoringTimeRef.current !== null) {
        videoRef.current.currentTime = restoringTimeRef.current;
        if (wasPlayingRef.current) {
          videoRef.current.play().catch(console.error);
          setIsPlaying(true);
        }
        restoringTimeRef.current = null;
      }
    }
  };

  // Video error handler — auto-retry on network errors, show UI on permanent failure
  const handleVideoError = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const err = video.error;
    const code = err?.code || 0;

    const RETRYABLE = new Set([2, 4]); // MEDIA_ERR_NETWORK, MEDIA_ERR_SRC_NOT_SUPPORTED
    const isExpired = code === 4 || code === 2;

    if (RETRYABLE.has(code) && retryCountRef.current < 3) {
      retryCountRef.current += 1;
      setStreamRetrying(true);

      if (isExpired) {
        setStreamError({
          type: 'expired',
          code,
          message: `Stream link expired. Refreshing… (attempt ${retryCountRef.current}/3)`,
        });
      } else {
        setStreamError({
          type: 'network',
          code,
          message: `Network hiccup. Retrying… (attempt ${retryCountRef.current}/3)`,
        });
      }

      // Countdown retry
      let secs = 3;
      setRetryCountdown(secs);
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = setInterval(() => {
        secs -= 1;
        setRetryCountdown(secs);
        if (secs <= 0) clearInterval(retryTimerRef.current);
      }, 1000);

      setTimeout(() => fetchStreamData(), 3000);
    } else {
      clearInterval(retryTimerRef.current);
      const typeMap = {
        1: { type: 'aborted', msg: 'Playback was aborted.' },
        2: { type: 'network', msg: !navigator.onLine ? 'You appear to be offline.' : 'Network error — check your connection.' },
        3: { type: 'decode', msg: 'Video format not supported. Try a different quality.' },
        4: { type: 'expired', msg: 'Stream link is unavailable or has expired.' },
      };
      const mapped = typeMap[code] || { type: 'unknown', msg: 'An unknown playback error occurred.' };
      setStreamError({ type: mapped.type, code, message: mapped.msg });
      setStreamRetrying(false);
    }
  }, [fetchStreamData]);

  // Cleanup retry timer on unmount
  useEffect(() => () => clearInterval(retryTimerRef.current), []);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const skip = useCallback((seconds) => {
    if (videoRef.current) {
      const video = videoRef.current;
      video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    }
  }, []);

  const adjustVolume = useCallback((delta) => {
    setVolume(prevVolume => {
      const newVolume = Math.max(0, Math.min(1, prevVolume + delta));
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
      }
      try { localStorage.setItem('clipx_volume', String(newVolume)); } catch { }
      // Show OSD
      setVolumeOSD(true);
      clearTimeout(volumeOSDTimer.current);
      volumeOSDTimer.current = setTimeout(() => setVolumeOSD(false), 1200);
      return newVolume;
    });
  }, []);

  // Handle keyboard shortcuts (placed after all useCallback declarations to avoid temporal dead zone)
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
          if (e.shiftKey) {
            setBrightness(prev => Math.min(1.5, prev + 0.1));
          } else {
            adjustVolume(0.1);
          }
          break;
        case 'arrowdown':
          e.preventDefault();
          if (e.shiftKey) {
            setBrightness(prev => Math.max(0.5, prev - 0.1));
          } else {
            adjustVolume(-0.1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, toggleFullscreen, toggleMute, skip, adjustVolume]);

  const handleProgressClick = (e) => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * duration;
    }
  };

  const [activeSubtitle, setActiveSubtitle] = useState('off');
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [parsedCues, setParsedCues] = useState([]);   // [{start, end, text}]
  const [currentCue, setCurrentCue] = useState(null); // text to show right now

  // Parse SRT/VTT text into cue objects
  const parseSRT = useCallback((text) => {
    const cues = [];
    // Strip BOM if present
    const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    const blocks = clean.split(/\n{2,}/);
    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) continue;
      // Find the timing line (supports both SRT and VTT)
      const timeIdx = lines.findIndex(l => l.includes('-->'));
      if (timeIdx === -1) continue;
      const [startStr, endStr] = lines[timeIdx].split('-->').map(s => s.trim().split(' ')[0]);
      const toSec = (t) => {
        // Handle HH:MM:SS,mmm and HH:MM:SS.mmm and MM:SS.mmm
        const normalised = t.replace(',', '.');
        const parts = normalised.split(':');
        if (parts.length === 3) {
          return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
        }
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      };
      const textLines = lines.slice(timeIdx + 1)
        .join('\n')
        .replace(/<[^>]+>/g, '') // strip HTML/VTT tags
        .trim();
      if (textLines && startStr && endStr) {
        cues.push({ start: toSec(startStr), end: toSec(endStr), text: textLines });
      }
    }
    return cues;
  }, []);

  // Fetch & parse SRT when active subtitle changes — uses stable index key
  useEffect(() => {
    if (activeSubtitle === 'off' || activeSubtitle === null) {
      setParsedCues([]);
      setCurrentCue(null);
      return;
    }
    // Find by stable index key (sub-{idx}) or by code/lang match
    const sub = subtitles.find((s, idx) => {
      const key = s.code || s.lang || `sub-${idx}`;
      return key === activeSubtitle;
    });
    if (!sub?.url) {
      console.warn('Subtitle not found for key:', activeSubtitle, subtitles);
      return;
    }
    console.log('Fetching subtitle:', sub.url);
    setParsedCues([]);
    setCurrentCue(null);
    fetch(sub.url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(text => {
        const cues = parseSRT(text);
        console.log(`Parsed ${cues.length} subtitle cues`);
        setParsedCues(cues);
      })
      .catch(err => console.warn('Subtitle fetch failed:', err));
  }, [activeSubtitle, subtitles, parseSRT]);

  // Update current cue on timeupdate
  useEffect(() => {
    if (!parsedCues.length) return;
    const cue = parsedCues.find(c => currentTime >= c.start && currentTime <= c.end) || null;
    setCurrentCue(cue?.text || null);
  }, [currentTime, parsedCues]);

  // Auto-enable first subtitle when available — using stable key
  useEffect(() => {
    if (subtitles.length > 0 && activeSubtitle === 'off') {
      const first = subtitles[0];
      const key = first.code || first.lang || 'sub-0';
      setActiveSubtitle(key);
    }
  }, [subtitles, activeSubtitle]);

  const handleQualityChange = (newQuality) => {
    if (videoRef.current) {
      restoringTimeRef.current = videoRef.current.currentTime;
      wasPlayingRef.current = !videoRef.current.paused;
    }
    setQuality(newQuality);
    setShowSettings(false);
    // Reset retry counter so quality switches don't false-positive as expired
    retryCountRef.current = 0;

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
      }
    }, 50);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettings(false);
  };

  const handleSubtitleChange = (code) => {
    setActiveSubtitle(code);
    setShowSubtitlesMenu(false);
    if (code === 'off') { setParsedCues([]); setCurrentCue(null); }
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

  // Movie not found / error — only redirect on GraphQL "not found",
  // not on transient network blips
  if (movieQueryError) {
    const isNetworkError = !!movieQueryError.networkError;
    const isGraphQLNotFound = movieQueryError.graphQLErrors?.some(
      e => e.extensions?.code === 'NOT_FOUND' || e.message?.includes('not found')
    );
    if (!isNetworkError || isGraphQLNotFound) {
      router.replace('/404');
      return null;
    }
  }
  if (!loading && actualId && movieData && !movie) {
    router.replace('/404');
    return null;
  }

  return (
    <>
      <Head>
        <title>{movie?.title ? `Watch ${movie.title}` : 'Watch'} - clipX</title>
        {/* OG / social share meta */}
        {movie && (
          <>
            <meta property="og:title" content={`Watch ${movie.title} - clipX`} />
            <meta property="og:description" content={movie.overview || movie.description || `Stream ${movie.title} on clipX`} />
            <meta property="og:image" content={movie.backdropPath || movie.posterPath} />
            <meta property="og:type" content="video.movie" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={`Watch ${movie.title}`} />
            <meta name="twitter:image" content={movie.backdropPath || movie.posterPath} />
          </>
        )}
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
          src={streamingUrl && /^https?:\/\/.+/.test(streamingUrl) ? streamingUrl : null}
          className={`w-full h-full ${videoFit === 'contain' ? 'object-contain' :
            videoFit === 'cover' ? 'object-cover' :
              videoFit === 'fill' ? 'object-fill' :
                'object-contain'
            }`}
          style={videoFit === '16:9' ? { aspectRatio: '16/9', objectFit: 'contain' } : videoFit === '4:3' ? { aspectRatio: '4/3', objectFit: 'contain' } : undefined}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleStreamReady}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onEnded={() => setIsPlaying(false)}
          playsInline
          style={{ filter: `brightness(${brightness})` }}
          referrerPolicy="no-referrer"
        >
          {/* No native <track> elements — we use a custom overlay below */}
        </video>

        {/* Custom Subtitle Overlay */}
        {currentCue && (
          <div className="absolute bottom-24 left-0 right-0 flex justify-center px-8 pointer-events-none z-20">
            <div
              style={{
                background: 'rgba(0,0,0,0.75)',
                color: '#fff',
                fontSize: 'clamp(14px, 2.5vw, 22px)',
                padding: '6px 16px',
                borderRadius: '6px',
                textAlign: 'center',
                maxWidth: '80%',
                lineHeight: 1.5,
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                whiteSpace: 'pre-line',
              }}
            >
              {/* Render subtitle text safely — no dangerouslySetInnerHTML */}
              {currentCue.replace(/<[^>]+>/g, '')}
            </div>
          </div>
        )}

        {/* Cover Image — shown before stream loads */}
        {!streamingUrl && movie?.posterPath && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={movie.backdropPath || movie.posterPath}
              alt={movie.title}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
            <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
              <img
                src={movie.posterPath}
                alt={movie.title}
                className="w-36 h-52 md:w-48 md:h-72 rounded-2xl shadow-2xl object-cover ring-2 ring-white/10"
              />
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{movie.title}</h2>
                {movie.releaseDate && <p className="text-gray-400 mt-1">{String(movie.releaseDate).slice(0, 4)}</p>}
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span>Preparing stream&hellip;</span>
              </div>
            </div>
          </div>
        )}

        {/* Resume Playback Banner */}
        <AnimatePresence>
          {resumePrompt && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-2xl"
            >
              <div className="text-white">
                <p className="text-sm text-gray-400 font-medium">Resume watching</p>
                <p className="text-white font-bold">
                  {Math.floor(resumePrompt.currentTime / 60)}m {resumePrompt.currentTime % 60}s left
                </p>
              </div>
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = resumePrompt.currentTime;
                    hasSeekedRef.current = true;
                  }
                  setResumePrompt(null);
                }}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-colors text-sm"
              >
                Resume
              </button>
              <button
                onClick={() => { setResumePrompt(null); hasSeekedRef.current = true; }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm"
              >
                Start over
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Offline Banner */}
        <AnimatePresence>
          {!isOnline && !streamError && (
            <motion.div
              initial={{ opacity: 0, y: -48 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -48 }}
              className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 py-3 bg-yellow-500/90 backdrop-blur-sm text-black font-semibold text-sm"
            >
              <FiWifiOff className="w-4 h-4 flex-shrink-0" />
              You&rsquo;re offline &mdash; playback may stop
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rotate-to-Landscape prompt (mobile portrait only) */}
        <AnimatePresence>
          {showRotatePrompt && !streamError && (
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-black/85 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 shadow-2xl"
            >
              {/* Rotation icon using a rotated rectangle */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(90 12 12)" />
                <path d="M9 1v3M15 1v3" strokeLinecap="round" />
              </svg>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Rotate for best experience</p>
                <p className="text-gray-400 text-xs">Turn your phone sideways</p>
              </div>
              <button
                onClick={requestLandscape}
                className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0"
              >
                Rotate
              </button>
              <button
                onClick={() => setShowRotatePrompt(false)}
                className="text-gray-500 hover:text-white transition-colors text-lg leading-none flex-shrink-0"
                aria-label="Dismiss"
              >×</button>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Stream Error Overlay */}
        <AnimatePresence>
          {streamError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm px-8 text-center"
            >
              {/* Backgrounded poster blur */}
              {movie?.backdropPath && (
                <img
                  src={movie.backdropPath}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover opacity-10 blur-xl scale-105 pointer-events-none"
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-5 max-w-md">
                {/* Icon — changes by error type */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${streamError.type === 'expired' ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' :
                  streamError.type === 'offline' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' :
                    streamError.type === 'network' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' :
                      streamError.type === 'decode' ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' :
                        streamError.type === 'not_found' ? 'border-gray-500/50  bg-gray-500/10  text-gray-400' :
                          'border-red-500/50   bg-red-500/10   text-red-400'
                  }`}>
                  {streamError.type === 'offline' || streamError.type === 'network' ? (
                    <FiWifiOff className="w-9 h-9" />
                  ) : streamError.type === 'expired' ? (
                    <FiRefreshCw className={`w-9 h-9 ${streamRetrying ? 'animate-spin' : ''}`} />
                  ) : (
                    <FiAlertTriangle className="w-9 h-9" />
                  )}
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">
                    {streamError.type === 'expired' ? 'Stream link expired' :
                      streamError.type === 'offline' ? 'You\u2019re offline' :
                        streamError.type === 'network' ? 'Connection issue' :
                          streamError.type === 'decode' ? 'Format not supported' :
                            streamError.type === 'not_found' ? 'Content unavailable' :
                              streamError.type === 'forbidden' ? 'Access denied' :
                                'Playback error'}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed">{streamError.message}</p>
                </div>

                {/* Retry countdown */}
                {streamRetrying && retryCountdown > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-sm text-gray-300">
                    <div className="w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    Retrying in {retryCountdown}s&hellip;
                  </div>
                )}
                {streamRetrying && retryCountdown === 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-sm text-gray-300">
                    <div className="w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    Refreshing stream&hellip;
                  </div>
                )}

                {/* Action buttons */}
                {!streamRetrying && (
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    {(streamError.type !== 'not_found' && streamError.type !== 'forbidden') && (
                      <button
                        onClick={() => {
                          retryCountRef.current = 0;
                          fetchStreamData();
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all text-sm"
                      >
                        <FiRefreshCw className="w-4 h-4" />
                        Try again
                      </button>
                    )}
                    <Link
                      href={`/movies/${id}`}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      Back to movie
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && streamingUrl && !streamError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Volume OSD — appears briefly on keyboard volume change */}
        <AnimatePresence>
          {volumeOSD && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center gap-2 bg-black/70 backdrop-blur-xl rounded-2xl px-8 py-5 border border-white/10 shadow-2xl"
            >
              {isMuted || volume === 0 ? (
                <FiVolumeX className="w-8 h-8 text-white" />
              ) : (
                <FiVolume2 className="w-8 h-8 text-white" />
              )}
              <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-150"
                  style={{ width: `${Math.round((isMuted ? 0 : volume) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-300 tabular-nums">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
            </motion.div>
          )}
        </AnimatePresence>

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
              <div className="bg-gradient-to-b from-black/80 to-transparent px-6 py-8 transition-opacity">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/movies/${id}`}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-primary-600 backdrop-blur-md text-white transition-all shadow-lg border border-white/10"
                    >
                      <FiChevronLeft className="w-7 h-7 -ml-1" />
                    </Link>
                    <div>
                      <h1 className="text-white font-bold text-xl md:text-2xl drop-shadow-md tracking-tight">
                        {movie?.title} {season && (movie?.isSeries || movie?.type?.toLowerCase() === 'series' || movie?.type?.toLowerCase() === 'tv') ? `(S${season} E${episode})` : ''}
                      </h1>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-white/20 backdrop-blur-md text-white transition-all border border-white/10 hidden sm:flex">
                      <FiDownload className="w-5 h-5" />
                    </button>
                    {/* Aspect Ratio badge */}
                    {/* {aspectRatio && (
                      <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-gray-300 text-xs font-mono font-bold tracking-widest">
                        {aspectRatio}
                      </div>
                    )} */}
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
              <div className="bg-gradient-to-t from-black/90 via-black/40 to-transparent px-6 py-6 pb-8">
                {/* Progress Bar */}
                <div
                  ref={progressRef}
                  className="relative h-1.5 rounded-full mb-6 cursor-pointer group bg-white/20 hover:h-2.5 transition-all duration-200"
                  onClick={handleProgressClick}
                >
                  {/* Buffered */}
                  <div
                    className="absolute h-full bg-white/40 rounded-full"
                    style={{ width: `${buffered}%` }}
                  />
                  {/* Progress */}
                  <div
                    className="absolute h-full bg-primary-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  {/* Scrubber */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all shadow-lg"
                    style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
                  />
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-5 sm:gap-8">
                    {/* Play/Pause */}
                    <button onClick={togglePlay} className="hover:text-primary-400 hover:scale-110 transition-transform">
                      {isPlaying ? <FiPause className="w-7 h-7" /> : <FiPlay className="w-7 h-7" />}
                    </button>

                    {/* Skip Buttons */}
                    <button onClick={() => skip(-10)} className="hover:text-primary-400 hover:scale-110 transition-transform">
                      <FiSkipBack className="w-6 h-6" />
                    </button>
                    <button onClick={() => skip(10)} className="hover:text-primary-400 hover:scale-110 transition-transform">
                      <FiSkipForward className="w-6 h-6" />
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-2 group hidden sm:flex">
                      <button onClick={toggleMute} className="hover:text-primary-400 transition-colors">
                        {isMuted || volume === 0 ? <FiVolumeX className="w-6 h-6" /> : <FiVolume2 className="w-6 h-6" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setVolume(v);
                          setIsMuted(v === 0);
                          if (videoRef.current) videoRef.current.volume = v;
                          try { localStorage.setItem('clipx_volume', String(v)); } catch { }
                        }}
                        className="w-20 accent-primary-500 cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-gray-400 w-7 text-right tabular-nums">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                    </div>

                    {/* Brightness */}
                    <div className="flex items-center gap-3 group hidden md:flex">
                      <FiSun className="w-6 h-6 hover:text-yellow-400 transition-colors cursor-pointer" />
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={brightness}
                        onChange={(e) => setBrightness(parseFloat(e.target.value))}
                        className="w-0 opacity-0 group-hover:w-20 group-hover:opacity-100 transition-all duration-300 accent-yellow-400 cursor-pointer"
                      />
                    </div>

                    {/* Time */}
                    <span className="text-sm font-medium opacity-90 tracking-wide font-mono">
                      {formatTime(currentTime)} <span className="text-white/50 mx-1">/</span> {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-5">
                    {/* Subtitles Menu */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowSubtitlesMenu(!showSubtitlesMenu);
                          setShowSettings(false);
                        }}
                        className={`hover:text-primary-400 hover:scale-110 transition-transform ${activeSubtitle !== 'off' ? 'text-primary-500' : 'text-white'}`}
                      >
                        <FiMessageSquare className="w-6 h-6" />
                      </button>

                      {showSubtitlesMenu && (
                        <div className="absolute bottom-full right-0 mb-4 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 py-2">
                          <div className="px-3 py-2">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Subtitles</p>
                            <button
                              onClick={() => handleSubtitleChange('off')}
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${activeSubtitle === 'off' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                            >
                              Off
                            </button>
                            {subtitles.map((sub, idx) => {
                              const key = sub.code || sub.lang || `sub-${idx}`;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleSubtitleChange(key)}
                                  className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${activeSubtitle === key
                                    ? 'bg-primary-500/20 text-primary-400'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white truncate'
                                    }`}
                                >
                                  {sub.lang || sub.code || `Subtitle ${idx + 1}`}
                                </button>
                              );
                            })}

                            <div className="w-full h-px bg-white/10 my-2" />

                            {/* Upload Subtitle */}
                            <input
                              type="file"
                              ref={subtitleInputRef}
                              onChange={handleLocalSubtitleUpload}
                              className="hidden"
                              accept=".vtt,.srt"
                            />
                            <button
                              onClick={() => subtitleInputRef.current?.click()}
                              className="w-full text-left px-3 py-2 text-sm rounded-lg font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              + Add Subtitle File
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Settings */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowSettings(!showSettings);
                          setShowSubtitlesMenu(false);
                        }}
                        className="hover:text-primary-400 hover:rotate-90 transition-all duration-300"
                      >
                        <FiSettings className="w-6 h-6" />
                      </button>

                      {showSettings && (
                        <div className="absolute bottom-full right-0 mb-4 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 py-2">
                          <div className="px-3 py-2">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Video Quality</p>
                            {['auto', '1080', '720', '480', '360'].map((q) => {
                              // Only show qualities we actually have if streamDataFetch is populated
                              if (q !== 'auto' && availableLinks.length > 0 && !availableLinks.some(l => l.quality.includes(q))) {
                                return null;
                              }
                              return (
                                <button
                                  key={q}
                                  onClick={() => handleQualityChange(q)}
                                  className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${quality === q ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                  {q === 'auto' ? 'Auto Dynamic' : `${q}p High Definition`}
                                </button>
                              )
                            })}
                          </div>

                          <div className="w-full h-px bg-white/10 my-1" />

                          <div className="px-3 py-2">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Playback Speed</p>
                            <div className="grid grid-cols-3 gap-1">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                                <button
                                  key={speed}
                                  onClick={() => handleSpeedChange(speed)}
                                  className={`text-center py-2 text-xs rounded-lg font-bold transition-colors ${playbackRate === speed ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                  {speed}x
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="w-full h-px bg-white/10 my-1" />

                          {/* Aspect Ratio / Fit Mode */}
                          <div className="px-3 py-2">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Aspect Ratio</p>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { key: 'contain', label: 'Fit' },
                                { key: 'cover', label: 'Fill' },
                                { key: '16:9', label: '16:9' },
                                { key: '4:3', label: '4:3' },
                                { key: 'fill', label: 'Stretch' },
                              ].map((opt) => (
                                <button
                                  key={opt.key}
                                  onClick={() => { setVideoFit(opt.key); setShowSettings(false); }}
                                  className={`text-center py-2 text-xs rounded-lg font-bold transition-colors ${videoFit === opt.key ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fullscreen */}
                    <button onClick={toggleFullscreen} className="hover:text-primary-400 hover:scale-110 transition-transform">
                      {isFullscreen ? <FiMinimize className="w-6 h-6" /> : <FiMaximize className="w-6 h-6" />}
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