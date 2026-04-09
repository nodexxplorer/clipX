import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GET_STREAMING_URL, GET_MOVIE, UPDATE_WATCH_PROGRESS } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight, API_URL } from '@/constants/theme';
import { useVideoPlayer, VideoView } from 'expo-video';
import PlayerSettings from '@/components/PlayerSettings';

// ─── FIX (Bug 1 + 3) ─────────────────────────────────────────────────────────
// resolveStreamUrl: prepends API_URL to relative proxy paths.
//
// The backend streamingUrl resolver returns:
//   /api/proxy/stream?token=<hmac-signed-token>
//
// expo-video needs an absolute URL. API_URL comes from EXPO_PUBLIC_API_URL
// (set in .env / eas.json) so this works in every environment — dev, staging,
// and production — as long as the env var is configured.
//
// If EXPO_PUBLIC_API_URL is not set, it falls back to the constant in
// constants/theme.ts — which defaults to the dev machine's LAN IP. Set
// EXPO_PUBLIC_API_URL in your eas.json "production" profile to fix this in
// production builds.
// ─────────────────────────────────────────────────────────────────────────────
function resolveStreamUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = API_URL.replace(/\/+$/, '');
    return `${base}${url}`;
}

/**
 * Inner component that owns the VideoPlayer instance.
 * Only mounted when streamUrl is known — prevents the source from
 * transitioning null → string which would release the native player
 * while VideoView still holds a reference.
 */
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

    const player = useVideoPlayer(streamUrl, (p) => {
        p.loop = false;
        p.play();
    });

    // Apply volume to player (capped at 1.0 natively; >1 is a UI-level boost cue)
    useEffect(() => {
        if (player) {
            player.volume = Math.min(volume, 1.0);
        }
    }, [player, volume]);

    // Apply playback rate
    useEffect(() => {
        if (player) {
            (player as any).playbackRate = playbackRate;
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
        }, 10000);
        return () => clearInterval(syncInterval);
    }, [player, movieId, season, updateProgress, isLocal]);

    // Final sync on unmount
    useEffect(() => {
        return () => {
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
        };
    }, [player, movieId, season, updateProgress, isLocal]);

    const volumePct = Math.round(volume * 100);

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <VideoView
                style={styles.video}
                player={player}
                allowsFullscreen
                allowsPictureInPicture
                nativeControls={false}
            />

            {/* Top Controls */}
            <View style={styles.topBar}>
                <Pressable style={styles.iconBtn} onPress={onBack}>
                    <Ionicons name="close" size={26} color="#fff" />
                </Pressable>
                <View style={{ flex: 1 }} />
                {/* Settings button */}
                <Pressable style={styles.iconBtn} onPress={() => setShowSettings(true)}>
                    <Ionicons name="settings-outline" size={22} color="#fff" />
                </Pressable>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomBar}>
                {/* Volume Slider: 0 – 200% */}
                <View style={styles.volumeRow}>
                    <Ionicons
                        name={volume === 0 ? 'volume-mute' : volume > 1 ? 'volume-high' : 'volume-medium'}
                        size={18}
                        color={volume > 1 ? colors.primary : '#fff'}
                    />
                    <Slider
                        style={styles.volumeSlider}
                        minimumValue={0}
                        maximumValue={2}
                        step={0.05}
                        value={volume}
                        onValueChange={setVolume}
                        minimumTrackTintColor={volume > 1 ? colors.primary : '#ffffff'}
                        maximumTrackTintColor="rgba(255,255,255,0.25)"
                        thumbTintColor={volume > 1 ? colors.primary : '#ffffff'}
                    />
                    <Text style={[styles.volumeLabel, volume > 1 && styles.volumeLabelBoosted]}>
                        {volumePct}%
                    </Text>
                </View>
            </View>

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
                isLandscape={isLandscape}
                onRotate={toggleRotate}
            />
        </View>
    );
}

export default function WatchScreen() {
    // ─── FIX (Bug 1 + 3): Accept season and episode from route params ─────────
    // movie/[id].tsx now pushes:
    //   router.push({ pathname: '/watch/[id]', params: { id, season, episode } })
    //
    // For plain movies, season and episode are omitted (both default to 0/1).
    // For series episodes, the user's selection is forwarded here.
    // ─────────────────────────────────────────────────────────────────────────
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

    // ─── FIX (Bug 1 + 3): Pass season + episode to streamingUrl ───────────────
    // Previously the query was called with only { movieId: id }, so:
    //   - Season defaulted to 0, episode to 1 on the backend — fine for movies,
    //     wrong for series episodes.
    //   - Now we forward the params from the route so the backend fetches the
    //     correct episode stream link.
    // ─────────────────────────────────────────────────────────────────────────
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
    // Top control bar
    topBar: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 44, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    iconBtn: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: radius.round,
    },
    // Bottom control bar
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100,
        paddingBottom: 36, paddingHorizontal: spacing.xl, paddingTop: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    volumeRow: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    },
    volumeSlider: {
        flex: 1, height: 36,
    },
    volumeLabel: {
        color: '#fff',
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
        minWidth: 38,
        textAlign: 'right',
    },
    volumeLabelBoosted: {
        color: colors.primary,
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