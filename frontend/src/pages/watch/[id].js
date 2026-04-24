/**
 * Watch Page — Video Streaming Player

 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize,
  FiSkipBack, FiSkipForward, FiSettings, FiChevronLeft, FiDownload,
  FiShare2, FiMessageSquare, FiSun,
  FiAlertTriangle, FiRefreshCw, FiWifiOff
} from 'react-icons/fi';

import { useAuth } from '@/contexts/AuthContext';
import { GET_MOVIE } from '@/graphql/queries/movieQueries';
import { RECORD_WATCH_PROGRESS } from '@/graphql/mutations/interactionMutations';
import { GET_WATCH_HISTORY } from '@/graphql/queries/userQueries';
import apolloClient from '@/graphql/client';
import { fromSlug } from '@/utils/slug';
import SkipIntro from '@/components/player/SkipIntro';
import PlayerSettingsPanel from '@/components/player/PlayerSettingsPanel';

// ═══════════════════════════════════════════════════════════
// Helper: format seconds → "H:MM:SS" or "M:SS"
// ═══════════════════════════════════════════════════════════
function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════
// Helper: Parse SRT / VTT text → cue array
// ═══════════════════════════════════════════════════════════
function parseSRT(text) {
  const cues = [];
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const blocks = clean.split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    const timeIdx = lines.findIndex(l => l.includes('-->'));
    if (timeIdx === -1) continue;
    const [startStr, endStr] = lines[timeIdx].split('-->').map(s => s.trim().split(' ')[0]);
    const toSec = (t) => {
      const normalised = t.replace(',', '.');
      const parts = normalised.split(':');
      if (parts.length === 3) return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    };
    const cueText = lines.slice(timeIdx + 1).join('\n').replace(/<[^>]+>/g, '').trim();
    if (cueText && startStr && endStr) {
      cues.push({ start: toSec(startStr), end: toSec(endStr), text: cueText });
    }
  }
  return cues;
}

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════
export default function WatchPage() {
  const router = useRouter();
  const { id, s, e } = router.query;
  const { user, isAuthenticated } = useAuth();

  const season = s ? parseInt(s) : null;
  const episode = e ? parseInt(e) : null;
  const actualId = fromSlug(id);

  // ─── Refs ───────────────────────────────────────────────
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const inactivityTimer = useRef(null);
  const subtitleInputRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const autoplayTimerRef = useRef(null);
  const resumeAutoSeekTimer = useRef(null);
  const volumeOSDTimer = useRef(null);
  const movieDataRef = useRef(null);
  const hasSeekedRef = useRef(false);
  const restoringTimeRef = useRef(null);
  const wasPlayingRef = useRef(false);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);

  // ─── Player State ──────────────────────────────────────
  const [isMounted, setIsMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [isLoading, setIsLoading] = useState(true);
  const [brightness, setBrightness] = useState(1);
  const [videoFit, setVideoFit] = useState('contain');

  // ─── Stream State ──────────────────────────────────────
  const [streamData, setStreamData] = useState(null);
  const [streamError, setStreamError] = useState(null);
  const [streamRetrying, setStreamRetrying] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);

  // ─── Subtitle State ────────────────────────────────────
  const [activeSubtitle, setActiveSubtitle] = useState('off');
  const [parsedCues, setParsedCues] = useState([]);
  const [currentCue, setCurrentCue] = useState(null);
  const [localSubtitles, setLocalSubtitles] = useState([]);

  // ─── UI Overlays ───────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [volumeOSD, setVolumeOSD] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // ─── Ambient Mode ──────────────────────────────────────
  const [ambientMode, setAmbientMode] = useState(false);
  const [ambientColor, setAmbientColor] = useState('rgba(0,0,0,0)');

  // ─── Playback Stats ────────────────────────────────────
  const [showPlaybackStats, setShowPlaybackStats] = useState(false);
  const [playbackStats, setPlaybackStats] = useState({
    resolution: '', droppedFrames: 0, totalFrames: 0, bufferHealth: 0
  });

  // ─── Next Episode Autoplay ─────────────────────────────
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState(10);

  // ─── Mobile ────────────────────────────────────────────
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);

  // ── PiP availability (SSR-safe) ────────────────────────
  const [pipEnabled, setPipEnabled] = useState(false);

  // ═══════════════════════════════════════════════════════
  // Mount guard + SSR-safe checks
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    setIsMounted(true);
    setPipEnabled(typeof document !== 'undefined' && !!document.pictureInPictureEnabled);
  }, []);

  // ═══════════════════════════════════════════════════════
  // GraphQL: Movie metadata
  // ═══════════════════════════════════════════════════════
  const { data: movieQueryData, loading: movieLoading, error: movieQueryError } = useQuery(GET_MOVIE, {
    variables: { id: actualId },
    skip: !actualId,
  });
  const movie = movieQueryData?.movie;
  useEffect(() => { movieDataRef.current = movieQueryData; }, [movieQueryData]);

  // ═══════════════════════════════════════════════════════
  // REST: Stream data (links + subtitles)
  // ═══════════════════════════════════════════════════════
  const fetchStreamData = useCallback(async () => {
    if (!actualId) return;
    setStreamError(null);
    setStreamRetrying(true);

    const url = `/api/movie/${actualId}/stream?season=${season || 0}&episode=${episode || 1}&bust=${Date.now()}`;

    try {
      let res = await fetch(url, { credentials: 'include' });

      // If 401 — try silent token refresh then retry once
      if (res.status === 401) {
        try {
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
          if (refreshRes.ok) {
            res = await fetch(url, { credentials: 'include' });
          }
        } catch { /* refresh failed */ }
      }

      if (res.status === 404) throw Object.assign(new Error('Content not found'), { type: 'not_found' });
      if (res.status === 401) throw Object.assign(new Error('You must be logged in to stream content.'), { type: 'auth' });
      if (res.status === 403) throw Object.assign(new Error('Access denied'), { type: 'forbidden' });
      if (res.status === 410) throw Object.assign(new Error('Stream link has expired'), { type: 'expired' });
      if (!res.ok) throw Object.assign(new Error(`Server error (${res.status})`), { type: 'server' });

      const data = await res.json();
      setStreamData(data);
      setStreamRetrying(false);
      retryCountRef.current = 0;
    } catch (err) {
      setStreamRetrying(false);
      if (!navigator.onLine) {
        setStreamError({ type: 'offline', message: "You're offline. Connect to the internet to stream." });
      } else {
        setStreamError({ type: err.type || 'network', message: err.message || 'Could not load stream.' });
      }
    }
  }, [actualId, season, episode]);

  useEffect(() => { fetchStreamData(); }, [fetchStreamData]);

  // ═══════════════════════════════════════════════════════
  // Resolve streaming URL from available links + quality
  // ═══════════════════════════════════════════════════════
  const availableLinks = streamData?.links || [];
  const selectedLink = selectedQuality === 'auto'
    ? availableLinks[0]
    : availableLinks.find(l => l.quality?.includes(selectedQuality)) || availableLinks[0];
  const streamingUrl = selectedLink?.url || null;

  // ═══════════════════════════════════════════════════════
  // Subtitles (stable reference)
  // ═══════════════════════════════════════════════════════
  const subtitles = useMemo(
    () => [...(streamData?.subtitles || []), ...localSubtitles],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(streamData?.subtitles), localSubtitles]
  );

  // Auto-enable English subtitle when subtitles load
  useEffect(() => {
    if (subtitles.length > 0 && activeSubtitle === 'off') {
      const engIdx = subtitles.findIndex((s) => {
        const lang = (s.lang || '').toLowerCase();
        const code = (s.code || '').toLowerCase();
        return lang.includes('english') || lang === 'eng' || code.includes('english') || code === 'eng' || code === 'en';
      });
      const targetIdx = engIdx !== -1 ? engIdx : 0;
      const target = subtitles[targetIdx];
      const key = target.code || target.lang || `sub-${targetIdx}`;
      setActiveSubtitle(key);
    }
  }, [subtitles, activeSubtitle]);

  // Fetch & parse SRT when active subtitle changes
  useEffect(() => {
    if (activeSubtitle === 'off' || !activeSubtitle) {
      setParsedCues([]);
      setCurrentCue(null);
      return;
    }
    const sub = subtitles.find((s, idx) => {
      const key = s.code || s.lang || `sub-${idx}`;
      return key === activeSubtitle;
    });
    if (!sub?.url) return;

    setParsedCues([]);
    setCurrentCue(null);
    fetch(sub.url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(text => setParsedCues(parseSRT(text)))
      .catch(err => console.warn('Subtitle fetch failed:', err));
  }, [activeSubtitle, subtitles]);

  // Update current cue based on playback time
  useEffect(() => {
    if (!parsedCues.length) { setCurrentCue(null); return; }
    const cue = parsedCues.find(c => currentTime >= c.start && currentTime <= c.end);
    setCurrentCue(cue?.text || null);
  }, [currentTime, parsedCues]);

  // ═══════════════════════════════════════════════════════
  // Subtitle handlers
  // ═══════════════════════════════════════════════════════
  const handleSubtitleChange = useCallback((code) => {
    setActiveSubtitle(code);
    setShowSubtitlesMenu(false);
    if (code === 'off') { setParsedCues([]); setCurrentCue(null); }
  }, []);

  const handleLocalSubtitleUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newSub = { lang: file.name, code: `local-${Date.now()}`, url };
    setLocalSubtitles(prev => [...prev, newSub]);
    handleSubtitleChange(newSub.code);
  }, [handleSubtitleChange]);

  // ═══════════════════════════════════════════════════════
  // Network connectivity
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  // ═══════════════════════════════════════════════════════
  // Volume: restore from localStorage
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    try {
      const saved = localStorage.getItem('clipx_volume');
      if (saved !== null) {
        const v = parseFloat(saved);
        if (!isNaN(v) && v >= 0 && v <= 2) {
          setVolume(v);
          setIsMuted(v === 0);
        }
      }
    } catch { }
  }, []);

  // ═══════════════════════════════════════════════════════
  // Auto-quality from bandwidth
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (selectedQuality !== 'auto') return;
    try {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!conn) return;
      const downlink = conn.downlink;
      if (downlink >= 5) setSelectedQuality('1080');
      else if (downlink >= 2) setSelectedQuality('720');
      else if (downlink >= 0.5) setSelectedQuality('480');
      else setSelectedQuality('360');
    } catch { }
  }, []);

  // ═══════════════════════════════════════════════════════
  // Video event handlers
  // ═══════════════════════════════════════════════════════
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    const buffEnd = v.buffered.length > 0 ? v.buffered.end(v.buffered.length - 1) : 0;
    setBuffered(v.duration > 0 ? (buffEnd / v.duration) * 100 : 0);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setIsLoading(false);
    setStreamError(null);
    retryCountRef.current = 0;

    // Restore position after quality switch
    if (restoringTimeRef.current !== null) {
      v.currentTime = restoringTimeRef.current;
      if (wasPlayingRef.current) { v.play().catch(() => {}); setIsPlaying(true); }
      restoringTimeRef.current = null;
    }
  }, []);

  const handleVideoError = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const err = v.error;
    const code = err?.code || 0;

    const RETRYABLE = new Set([2, 4]); // MEDIA_ERR_NETWORK, MEDIA_ERR_SRC_NOT_SUPPORTED
    if (RETRYABLE.has(code) && retryCountRef.current < 3) {
      retryCountRef.current += 1;
      setStreamRetrying(true);
      setStreamError({
        type: code === 4 ? 'expired' : 'network',
        code,
        message: code === 4
          ? `Stream link expired. Refreshing… (attempt ${retryCountRef.current}/3)`
          : `Network hiccup. Retrying… (attempt ${retryCountRef.current}/3)`,
      });

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
      const msgs = {
        1: { type: 'aborted', msg: 'Playback was aborted.' },
        2: { type: 'network', msg: !navigator.onLine ? 'You appear to be offline.' : 'Network error — check your connection.' },
        3: { type: 'decode', msg: 'Video format not supported. Try a different quality.' },
        4: { type: 'expired', msg: 'Stream link is unavailable or has expired.' },
      };
      const mapped = msgs[code] || { type: 'unknown', msg: 'An unknown playback error occurred.' };
      setStreamError({ type: mapped.type, code, message: mapped.msg });
      setStreamRetrying(false);
    }
  }, [fetchStreamData]);

  // ═══════════════════════════════════════════════════════
  // Playback controls
  // ═══════════════════════════════════════════════════════
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch { }
  }, []);

  const skip = useCallback((seconds) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + seconds));
  }, []);

  // ─── Audio amplification (for >100% volume) ───────────
  const ensureAudioAmplification = useCallback(() => {
    if (audioContextRef.current || !videoRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaElementSource(videoRef.current);
      const gain = ctx.createGain();
      source.connect(gain);
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;
      if (ctx.state === 'suspended') ctx.resume();
    } catch { }
  }, []);

  const adjustVolume = useCallback((delta) => {
    setVolume(prev => {
      const v = Math.max(0, Math.min(2, prev + delta));
      if (v > 1) ensureAudioAmplification();
      if (videoRef.current) {
        if (gainNodeRef.current) { gainNodeRef.current.gain.value = v; videoRef.current.volume = 1; }
        else { videoRef.current.volume = Math.min(1, v); }
      }
      try { localStorage.setItem('clipx_volume', String(v)); } catch { }
      setVolumeOSD(true);
      clearTimeout(volumeOSDTimer.current);
      volumeOSDTimer.current = setTimeout(() => setVolumeOSD(false), 1200);
      return v;
    });
  }, [ensureAudioAmplification]);

  const handleVolumeSlider = useCallback((e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
    if (v > 1) ensureAudioAmplification();
    if (videoRef.current) {
      if (gainNodeRef.current) { gainNodeRef.current.gain.value = v; videoRef.current.volume = 1; }
      else { videoRef.current.volume = Math.min(1, v); }
    }
    try { localStorage.setItem('clipx_volume', String(v)); } catch { }
  }, [ensureAudioAmplification]);

  // ═══════════════════════════════════════════════════════
  // Quality & Speed changes
  // ═══════════════════════════════════════════════════════
  const handleQualityChange = useCallback((q) => {
    if (videoRef.current) {
      restoringTimeRef.current = videoRef.current.currentTime;
      wasPlayingRef.current = !videoRef.current.paused;
    }
    setSelectedQuality(q);
    setShowSettings(false);
    retryCountRef.current = 0;
    setTimeout(() => { videoRef.current?.load(); }, 50);
  }, []);

  const handleSpeedChange = useCallback((speed) => {
    setPlaybackRate(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setShowSettings(false);
  }, []);

  // ═══════════════════════════════════════════════════════
  // Auto-hide controls on inactivity
  // ═══════════════════════════════════════════════════════
  const resetInactivityTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(inactivityTimer.current);
    if (isPlaying) {
      inactivityTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetInactivityTimer();
    return () => clearTimeout(inactivityTimer.current);
  }, [isPlaying, resetInactivityTimer]);

  // ═══════════════════════════════════════════════════════
  // Next episode / autoplay
  // ═══════════════════════════════════════════════════════
  const isSeries = movie?.seasons?.length > 0 || movie?.type?.toLowerCase() === 'series' || movie?.type?.toLowerCase() === 'tv';

  const nextEpisodeInfo = useMemo(() => {
    if (!isSeries || !season || !movie?.seasons) return null;
    const curSeason = movie.seasons.find(s => s.seasonNumber === season);
    if (!curSeason) return null;
    const eps = curSeason.episodes || [];
    const curIdx = eps.findIndex(ep => ep.episodeNumber === episode);

    if (curIdx >= 0 && curIdx < eps.length - 1) {
      const next = eps[curIdx + 1];
      return { season, episode: next.episodeNumber, title: next.title || `Episode ${next.episodeNumber}` };
    }
    const nextSeason = movie.seasons.find(s => s.seasonNumber === season + 1);
    if (nextSeason?.episodes?.length > 0) {
      const first = nextSeason.episodes[0];
      return { season: season + 1, episode: first.episodeNumber, title: first.title || `Episode ${first.episodeNumber}` };
    }
    return null;
  }, [isSeries, season, episode, movie?.seasons]);

  const handleNextEpisode = useCallback(() => {
    if (!nextEpisodeInfo) return;
    clearInterval(autoplayTimerRef.current);
    setShowNextEpisode(false);
    setAutoplayCountdown(10);
    router.push(`/watch/${id}?s=${nextEpisodeInfo.season}&e=${nextEpisodeInfo.episode}`);
  }, [nextEpisodeInfo, id, router]);

  const cancelAutoplay = useCallback(() => {
    clearInterval(autoplayTimerRef.current);
    setShowNextEpisode(false);
    setAutoplayCountdown(10);
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    if (!nextEpisodeInfo) return;
    setShowNextEpisode(true);
    setAutoplayCountdown(10);
    clearInterval(autoplayTimerRef.current);
    autoplayTimerRef.current = setInterval(() => {
      setAutoplayCountdown(prev => {
        if (prev <= 1) { clearInterval(autoplayTimerRef.current); handleNextEpisode(); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [nextEpisodeInfo, handleNextEpisode]);

  // ═══════════════════════════════════════════════════════
  // Watch history: resume playback
  // ═══════════════════════════════════════════════════════
  const HISTORY_KEY = actualId ? `clipx_progress_${actualId}_s${season || 0}_e${episode || 1}` : null;

  const handleStreamReady = useCallback(async () => {
    if (!HISTORY_KEY || hasSeekedRef.current) return;

    // Try server-side progress first
    if (isAuthenticated && actualId) {
      try {
        const { data } = await apolloClient.query({
          query: GET_WATCH_HISTORY,
          variables: { limit: 50 },
          fetchPolicy: 'network-only',
        });
        const match = (data?.watchHistory || []).find(h => h.movieboxId === actualId);
        if (match?.currentTime > 30 && (!match.duration || match.currentTime < match.duration - 60)) {
          setResumePrompt({ currentTime: match.currentTime, duration: match.duration });
          return;
        }
      } catch { }
    }

    // Fallback: localStorage
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || 'null');
      if (saved?.currentTime > 30 && (!saved.duration || saved.currentTime < saved.duration - 60)) {
        setResumePrompt(saved);
      }
    } catch { }
  }, [HISTORY_KEY, isAuthenticated, actualId]);

  // Auto-seek after 3s if user doesn't interact
  useEffect(() => {
    if (!resumePrompt) return;
    resumeAutoSeekTimer.current = setTimeout(() => {
      if (videoRef.current && resumePrompt) {
        videoRef.current.currentTime = resumePrompt.currentTime;
        hasSeekedRef.current = true;
        setResumePrompt(null);
      }
    }, 3000);
    return () => clearTimeout(resumeAutoSeekTimer.current);
  }, [resumePrompt]);

  // Save progress to localStorage every 10s
  useEffect(() => {
    if (!actualId) return;
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.currentTime > 5) {
        const snap = {
          currentTime: Math.floor(videoRef.current.currentTime),
          duration: Math.floor(videoRef.current.duration || 0),
          title: movieDataRef.current?.movie?.title,
          poster: movieDataRef.current?.movie?.posterPath,
          movieId: actualId, season: season || 0, episode: episode || 1,
          savedAt: Date.now(),
        };
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(snap)); } catch { }
        try {
          const list = JSON.parse(localStorage.getItem('clipx_history') || '[]');
          const filtered = list.filter(h => h.movieId !== actualId || h.season !== (season || 0) || h.episode !== (episode || 1));
          filtered.unshift(snap);
          localStorage.setItem('clipx_history', JSON.stringify(filtered.slice(0, 50)));
        } catch { }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [actualId, season, episode, HISTORY_KEY]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.currentTime > 5 && HISTORY_KEY) {
        const snap = {
          currentTime: Math.floor(videoRef.current.currentTime),
          duration: Math.floor(videoRef.current.duration || 0),
          movieId: actualId, season: season || 0, episode: episode || 1, savedAt: Date.now(),
        };
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(snap)); } catch { }
      }
    };
  }, [HISTORY_KEY, actualId, season, episode]);

  // GraphQL progress sync every 30s
  const [recordProgress] = useMutation(RECORD_WATCH_PROGRESS);
  useEffect(() => {
    if (!isAuthenticated || !actualId) return;
    const interval = setInterval(() => {
      if (currentTime > 0) {
        recordProgress({
          variables: { movieId: actualId, currentTime: Math.floor(currentTime), duration: Math.floor(duration) },
        }).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [actualId, currentTime, duration, isAuthenticated, recordProgress]);

  // ═══════════════════════════════════════════════════════
  // Ambient mode: sample video frame color
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!ambientMode || !videoRef.current) { setAmbientColor('rgba(0,0,0,0)'); return; }
    const canvas = document.createElement('canvas');
    canvas.width = 8; canvas.height = 8;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const interval = setInterval(() => {
      try {
        const v = videoRef.current;
        if (!v || v.paused || !ctx) return;
        ctx.drawImage(v, 0, 0, 8, 8);
        const data = ctx.getImageData(0, 0, 8, 8).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; count++; }
        r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
        setAmbientColor(`rgba(${r},${g},${b},0.6)`);
      } catch { }
    }, 200);

    return () => { clearInterval(interval); canvas.width = 0; canvas.height = 0; };
  }, [ambientMode]);

  // ═══════════════════════════════════════════════════════
  // Playback stats polling
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!showPlaybackStats) return;
    const interval = setInterval(() => {
      const v = videoRef.current;
      if (!v) return;
      const q = v.getVideoPlaybackQuality?.();
      const buffEnd = v.buffered?.length > 0 ? v.buffered.end(v.buffered.length - 1) : 0;
      setPlaybackStats({
        resolution: `${v.videoWidth}x${v.videoHeight}`,
        droppedFrames: q?.droppedVideoFrames || 0,
        totalFrames: q?.totalVideoFrames || 0,
        bufferHealth: Math.max(0, buffEnd - v.currentTime).toFixed(1),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showPlaybackStats]);

  // ═══════════════════════════════════════════════════════
  // Mobile portrait → landscape prompt
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const isTouchDevice = () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const check = () => {
      if (!isTouchDevice()) return;
      const portrait = window.matchMedia('(orientation: portrait)').matches;
      if (portrait && isPlaying) setShowRotatePrompt(true);
      else setShowRotatePrompt(false);
    };
    check();
    const mq = window.matchMedia('(orientation: portrait)');
    mq.addEventListener('change', check);
    return () => mq.removeEventListener('change', check);
  }, [isPlaying]);

  const requestLandscape = useCallback(async () => {
    try {
      if (screen.orientation?.lock) await screen.orientation.lock('landscape');
      else if (containerRef.current?.requestFullscreen) await containerRef.current.requestFullscreen();
      setShowRotatePrompt(false);
    } catch { }
  }, []);

  // ═══════════════════════════════════════════════════════
  // Keyboard shortcuts
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key.toLowerCase()) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'f': toggleFullscreen(); break;
        case 'm': toggleMute(); break;
        case 'arrowleft': skip(-10); break;
        case 'arrowright': skip(10); break;
        case 'arrowup':
          e.preventDefault();
          if (e.shiftKey) setBrightness(p => Math.min(1.5, p + 0.1));
          else adjustVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          if (e.shiftKey) setBrightness(p => Math.max(0.5, p - 0.1));
          else adjustVolume(-0.1);
          break;
        case '?': setShowShortcuts(p => !p); break;
        case 'a': setAmbientMode(p => !p); break;
        case 'd': setShowPlaybackStats(p => !p); break;
        case 'escape': if (showShortcuts) { setShowShortcuts(false); e.preventDefault(); } break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, toggleFullscreen, toggleMute, skip, adjustVolume, showShortcuts]);

  // ═══════════════════════════════════════════════════════
  // Progress bar click
  // ═══════════════════════════════════════════════════════
  const handleProgressClick = useCallback((e) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = percent * duration;
  }, [duration]);

  // Share handler
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = movie?.title ? `Watch ${movie.title} on clipX` : 'Watch on clipX';
    if (navigator.share) { try { await navigator.share({ title, url }); } catch { } }
    else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }, [movie?.title]);

  // ═══════════════════════════════════════════════════════
  // Cleanup all timers on unmount
  // ═══════════════════════════════════════════════════════
  useEffect(() => () => {
    clearInterval(retryTimerRef.current);
    clearInterval(autoplayTimerRef.current);
    clearTimeout(resumeAutoSeekTimer.current);
    clearTimeout(volumeOSDTimer.current);
    clearTimeout(inactivityTimer.current);
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch { } }
  }, []);

  // ═══════════════════════════════════════════════════════
  // Render gates
  // ═══════════════════════════════════════════════════════
  if (!isMounted || movieLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <div className="relative w-full flex-1 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full border-4 border-primary-500/30 border-t-primary-500 animate-spin" />
            <p className="text-gray-500 text-sm font-medium animate-pulse">Preparing stream…</p>
          </div>
        </div>
      </div>
    );
  }

  if (movieQueryError) {
    const isGraphQLNotFound = movieQueryError.graphQLErrors?.some(
      e => e.extensions?.code === 'NOT_FOUND' || e.message?.includes('not found')
    );
    if (isGraphQLNotFound || !movieQueryError.networkError) {
      router.replace('/404');
      return null;
    }
  }
  if (!movieLoading && actualId && movieQueryData && !movie) {
    router.replace('/404');
    return null;
  }

  // Computed values for render
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const seriesLabel = season && isSeries ? `(S${season} E${episode})` : '';

  // ═══════════════════════════════════════════════════════
  // JSX
  // ═══════════════════════════════════════════════════════
  return (
    <>
      <Head>
        <title>{movie?.title ? `Watch ${movie.title}` : 'Watch'} - clipX</title>
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
        className="relative w-full h-screen bg-black overflow-hidden"
        onMouseMove={resetInactivityTimer}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* ── Ambient Glow ────────────────────────────────── */}
        {ambientMode && (
          <div
            className="absolute inset-[-80px] pointer-events-none z-0 transition-colors duration-500"
            style={{ background: ambientColor, filter: 'blur(120px)', opacity: 0.7 }}
          />
        )}

        {/* ── Video Element ───────────────────────────────── */}
        <video
          ref={videoRef}
          crossOrigin="anonymous"
          src={streamingUrl && /^https?:\/\/.+/.test(streamingUrl) ? streamingUrl : undefined}
          className={`w-full h-full ${
            videoFit === 'contain' ? 'object-contain' :
            videoFit === 'cover' ? 'object-cover' :
            videoFit === 'fill' ? 'object-fill' : 'object-contain'
          }`}
          style={{
            filter: `brightness(${brightness})`,
            ...(videoFit === '16:9' ? { aspectRatio: '16/9', objectFit: 'contain' } :
              videoFit === '4:3' ? { aspectRatio: '4/3', objectFit: 'contain' } : {})
          }}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleStreamReady}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          playsInline
          referrerPolicy="no-referrer"
        />

        {/* ── Subtitle Overlay ────────────────────────────── */}
        {currentCue && (
          <div className="absolute bottom-24 left-0 right-0 flex justify-center px-8 pointer-events-none z-20">
            <div
              style={{
                background: 'rgba(0,0,0,0.75)', color: '#fff',
                fontSize: 'clamp(14px, 2.5vw, 22px)', padding: '6px 16px',
                borderRadius: '6px', textAlign: 'center', maxWidth: '80%',
                lineHeight: 1.5, textShadow: '0 1px 4px rgba(0,0,0,0.9)', whiteSpace: 'pre-line',
              }}
            >
              {currentCue.replace(/<[^>]+>/g, '')}
            </div>
          </div>
        )}

        {/* ── Skip Intro ──────────────────────────────────── */}
        <SkipIntro
          currentTime={currentTime}
          introStart={movie?.introStart ?? null}
          introEnd={movie?.introEnd ?? null}
          recapEnd={movie?.recapEnd ?? null}
          onSkip={(t) => { if (videoRef.current) videoRef.current.currentTime = t; }}
        />

        {/* ── Playback Stats (press D) ────────────────────── */}
        <AnimatePresence>
          {showPlaybackStats && (
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="absolute top-4 left-4 z-30 bg-black/80 backdrop-blur-sm rounded-xl p-3 font-mono text-[11px] leading-5 text-green-400 border border-green-500/20 pointer-events-none select-none"
            >
              <div className="text-[10px] text-green-300/60 uppercase tracking-wider mb-1 font-bold">Playback Stats</div>
              <div>Resolution: <span className="text-white">{playbackStats.resolution || 'N/A'}</span></div>
              <div>Buffer: <span className="text-white">{playbackStats.bufferHealth}s</span></div>
              <div>Dropped Frames: <span className={playbackStats.droppedFrames > 10 ? 'text-red-400' : 'text-white'}>{playbackStats.droppedFrames}/{playbackStats.totalFrames}</span></div>
              <div>Quality: <span className="text-white">{selectedQuality === 'auto' ? 'Auto' : selectedQuality + 'p'}</span></div>
              <div>Speed: <span className="text-white">{playbackRate}x</span></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Poster fallback when no stream yet ──────────── */}
        {!streamingUrl && movie?.posterPath && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={movie.backdropPath || movie.posterPath} alt={movie.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
            <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
              <img src={movie.posterPath} alt={movie.title} className="w-36 h-52 md:w-48 md:h-72 rounded-2xl shadow-2xl object-cover ring-2 ring-white/10" />
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

        {/* ── Resume Playback Banner ──────────────────────── */}
        <AnimatePresence>
          {resumePrompt && (
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
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
                  if (videoRef.current) { videoRef.current.currentTime = resumePrompt.currentTime; hasSeekedRef.current = true; }
                  clearTimeout(resumeAutoSeekTimer.current);
                  setResumePrompt(null);
                }}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-colors text-sm"
              >Resume</button>
              <button
                onClick={() => { setResumePrompt(null); hasSeekedRef.current = true; clearTimeout(resumeAutoSeekTimer.current); }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm"
              >Start over</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Offline Banner ──────────────────────────────── */}
        <AnimatePresence>
          {!isOnline && !streamError && (
            <motion.div
              initial={{ opacity: 0, y: -48 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -48 }}
              className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 py-3 bg-yellow-500/90 backdrop-blur-sm text-black font-semibold text-sm"
            >
              <FiWifiOff className="w-4 h-4 flex-shrink-0" />
              You&rsquo;re offline &mdash; playback may stop
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Next Episode Autoplay ────────────────────────── */}
        <AnimatePresence>
          {showNextEpisode && nextEpisodeInfo && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="flex flex-col items-center gap-6 text-center px-8"
              >
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                    <circle cx="50" cy="50" r="45" stroke="url(#cd-grad)" strokeWidth="4" fill="none" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - autoplayCountdown / 10)}`}
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                    <defs>
                      <linearGradient id="cd-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-black text-white tabular-nums">{autoplayCountdown}</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-1">Up Next</p>
                  <h3 className="text-white text-2xl font-bold">S{nextEpisodeInfo.season} E{nextEpisodeInfo.episode}</h3>
                  <p className="text-gray-300 text-sm mt-1">{nextEpisodeInfo.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleNextEpisode} className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold rounded-xl hover:from-primary-500 hover:to-purple-500 transition-all shadow-lg shadow-primary-600/30 text-sm">
                    <FiPlay className="w-5 h-5" /> Play Now
                  </button>
                  <button onClick={cancelAutoplay} className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors text-sm border border-white/10">
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Keyboard Shortcuts Overlay ───────────────────── */}
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md"
              onClick={() => setShowShortcuts(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-white tracking-tight">Keyboard Shortcuts</h3>
                  <button onClick={() => setShowShortcuts(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm font-bold">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    ['Space / K', 'Play / Pause'], ['F', 'Toggle fullscreen'], ['M', 'Mute / Unmute'],
                    ['←', 'Rewind 10s'], ['→', 'Forward 10s'], ['↑', 'Volume up'],
                    ['↓', 'Volume down'], ['Shift + ↑', 'Brightness up'], ['Shift + ↓', 'Brightness down'],
                    ['A', 'Toggle ambient glow'], ['D', 'Playback stats'], ['?', 'Show / Hide shortcuts'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center gap-3">
                      <kbd className="inline-flex items-center justify-center min-w-[2.2rem] px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-[11px] font-mono font-bold text-gray-200 tracking-wide">{key}</kbd>
                      <span className="text-gray-400">{desc}</span>
                    </div>
                  ))}
                </div>
                <p className="text-gray-600 text-xs mt-6 text-center">Press <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400 font-mono">?</kbd> to toggle this overlay</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Rotate Prompt (mobile) ──────────────────────── */}
        <AnimatePresence>
          {showRotatePrompt && !streamError && (
            <motion.div
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-black/85 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 shadow-2xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(90 12 12)" />
              </svg>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Rotate for best experience</p>
                <p className="text-gray-400 text-xs">Turn your phone sideways</p>
              </div>
              <button onClick={requestLandscape} className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0">Rotate</button>
              <button onClick={() => setShowRotatePrompt(false)} className="text-gray-500 hover:text-white transition-colors text-lg leading-none flex-shrink-0" aria-label="Dismiss">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stream Error Overlay ─────────────────────────── */}
        <AnimatePresence>
          {streamError && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm px-8 text-center"
            >
              {movie?.backdropPath && (
                <img src={movie.backdropPath} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-10 blur-xl scale-105 pointer-events-none" />
              )}
              <div className="relative z-10 flex flex-col items-center gap-5 max-w-md">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
                  streamError.type === 'expired' ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' :
                  streamError.type === 'offline' || streamError.type === 'network' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' :
                  streamError.type === 'decode' ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' :
                  streamError.type === 'not_found' ? 'border-gray-500/50 bg-gray-500/10 text-gray-400' :
                  'border-red-500/50 bg-red-500/10 text-red-400'
                }`}>
                  {streamError.type === 'offline' || streamError.type === 'network'
                    ? <FiWifiOff className="w-9 h-9" />
                    : streamError.type === 'expired'
                    ? <FiRefreshCw className={`w-9 h-9 ${streamRetrying ? 'animate-spin' : ''}`} />
                    : <FiAlertTriangle className="w-9 h-9" />
                  }
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">
                    {streamError.type === 'expired' ? 'Stream link expired' :
                     streamError.type === 'offline' ? 'You\u2019re offline' :
                     streamError.type === 'network' ? 'Connection issue' :
                     streamError.type === 'decode' ? 'Format not supported' :
                     streamError.type === 'not_found' ? 'Content unavailable' :
                     streamError.type === 'forbidden' ? 'Access denied' :
                     streamError.type === 'auth' ? 'Login Required' : 'Playback error'}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed">{streamError.message}</p>
                </div>
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
                {!streamRetrying && (
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    {streamError.type !== 'not_found' && streamError.type !== 'forbidden' && streamError.type !== 'auth' && (
                      <button
                        onClick={() => { retryCountRef.current = 0; fetchStreamData(); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all text-sm"
                      ><FiRefreshCw className="w-4 h-4" /> Try again</button>
                    )}
                    {streamError.type === 'auth' && (
                      <Link href="/auth/login" className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all text-sm">
                        Log In
                      </Link>
                    )}
                    <Link href={`/movies/${id}`} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm">
                      <FiChevronLeft className="w-4 h-4" /> Back to movie
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading Indicator ────────────────────────────── */}
        {isLoading && streamingUrl && !streamError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}

        {/* ── Volume OSD ──────────────────────────────────── */}
        <AnimatePresence>
          {volumeOSD && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center gap-2 bg-black/70 backdrop-blur-xl rounded-2xl px-8 py-5 border border-white/10 shadow-2xl"
            >
              {isMuted || volume === 0 ? <FiVolumeX className="w-8 h-8 text-white" /> : <FiVolume2 className="w-8 h-8 text-white" />}
              <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all duration-150" style={{ width: `${Math.round((isMuted ? 0 : volume) * 100)}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-300 tabular-nums">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Settings Panel (component) ──────────────────── */}
        <PlayerSettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          quality={selectedQuality}
          onQualityChange={handleQualityChange}
          availableQualities={availableLinks.map(l => l.quality)}
          playbackRate={playbackRate}
          onSpeedChange={handleSpeedChange}
          videoFit={videoFit}
          onFitChange={(f) => { setVideoFit(f); setShowSettings(false); }}
        />

        {/* ── Controls Overlay ────────────────────────────── */}
        <AnimatePresence>
          {showControls && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col justify-between">

              {/* Top Bar */}
              <div className="bg-gradient-to-b from-black/80 to-transparent px-6 py-8 transition-opacity">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Link href={`/movies/${id}`} className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-primary-600 backdrop-blur-md text-white transition-all shadow-lg border border-white/10">
                      <FiChevronLeft className="w-7 h-7 -ml-1" />
                    </Link>
                    <h1 className="text-white font-bold text-xl md:text-2xl drop-shadow-md tracking-tight">
                      {movie?.title} {seriesLabel}
                    </h1>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handleShare} className="relative w-10 h-10 hidden sm:flex items-center justify-center rounded-full bg-black/20 hover:bg-white/20 backdrop-blur-md text-white transition-all border border-white/10">
                      <FiShare2 className="w-5 h-5" />
                      {shareCopied && <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] bg-green-500/90 text-white px-2 py-0.5 rounded-full whitespace-nowrap">Copied!</span>}
                    </button>
                    <button className="w-10 h-10 hidden sm:flex items-center justify-center rounded-full bg-black/20 hover:bg-white/20 backdrop-blur-md text-white transition-all border border-white/10">
                      <FiDownload className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Center Play (when paused) */}
              {!isPlaying && (
                <div className="flex items-center justify-center">
                  <button onClick={togglePlay} className="w-20 h-20 bg-primary-600/90 rounded-full flex items-center justify-center hover:bg-primary-500 transition-colors">
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
                  <div className="absolute h-full bg-white/40 rounded-full" style={{ width: `${buffered}%` }} />
                  <div className="absolute h-full bg-primary-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${progressPct}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all shadow-lg"
                    style={{ left: `calc(${progressPct}% - 8px)` }}
                  />
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-5 sm:gap-8">
                    <button onClick={togglePlay} className="hover:text-primary-400 hover:scale-110 transition-transform">
                      {isPlaying ? <FiPause className="w-7 h-7" /> : <FiPlay className="w-7 h-7" />}
                    </button>
                    <button onClick={() => skip(-10)} className="hover:text-primary-400 hover:scale-110 transition-transform">
                      <FiSkipBack className="w-6 h-6" />
                    </button>
                    <button onClick={() => skip(10)} className="hover:text-primary-400 hover:scale-110 transition-transform">
                      <FiSkipForward className="w-6 h-6" />
                    </button>

                    {/* Volume */}
                    <div className="hidden sm:flex items-center gap-2 group">
                      <button onClick={toggleMute} className="hover:text-primary-400 transition-colors">
                        {isMuted || volume === 0 ? <FiVolumeX className="w-6 h-6" /> : <FiVolume2 className="w-6 h-6" />}
                      </button>
                      <input type="range" min="0" max="2" step="0.05" value={isMuted ? 0 : volume}
                        onChange={handleVolumeSlider} className="w-20 accent-primary-500 cursor-pointer" />
                      <span className="text-[10px] font-mono text-gray-400 w-7 text-right tabular-nums">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                    </div>

                    {/* Brightness */}
                    <div className="hidden md:flex items-center gap-3 group">
                      <FiSun className="w-6 h-6 hover:text-yellow-400 transition-colors cursor-pointer" />
                      <input type="range" min="0.5" max="1.5" step="0.1" value={brightness}
                        onChange={(e) => setBrightness(parseFloat(e.target.value))}
                        className="w-0 opacity-0 group-hover:w-20 group-hover:opacity-100 transition-all duration-300 accent-yellow-400 cursor-pointer" />
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
                        onClick={() => { setShowSubtitlesMenu(p => !p); setShowSettings(false); }}
                        className={`hover:text-primary-400 hover:scale-110 transition-transform ${activeSubtitle !== 'off' ? 'text-primary-500' : 'text-white'}`}
                      >
                        <FiMessageSquare className="w-6 h-6" />
                      </button>
                      {showSubtitlesMenu && (
                        <div className="absolute bottom-full right-0 mb-4 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 py-2">
                          <div className="px-3 py-2">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Subtitles ({subtitles.length})</p>
                            <div className="max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                              <button onClick={() => handleSubtitleChange('off')}
                                className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${activeSubtitle === 'off' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                              >Off</button>
                              {subtitles.map((sub, idx) => {
                                const key = sub.code || sub.lang || `sub-${idx}`;
                                return (
                                  <button key={idx} onClick={() => handleSubtitleChange(key)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-colors ${activeSubtitle === key ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300 hover:bg-white/10 hover:text-white truncate'}`}
                                  >{sub.lang || sub.code || `Subtitle ${idx + 1}`}</button>
                                );
                              })}
                            </div>
                            <div className="w-full h-px bg-white/10 my-2" />
                            <input type="file" ref={subtitleInputRef} onChange={handleLocalSubtitleUpload} className="hidden" accept=".vtt,.srt" />
                            <button onClick={() => subtitleInputRef.current?.click()}
                              className="w-full text-left px-3 py-2 text-sm rounded-lg font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                            >+ Add Subtitle File</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Settings Toggle */}
                    <button
                      onClick={() => { setShowSettings(p => !p); setShowSubtitlesMenu(false); }}
                      className="hover:text-primary-400 hover:rotate-90 transition-all duration-300"
                    >
                      <FiSettings className="w-6 h-6" />
                    </button>

                    {/* PiP (SSR-safe) */}
                    {pipEnabled && (
                      <button
                        onClick={async () => {
                          try {
                            if (document.pictureInPictureElement) await document.exitPictureInPicture();
                            else if (videoRef.current) await videoRef.current.requestPictureInPicture();
                          } catch { }
                        }}
                        className="hover:text-primary-400 hover:scale-110 transition-transform hidden sm:block"
                        title="Picture in Picture"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <rect x="12" y="9" width="8" height="6" rx="1" fill="currentColor" fillOpacity="0.3" />
                        </svg>
                      </button>
                    )}

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