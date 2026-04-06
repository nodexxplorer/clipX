import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Dimensions, FlatList, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import Gradient from '@/components/Gradient';
import { Ionicons } from '@expo/vector-icons';
import {
    GET_MOVIE, ADD_TO_WATCHLIST, REMOVE_FROM_WATCHLIST,
    GET_STREAMING_URL, GET_WATCHLIST,
} from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight, POSTER_ASPECT, API_URL } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getPosterUri, getBackdropUri } from '@/lib/utils';
import { startDownload } from '@/lib/downloads';
import type { Movie, CastMember, Season } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const POSTER_W = 120;
const POSTER_H = POSTER_W / POSTER_ASPECT;
const REC_W = (SCREEN_W - spacing.xl * 2 - spacing.md * 2) / 3;
const REC_H = REC_W / POSTER_ASPECT;

function resolveStreamUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = API_URL.replace(/\/+$/, '');
    return `${base}${url}`;
}

function CastCard({ member }: { member: CastMember }) {
    return (
        <View style={styles.castCard}>
            {member.profileImage ? (
                <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w185${member.profileImage}` }}
                    style={styles.castImg}
                    contentFit="cover"
                />
            ) : (
                <View style={[styles.castImg, styles.castPlaceholder]}>
                    <Ionicons name="person" size={20} color={colors.textMuted} />
                </View>
            )}
            <Text style={styles.castName} numberOfLines={1}>{member.name}</Text>
            <Text style={styles.castChar} numberOfLines={1}>{member.character}</Text>
        </View>
    );
}

// ─── FIX (Bug 3): EpisodeList ────────────────────────────────────────────────
// Previously every episode row was a plain <View> with no onPress — tapping an
// episode did nothing. The play icon was purely decorative.
//
// Fixed:
//  1. Each row is now a <Pressable> that calls onSelectEpisode(season, episode).
//  2. The currently-playing episode is highlighted.
//  3. The parent passes the selected (season, episode) up so the Play button
//     and the direct "tap to play" both navigate with the right params.
// ─────────────────────────────────────────────────────────────────────────────
function EpisodeList({
    seasons,
    onSelectEpisode,
    selectedSeason,
    selectedEpisode,
}: {
    seasons: Season[];
    onSelectEpisode: (season: number, episode: number) => void;
    selectedSeason: number;
    selectedEpisode: number;
}) {
    const [activeSeasonIdx, setActiveSeasonIdx] = useState(0);
    const season = seasons[activeSeasonIdx];
    if (!season) return null;

    return (
        <View style={styles.episodeSection}>
            {/* Season tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.seasonTabs}
            >
                {seasons.map((s, i) => (
                    <Pressable
                        key={s.id}
                        onPress={() => setActiveSeasonIdx(i)}
                        style={[styles.seasonTab, activeSeasonIdx === i && styles.seasonTabActive]}
                    >
                        <Text style={[styles.seasonTabText, activeSeasonIdx === i && styles.seasonTabTextActive]}>
                            S{s.seasonNumber}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Episode rows — now Pressable */}
            {season.episodes.map(ep => {
                const isActive =
                    selectedSeason === season.seasonNumber &&
                    selectedEpisode === ep.episodeNumber;

                return (
                    <Pressable
                        key={ep.id}
                        style={[styles.episodeItem, isActive && styles.episodeItemActive]}
                        onPress={() => onSelectEpisode(season.seasonNumber, ep.episodeNumber)}
                    >
                        <View style={[styles.epNum, isActive && styles.epNumActive]}>
                            <Text style={[styles.epNumText, isActive && styles.epNumTextActive]}>
                                {ep.episodeNumber}
                            </Text>
                        </View>
                        <Text style={[styles.epTitle, isActive && styles.epTitleActive]} numberOfLines={1}>
                            {ep.title || `Episode ${ep.episodeNumber}`}
                        </Text>
                        <Ionicons
                            name={isActive ? 'play-circle' : 'play-circle-outline'}
                            size={22}
                            color={isActive ? colors.primary : colors.textMuted}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
}

export default function MovieDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const client = useApolloClient();

    const { data, loading, error } = useQuery<any>(GET_MOVIE, { variables: { id } });
    const [addToWatchlist] = useMutation<any>(ADD_TO_WATCHLIST, {
        refetchQueries: [{ query: GET_WATCHLIST }],
    });
    const [removeFromWatchlist] = useMutation<any>(REMOVE_FROM_WATCHLIST, {
        refetchQueries: [{ query: GET_WATCHLIST }],
    });

    const [inWatchlist, setInWatchlist] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // ─── FIX (Bug 3): Track selected season + episode ──────────────────────
    // Default to season 1, episode 1 for series. Season 0 / episode 1 is used
    // for movies (matches the backend streamingUrl resolver default).
    const [selectedSeason, setSelectedSeason] = useState(0);
    const [selectedEpisode, setSelectedEpisode] = useState(1);
    // ───────────────────────────────────────────────────────────────────────

    const movie: Movie | undefined = data?.movie;

    useEffect(() => {
        if (movie) {
            setInWatchlist(movie.inWatchlist || false);
            // Auto-select season 1 if this is a series
            if (movie.seasons && movie.seasons.length > 0) {
                setSelectedSeason(movie.seasons[0].seasonNumber);
                setSelectedEpisode(1);
            }
        }
    }, [movie]);

    const handleWatchlistToggle = async () => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        try {
            if (inWatchlist) {
                await removeFromWatchlist({ variables: { movieId: id } });
                setInWatchlist(false);
            } else {
                await addToWatchlist({ variables: { movieId: id } });
                setInWatchlist(true);
            }
        } catch { }
    };

    // ─── FIX (Bug 3): Episode selection handler ────────────────────────────
    // When user taps an episode, update selection AND immediately navigate to
    // the player with the correct season + episode numbers.
    const handleSelectEpisode = (season: number, episode: number) => {
        setSelectedSeason(season);
        setSelectedEpisode(episode);
        router.push({
            pathname: '/watch/[id]',
            params: { id: movie!.id, season: String(season), episode: String(episode) },
        } as any);
    };
    // ───────────────────────────────────────────────────────────────────────

    // ─── FIX (Bug 1 + 3): Play button passes season+episode for series ─────
    const handlePlay = () => {
        const params: Record<string, string> = { id: movie!.id };
        // For series, include the currently-selected season and episode
        if (movie?.seasons && movie.seasons.length > 0) {
            params.season = String(selectedSeason);
            params.episode = String(selectedEpisode);
        }
        router.push({ pathname: '/watch/[id]', params } as any);
    };
    // ───────────────────────────────────────────────────────────────────────

    // ─── FIX (Bug 2): Download now passes correct season/episode ──────────
    const handleDownload = async () => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        if (!movie) return;

        setIsDownloading(true);
        try {
            const season = (movie.seasons && movie.seasons.length > 0) ? selectedSeason : 0;
            const episode = (movie.seasons && movie.seasons.length > 0) ? selectedEpisode : 1;

            const { data: streamData } = await client.query<{ streamingUrl: string }>({
                query: GET_STREAMING_URL,
                variables: { movieId: id, season, episode },
                fetchPolicy: 'network-only',
            });

            const resolvedUrl = resolveStreamUrl(streamData?.streamingUrl);
            if (!resolvedUrl) {
                Alert.alert('Error', 'Stream is currently unavailable for download.');
                setIsDownloading(false);
                return;
            }

            const episodeLabel = (movie.seasons && movie.seasons.length > 0)
                ? ` S${season}E${episode}`
                : '';
            const downloadTitle = `${movie.title}${episodeLabel}`;
            const downloadId = `${id}_s${season}_e${episode}`;

            Alert.alert('Download Started', 'Check the Downloads tab for progress.');
            await startDownload(
                downloadId,
                downloadTitle,
                resolvedUrl,
                getPosterUri(movie) || '',
            );
        } catch (e: any) {
            Alert.alert('Download Failed', e.message || 'Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };
    // ───────────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error || !movie) {
        return (
            <View style={styles.loading}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={styles.errorText}>Movie not found</Text>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const cast = movie.cast || [];
    const seasons = movie.seasons || [];
    const recommendations = movie.recommendations || [];
    const hasSeries = seasons.length > 0;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Backdrop */}
            <View style={styles.backdrop}>
                <Image
                    source={{ uri: getBackdropUri(movie) }}
                    style={styles.backdropImg}
                    contentFit="cover"
                    transition={300}
                />
                <Gradient colors={['transparent', colors.background]} style={styles.backdropGradient} />
                <Pressable style={styles.closeBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </Pressable>
            </View>

            <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                    <Image
                        source={{ uri: getPosterUri(movie) }}
                        style={styles.infoPoster}
                        contentFit="cover"
                    />
                    <View style={styles.infoText}>
                        <Text style={styles.title}>{movie.title}</Text>
                        <View style={styles.metaRow}>
                            {movie.releaseDate && (
                                <Text style={styles.meta}>
                                    {new Date(movie.releaseDate).getFullYear()}
                                </Text>
                            )}
                            {movie.runtime ? (
                                <Text style={styles.meta}>{movie.runtime} min</Text>
                            ) : null}
                            {movie.voteAverage ? (
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={11} color={colors.warning} />
                                    <Text style={styles.ratingVal}>
                                        {movie.voteAverage.toFixed(1)}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                        {movie.genres?.length ? (
                            <Text style={styles.genres} numberOfLines={1}>
                                {movie.genres.map(g => g.name).join(' • ')}
                            </Text>
                        ) : null}
                        {/* Show selected episode for series */}
                        {hasSeries && (
                            <Text style={styles.episodeHint}>
                                Playing: S{selectedSeason} E{selectedEpisode}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {/* FIX: Play now uses handlePlay so season+episode are passed */}
                    <Pressable style={styles.playActionBtn} onPress={handlePlay}>
                        <Ionicons name="play" size={20} color="#000" />
                        <Text style={styles.playActionText}>
                            {hasSeries ? `Play S${selectedSeason}E${selectedEpisode}` : 'Play'}
                        </Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={handleWatchlistToggle}>
                        <Ionicons
                            name={inWatchlist ? 'heart' : 'heart-outline'}
                            size={20}
                            color={inWatchlist ? colors.error : colors.text}
                        />
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={handleDownload} disabled={isDownloading}>
                        {isDownloading ? (
                            <ActivityIndicator size="small" color={colors.text} />
                        ) : (
                            <Ionicons name="download-outline" size={20} color={colors.text} />
                        )}
                    </Pressable>
                    <Pressable
                        style={styles.actionBtn}
                        onPress={() =>
                            router.push({
                                pathname: '/report',
                                params: { movieId: movie.id, movieTitle: movie.title },
                            })
                        }
                    >
                        <Ionicons name="flag-outline" size={20} color={colors.text} />
                    </Pressable>
                </View>

                {movie.tagline && (
                    <Text style={styles.tagline}>"{movie.tagline}"</Text>
                )}
                <Text style={styles.overview}>
                    {movie.overview || movie.description || 'No description available.'}
                </Text>

                {/* FIX (Bug 3): EpisodeList now receives onSelectEpisode + selected state */}
                {hasSeries && (
                    <EpisodeList
                        seasons={seasons}
                        onSelectEpisode={handleSelectEpisode}
                        selectedSeason={selectedSeason}
                        selectedEpisode={selectedEpisode}
                    />
                )}

                {cast.length > 0 && (
                    <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>Cast</Text>
                        <FlatList
                            data={cast.slice(0, 20)}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.castList}
                            renderItem={({ item }) => <CastCard member={item} />}
                        />
                    </View>
                )}

                {recommendations.length > 0 && (
                    <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>You May Also Like</Text>
                        <FlatList
                            data={recommendations.slice(0, 12)}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.recList}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => router.push(`/movie/${item.id}`)}
                                    style={styles.recCard}
                                >
                                    <Image
                                        source={{ uri: getPosterUri(item) }}
                                        style={styles.recPoster}
                                        contentFit="cover"
                                    />
                                </Pressable>
                            )}
                        />
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: 100 },
    loading: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginTop: spacing.lg },
    backBtn: { marginTop: spacing.xl, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radius.md },
    backBtnText: { color: '#fff', fontWeight: fontWeight.bold },

    backdrop: { height: 300, position: 'relative' },
    backdropImg: { width: '100%', height: '100%' },
    backdropGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
    closeBtn: {
        position: 'absolute', top: 52, left: spacing.xl,
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
    },

    infoSection: { paddingHorizontal: spacing.xl, marginTop: -40 },
    infoRow: { flexDirection: 'row', gap: spacing.lg },
    infoPoster: { width: POSTER_W, height: POSTER_H, borderRadius: radius.md, backgroundColor: colors.surfaceLight },
    infoText: { flex: 1, paddingTop: 40 },
    title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black, lineHeight: 28 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
    meta: { color: colors.textMuted, fontSize: fontSize.sm },
    ratingBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: 'rgba(245,158,11,0.12)',
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm,
    },
    ratingVal: { color: colors.warning, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
    genres: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm },
    episodeHint: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold, marginTop: spacing.sm },

    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl },
    playActionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: '#fff', paddingVertical: 12, borderRadius: radius.md,
    },
    playActionText: { color: '#000', fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    actionBtn: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLight,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: colors.border,
    },

    tagline: { color: colors.textMuted, fontSize: fontSize.sm, fontStyle: 'italic', marginTop: spacing.xl },
    overview: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 22, marginTop: spacing.md },

    sectionBlock: { marginTop: spacing.xxl },
    sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: spacing.md },

    castList: { gap: spacing.md },
    castCard: { width: 72, alignItems: 'center' },
    castImg: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceLight },
    castPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    castName: { color: colors.textSecondary, fontSize: 10, fontWeight: fontWeight.semibold, marginTop: 4, textAlign: 'center' },
    castChar: { color: colors.textDim, fontSize: 9, textAlign: 'center' },

    recList: { gap: spacing.md },
    recCard: { width: REC_W },
    recPoster: { width: REC_W, height: REC_H, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },

    episodeSection: { marginTop: spacing.xxl },
    seasonTabs: { gap: spacing.sm, marginBottom: spacing.lg },
    seasonTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },
    seasonTabActive: { backgroundColor: colors.primary },
    seasonTabText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
    seasonTabTextActive: { color: '#fff' },

    // FIX: episodeItem is now styled to give Pressable feedback
    episodeItem: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
        borderBottomWidth: 0.5, borderBottomColor: colors.border,
        borderRadius: radius.sm,
    },
    episodeItemActive: { backgroundColor: 'rgba(8,145,178,0.08)' },
    epNum: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: colors.surfaceLight,
        justifyContent: 'center', alignItems: 'center',
    },
    epNumActive: { backgroundColor: colors.primary },
    epNumText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
    epNumTextActive: { color: '#fff' },
    epTitle: { flex: 1, color: colors.text, fontSize: fontSize.md },
    epTitleActive: { color: colors.primary, fontWeight: fontWeight.semibold },
});