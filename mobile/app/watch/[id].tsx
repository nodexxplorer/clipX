import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, StatusBar, Dimensions, PanResponder, Animated } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GET_STREAMING_URL, GET_MOVIE, UPDATE_WATCH_PROGRESS } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight, API_URL } from '@/constants/theme';
import { useVideoPlayer, VideoView } from 'expo-video';
import PlayerSettings from '@/components/PlayerSettings';


function resolveStreamUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = API_URL.replace(/\/+$/, '');
    return `${base}${url}`;
}


function PlayerView({
    streamUrl,
    movieId,
    season,
    episode,
    isLocal,
    onBack,
}: {
    streamUrl: string;
    movieId: string;
    season: number;
    episode: number;
    isLocal: boolean;
    onBack: () => void;
}) {
    const [updateProgress] = useMutation<any>(UPDATE_WATCH_PROGRESS);
    // Volume: 0.0 – 2.0 (>1.0 = boosted, native cap at 1.0 unless device supports it)
    const [volume, setVolume] = useState(1.0);
    const [showSettings, setShowSettings] = useState(false);
    const [quality, setQuality] = useState('auto');
    const [playbackRate, setPlaybackRate] = useState(1);
    const [subtitleTrack, setSubtitleTrack] = useState('off');
    const [isLandscape, setIsLandscape] = useState(false);
    const [availableSubtitles, setAvailableSubtitles] = useState<{id: string; label: string; language: string}[]>([]);

    const player = useVideoPlayer(streamUrl, (p) => {
        p.loop = false;
        p.play();
    });

    // Extract subtitle tracks once the player is ready
    useEffect(() => {
        if (!player) return;
        const extractTracks = () => {
            try {
                const tracks = (player as any).textTracks || [];
                if (tracks.length > 0) {
                    setAvailableSubtitles(
                        tracks.map((t: any, i: number) => ({
                            id: String(i),
                            label: t.label || t.language || `Track ${i + 1}`,
                            language: t.language || 'unknown',
                        }))
                    );
                }
            } catch {}
        };
        // Try immediately and also after a short delay (tracks may load async)
        extractTracks();
        const timer = setTimeout(extractTracks, 2000);
        return () => clearTimeout(timer);
    }, [player, streamUrl]);

    // Apply volume to player (capped at 1.0 natively; >1 is a UI-level boost cue)
    useEffect(() => {
        try {
            if (player) {
                player.volume = Math.min(volume, 1.0);
            }
        } catch (e) {
            // Player may have been released — ignore
        }
    }, [player, volume]);

    // Apply playback rate
    useEffect(() => {
        try {
            if (player) {
                (player as any).playbackRate = playbackRate;
            }
        } catch (e) {
            // Player may have been released — ignore
        }
    }, [player, playbackRate]);

    // Screen orientation toggle
    const toggleRotate = useCallback(async () => {
        try {
            if (isLandscape) {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                setIsLandscape(false);
            } else {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                setIsLandscape(true);
            }
        } catch (err) {
            console.warn('Screen orientation error:', err);
        }
    }, [isLandscape]);

    // Restore portrait on unmount
    useEffect(() => {
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
        };
    }, []);

    // Periodic progress sync (online streams only, every 10 s)
    useEffect(() => {
        if (!player || isLocal) return;
        const syncInterval = setInterval(() => {
            try {
                if (player.playing) {
                    updateProgress({
                        variables: {
                            movieId,
                            contentType: season > 0 ? 'series' : 'movie',
                            currentTime: Math.floor(player.currentTime || 0),
                            duration: Math.floor(player.duration || 120 * 60),
                        },
                    }).catch((err) => console.log('Sync error:', err.message));
                }
            } catch (e) {
                // Player may have been released mid-interval — ignore
            }
        }, 10000);
        return () => clearInterval(syncInterval);
    }, [player, movieId, season, updateProgress, isLocal]);

    // Final sync on unmount
    useEffect(() => {
        return () => {
            try {
                if (player && !isLocal) {
                    updateProgress({
                        variables: {
                            movieId,
                            contentType: season > 0 ? 'series' : 'movie',
                            currentTime: Math.floor(player.currentTime || 0),
                            duration: Math.floor(player.duration || 120 * 60),
                        },
                    }).catch(() => {});
                }
            } catch (e) {
                // Player already released on unmount — safe to ignore
            }
        };
    }, [player, movieId, season, updateProgress, isLocal]);

    const volumePct = Math.round(volume * 100);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isSeeking, setIsSeeking] = useState(false);
    const [gestureOverlay, setGestureOverlay] = useState<{ type: string; value: number } | null>(null);
    const [brightness, setBrightness] = useState(1.0);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTapRef = useRef(0);
    const gestureStartRef = useRef({ y: 0, volume: 1.0, brightness: 1.0 });
    const screenWidth = Dimensions.get('window').width;

    // Hide navigation bar on mount, restore on unmount
    useEffect(() => {
        NavigationBar.setVisibilityAsync('hidden').catch(() => {});
        NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {});
        return () => {
            NavigationBar.setVisibilityAsync('visible').catch(() => {});
        };
    }, []);

    // Auto-hide controls after 4 seconds
    const resetHideTimer = useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setShowControls(false), 4000);
    }, []);

    useEffect(() => {
        if (showControls) resetHideTimer();
        return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
    }, [showControls, resetHideTimer]);

    // Track playback position
    useEffect(() => {
        if (!player) return;
        const interval = setInterval(() => {
            try {
                if (!isSeeking) {
                    setCurrentTime(Math.floor(player.currentTime || 0));
                    setTotalDuration(Math.floor(player.duration || 0));
                }
            } catch (e) { /* Player released */ }
        }, 500);
        return () => clearInterval(interval);
    }, [player, isSeeking]);

    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    // Seek handler
    const handleSeek = useCallback((val: number) => {
        try {
            if (player) {
                player.currentTime = val;
                setCurrentTime(val);
            }
        } catch (e) { /* Player released */ }
    }, [player]);

    // Toggle play/pause
    const togglePlayPause = useCallback(() => {
        try {
            if (!player) return;
            if (player.playing) {
                player.pause();
            } else {
                player.play();
            }
        } catch (e) { /* Player released */ }
    }, [player]);

    // Gesture handler via PanResponder
    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,
        onPanResponderGrant: (evt, _gs) => {
            const x = evt.nativeEvent.locationX;
            gestureStartRef.current = {
                y: 0,
                volume,
                brightness,
            };
            // Determine side
            const isRightSide = x > screenWidth / 2;
            if (isRightSide) {
                setGestureOverlay({ type: 'volume', value: volumePct });
            } else {
                setGestureOverlay({ type: 'brightness', value: Math.round(brightness * 100) });
            }
        },
        onPanResponderMove: (evt, gs) => {
            const x = evt.nativeEvent.pageX;
            const isRightSide = x > screenWidth / 2;
            const sensitivity = 200; // pixels for full range
            const delta = -gs.dy / sensitivity;

            if (isRightSide) {
                // Volume control (right side)
                const newVol = Math.max(0, Math.min(2, gestureStartRef.current.volume + delta));
                setVolume(newVol);
                setGestureOverlay({ type: 'volume', value: Math.round(newVol * 100) });
            } else {
                // Brightness control (left side)
                const newBright = Math.max(0, Math.min(1, gestureStartRef.current.brightness + delta));
                setBrightness(newBright);
                setGestureOverlay({ type: 'brightness', value: Math.round(newBright * 100) });
            }
        },
        onPanResponderRelease: () => {
            setTimeout(() => setGestureOverlay(null), 500);
        },
    }), [volume, brightness, screenWidth, volumePct]);

    // Double-tap seek feedback
    const [seekFeedback, setSeekFeedback] = useState<{ side: 'left' | 'right'; label: string } | null>(null);
    const seekFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Handle tap (single tap = toggle controls, double tap = seek ±10s)
    const handleTap = useCallback((evt: any) => {
        const tapX = evt?.nativeEvent?.locationX ?? screenWidth / 2;
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
            // Double tap → seek based on which half of the screen was tapped
            const isRightSide = tapX > screenWidth / 2;
            try {
                if (player) {
                    const seekAmount = isRightSide ? 10 : -10;
                    player.currentTime = Math.max(0, Math.min(
                        player.duration || 0,
                        (player.currentTime || 0) + seekAmount
                    ));
                    setCurrentTime(Math.floor(player.currentTime));
                }
            } catch (e) { /* Player released */ }
            // Show seek feedback overlay
            setSeekFeedback({
                side: isRightSide ? 'right' : 'left',
                label: isRightSide ? '+10s' : '-10s',
            });
            if (seekFeedbackTimer.current) clearTimeout(seekFeedbackTimer.current);
            seekFeedbackTimer.current = setTimeout(() => setSeekFeedback(null), 700);
            lastTapRef.current = 0;
        } else {
            // Single tap → toggle controls after short delay
            lastTapRef.current = now;
            setTimeout(() => {
                if (Date.now() - lastTapRef.current >= 280) {
                    setShowControls(prev => !prev);
                }
            }, 300);
        }
    }, [togglePlayPause, player, screenWidth]);

    const progress = totalDuration > 0 ? currentTime / totalDuration : 0;

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <VideoView
                style={[styles.video, { opacity: brightness }]}
                player={player}
                allowsFullscreen
                allowsPictureInPicture
                nativeControls={false}
            />

            {/* Gesture layer — captures swipes and taps */}
            <View
                style={styles.gestureLayer}
                {...panResponder.panHandlers}
                onTouchEnd={(e) => {
                    // Only handle tap if not a pan gesture
                    if (e.nativeEvent.changedTouches.length === 1) {
                        handleTap(e);
                    }
                }}
            />

            {/* Gesture Feedback Overlay */}
            {gestureOverlay && (
                <View style={styles.gestureOverlay}>
                    <Ionicons
                        name={gestureOverlay.type === 'volume'
                            ? (gestureOverlay.value === 0 ? 'volume-mute' : 'volume-high')
                            : (gestureOverlay.value > 50 ? 'sunny' : 'sunny-outline')
                        }
                        size={28}
                        color="#fff"
                    />
                    <Text style={styles.gestureText}>{gestureOverlay.value}%</Text>
                    <View style={styles.gestureBarBg}>
                        <View style={[styles.gestureBarFill, {
                            width: `${Math.min(100, gestureOverlay.type === 'volume' ? gestureOverlay.value / 2 : gestureOverlay.value)}%`,
                            backgroundColor: gestureOverlay.type === 'volume' ? colors.primary : '#f59e0b',
                        }]} />
                    </View>
                </View>
            )}

            {/* Double-tap seek feedback overlay */}
            {seekFeedback && (
                <View style={[styles.seekFeedback, seekFeedback.side === 'right' ? styles.seekFeedbackRight : styles.seekFeedbackLeft]}>
                    <Ionicons
                        name={seekFeedback.side === 'right' ? 'play-forward' : 'play-back'}
                        size={28}
                        color="#fff"
                    />
                    <Text style={styles.seekFeedbackText}>{seekFeedback.label}</Text>
                </View>
            )}

            {/* Controls — only visible when showControls is true */}
            {showControls && (
                <>
                    {/* Top bar */}
                    <View style={styles.topBar}>
                        <Pressable style={styles.iconBtn} onPress={onBack} accessibilityLabel="Close player" accessibilityRole="button">
                            <Ionicons name="close" size={26} color="#fff" />
                        </Pressable>
                        <View style={{ flex: 1 }} />
                        <Pressable style={styles.iconBtn} onPress={() => setShowSettings(true)} accessibilityLabel="Player settings" accessibilityRole="button">
                            <Ionicons name="settings-outline" size={22} color="#fff" />
                        </Pressable>
                    </View>

                    {/* Center play/pause button */}
                    <Pressable style={styles.centerPlayBtn} onPress={togglePlayPause} accessibilityLabel={player?.playing ? 'Pause video' : 'Play video'} accessibilityRole="button">
                        <Ionicons
                            name={player?.playing ? 'pause' : 'play'}
                            size={44}
                            color="#fff"
                        />
                    </Pressable>

                    {/* Bottom bar with progress + controls */}
                    <View style={styles.bottomBar}>
                        {/* Seekable progress bar */}
                        <Slider
                            style={styles.progressSlider}
                            minimumValue={0}
                            maximumValue={totalDuration > 0 ? totalDuration : 1}
                            value={currentTime}
                            onSlidingStart={() => setIsSeeking(true)}
                            onSlidingComplete={(val) => {
                                handleSeek(Math.floor(val));
                                setIsSeeking(false);
                            }}
                            onValueChange={(val) => setCurrentTime(Math.floor(val))}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor="rgba(255,255,255,0.3)"
                            thumbTintColor={colors.primary}
                        />

                        {/* Time + controls row */}
                        <View style={styles.controlsRow}>
                            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                            <Text style={styles.timeSep}> / </Text>
                            <Text style={styles.timeText}>
                                {totalDuration > 0 ? formatTime(totalDuration) : '--:--'}
                            </Text>

                            <View style={{ flex: 1 }} />

                            {/* Landscape toggle */}
                            <Pressable
                                style={[styles.controlBtn, isLandscape && styles.controlBtnActive]}
                                onPress={toggleRotate}
                                accessibilityLabel={isLandscape ? 'Switch to portrait' : 'Switch to landscape'}
                                accessibilityRole="button"
                            >
                                <Ionicons
                                    name={isLandscape ? 'phone-portrait-outline' : 'phone-landscape-outline'}
                                    size={18}
                                    color="#fff"
                                />
                            </Pressable>
                        </View>
                    </View>
                </>
            )}

            {/* Player Settings Sheet */}
            <PlayerSettings
                visible={showSettings}
                onClose={() => setShowSettings(false)}
                quality={quality}
                onQualityChange={setQuality}
                playbackRate={playbackRate}
                onSpeedChange={setPlaybackRate}
                subtitleTrack={subtitleTrack}
                onSubtitleChange={setSubtitleTrack}
                availableSubtitles={availableSubtitles}
                isLandscape={isLandscape}
                onRotate={toggleRotate}
            />
        </View>
    );
}

export default function WatchScreen() {
    const { id, localUri, season: seasonParam, episode: episodeParam } =
        useLocalSearchParams<{
            id: string;
            localUri?: string;
            season?: string;
            episode?: string;
        }>();

    // Parse season/episode — default to 0/1 (movie default in backend resolver)
    const season  = seasonParam  ? parseInt(seasonParam,  10) : 0;
    const episode = episodeParam ? parseInt(episodeParam, 10) : 1;

    const router  = useRouter();

    const { data: movieData } = useQuery<any>(GET_MOVIE, {
        variables: { id },
        skip: !!localUri,
    });

    const {
        data: streamData,
        loading: streamLoading,
        error: streamError,
        refetch: refetchStream,
    } = useQuery<any>(GET_STREAMING_URL, {
        variables: { movieId: id, season, episode },
        skip: !!localUri,
    });

    const movie    = movieData?.movie;
    const streamUrl = localUri ? localUri : resolveStreamUrl(streamData?.streamingUrl);
    const handleBack = useCallback(() => router.back(), [router]);

    // Compose a human-readable title for the header / error screen
    const contentLabel = season > 0
        ? `S${season} E${episode}`
        : (movie?.title || 'Movie');

    if (!localUri && streamLoading) {
        return (
            <View style={styles.centerContainer}>
                <StatusBar hidden />
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                    {season > 0
                        ? `Loading S${season}E${episode}…`
                        : 'Loading stream…'}
                </Text>
            </View>
        );
    }

    if (streamError || !streamUrl) {
        return (
            <View style={styles.centerContainer}>
                <StatusBar hidden />
                <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
                <Text style={styles.errorTitle}>Stream Unavailable</Text>
                <Text style={styles.errorSub}>
                    {streamError?.message ||
                        `${contentLabel} is not available for streaming right now.`}
                </Text>
                <View style={styles.errorActions}>
                    <Pressable style={styles.retryBtn} onPress={() => refetchStream()}>
                        <Ionicons name="refresh" size={18} color="#fff" />
                        <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                    <Pressable style={styles.goBackBtn} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={18} color="#fff" />
                        <Text style={styles.retryText}>Go Back</Text>
                    </Pressable>
                    <Pressable
                        style={styles.reportBtn}
                        onPress={() =>
                            router.push({
                                pathname: '/report',
                                params: { movieId: id, movieTitle: movie?.title },
                            })
                        }
                    >
                        <Ionicons name="flag-outline" size={18} color={colors.warning} />
                        <Text style={styles.reportText}>Report</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <PlayerView
            key={streamUrl}
            streamUrl={streamUrl}
            movieId={id}
            season={season}
            episode={episode}
            isLocal={!!localUri}
            onBack={handleBack}
        />
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    video: { flex: 1, width: '100%', height: '100%' },

    // Gesture layer — sits on top of video, captures all touch events
    gestureLayer: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 50,
    },

    // Top control bar
    topBar: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 200,
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 44, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    iconBtn: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: radius.round,
    },

    // Center play/pause
    centerPlayBtn: {
        position: 'absolute',
        top: '50%', left: '50%',
        marginTop: -32, marginLeft: -32,
        width: 64, height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
    },

    // Bottom control bar
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 200,
        paddingBottom: 20, paddingHorizontal: spacing.sm, paddingTop: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    // Progress slider
    progressSlider: {
        width: '100%', height: 28,
        marginBottom: -4,
    },
    // Time + controls row
    controlsRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.sm,
    },
    timeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: fontWeight.bold,
        fontVariant: ['tabular-nums'],
    },
    timeSep: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
    controlBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: radius.md,
    },
    controlBtnActive: {
        backgroundColor: 'rgba(99,102,241,0.25)',
        borderWidth: 1,
        borderColor: 'rgba(99,102,241,0.4)',
    },

    // Gesture feedback overlay (center of screen)
    gestureOverlay: {
        position: 'absolute',
        top: '50%', left: '50%',
        marginTop: -50, marginLeft: -50,
        width: 100, height: 100,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 300,
        gap: 4,
    },
    gestureText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: fontWeight.black,
    },
    gestureBarBg: {
        width: 70, height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    gestureBarFill: {
        height: '100%',
        borderRadius: 2,
    },

    // Double-tap seek feedback overlays
    seekFeedback: {
        position: 'absolute',
        top: '30%', bottom: '30%',
        width: 100,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 50,
        zIndex: 250,
        gap: 2,
    },
    seekFeedbackLeft: { left: 30 },
    seekFeedbackRight: { right: 30 },
    seekFeedbackText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: fontWeight.black,
    },

    // Error / loading screens
    centerContainer: {
        flex: 1, backgroundColor: '#000',
        justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 32,
    },
    loadingText: { color: colors.textMuted, marginTop: spacing.lg, fontSize: fontSize.md },
    errorTitle: {
        color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold,
        marginTop: spacing.xl, textAlign: 'center',
    },
    errorSub: {
        color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm,
        textAlign: 'center', lineHeight: 22,
    },
    errorActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl, flexWrap: 'wrap', justifyContent: 'center' },
    retryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 20, paddingVertical: 10,
        backgroundColor: colors.primary, borderRadius: radius.md,
    },
    goBackBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 20, paddingVertical: 10,
        backgroundColor: colors.surfaceLight, borderRadius: radius.md,
    },
    retryText: { color: '#fff', fontWeight: fontWeight.bold },
    reportBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 20, paddingVertical: 10,
        backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: radius.md,
        borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    },
    reportText: { color: colors.warning, fontWeight: fontWeight.bold },
});