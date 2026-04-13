// mobile/utils/lockScreen.ts
// ─── Section 18: Lock Screen / Now Playing Integration ───────────────────────
// Provides metadata hand-offs to iOS/Android lock screen media controls.
// Uses expo-av's built-in audio session + React Native's media session API.

import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

interface NowPlayingInfo {
  title: string;
  artist?: string;      // e.g. director name or "clipX"
  artwork?: string;     // poster URL
  duration: number;     // seconds
  currentTime: number;  // seconds
  isPlaying: boolean;
}

/**
 * Configure audio session for background playback with lock screen controls.
 * Must be called once before starting video playback.
 */
export async function configureAudioSession(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.warn('[LockScreen] Failed to configure audio session:', error);
  }
}

/**
 * Update the lock screen "Now Playing" metadata.
 * On web/unsupported platforms this uses the MediaSession API.
 * On native, expo-av handles this through the audio session.
 */
export function updateNowPlaying(info: NowPlayingInfo): void {
  try {
    // Web / PWA: use MediaSession API
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      const session = navigator.mediaSession;

      session.metadata = new MediaMetadata({
        title: info.title,
        artist: info.artist || 'clipX',
        album: 'clipX Streaming',
        artwork: info.artwork ? [
          { src: info.artwork, sizes: '512x512', type: 'image/jpeg' },
        ] : [],
      });

      session.playbackState = info.isPlaying ? 'playing' : 'paused';

      // Position state (Chrome 81+)
      if ('setPositionState' in session) {
        session.setPositionState({
          duration: info.duration || 0,
          playbackRate: 1,
          position: Math.min(info.currentTime, info.duration || 0),
        });
      }
    }
  } catch (error) {
    console.warn('[LockScreen] Failed to update now playing:', error);
  }
}

/**
 * Register lock screen action handlers (play/pause/seek).
 */
export function registerMediaHandlers(handlers: {
  onPlay?: () => void;
  onPause?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onStop?: () => void;
}): void {
  try {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      const session = navigator.mediaSession;

      if (handlers.onPlay) {
        session.setActionHandler('play', handlers.onPlay);
      }
      if (handlers.onPause) {
        session.setActionHandler('pause', handlers.onPause);
      }
      if (handlers.onSeekForward) {
        session.setActionHandler('seekforward', handlers.onSeekForward);
      }
      if (handlers.onSeekBackward) {
        session.setActionHandler('seekbackward', handlers.onSeekBackward);
      }
      if (handlers.onStop) {
        session.setActionHandler('stop', handlers.onStop);
      }
    }
  } catch (error) {
    console.warn('[LockScreen] Failed to register media handlers:', error);
  }
}

/**
 * Clear now playing metadata on playback end.
 */
export function clearNowPlaying(): void {
  try {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    }
  } catch {}
}

export default {
  configureAudioSession,
  updateNowPlaying,
  registerMediaHandlers,
  clearNowPlaying,
};
