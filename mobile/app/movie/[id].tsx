import React, { useState } from 'react';
import {
    View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Dimensions, FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import Gradient from '@/components/Gradient';
import { Ionicons } from '@expo/vector-icons';
import { GET_MOVIE, TOGGLE_WATCHLIST } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight, POSTER_ASPECT } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import type { Movie, CastMember, Season } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const POSTER_W = 120;
const POSTER_H = POSTER_W / POSTER_ASPECT;
const REC_W = (SCREEN_W - spacing.xl * 2 - spacing.md * 2) / 3;
const REC_H = REC_W / POSTER_ASPECT;

function getPoster(m: Movie) {
    return m.posterUrl || (m.posterPath ? `https://image.tmdb.org/t/p/w342${m.posterPath}` : undefined);
}
function getBackdrop(m: Movie) {
    return m.backdropUrl || (m.backdropPath ? `https://image.tmdb.org/t/p/w780${m.backdropPath}` : undefined);
}

function CastCard({ member }: { member: CastMember }) {
    return (
        <View style={styles.castCard}>
            {member.profileImage ? (
                <Image source={{ uri: `https://image.tmdb.org/t/p/w185${member.profileImage}` }} style={styles.castImg} contentFit="cover" />
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

function EpisodeList({ seasons }: { seasons: Season[] }) {
    const [activeSeason, setActiveSeason] = useState(0);
    const season = seasons[activeSeason];
    if (!season) return null;

    return (
        <View style={styles.episodeSection}>
            {/* Season tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonTabs}>
                {seasons.map((s, i) => (
                    <Pressable key={s.id} onPress={() => setActiveSeason(i)}
                        style={[styles.seasonTab, activeSeason === i && styles.seasonTabActive]}>
                        <Text style={[styles.seasonTabText, activeSeason === i && styles.seasonTabTextActive]}>
                            S{s.seasonNumber}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
            {/* Episodes */}
            {season.episodes.map(ep => (
                <View key={ep.id} style={styles.episodeItem}>
                    <View style={styles.epNum}>
                        <Text style={styles.epNumText}>{ep.episodeNumber}</Text>
                    </View>
                    <Text style={styles.epTitle} numberOfLines={1}>{ep.title || `Episode ${ep.episodeNumber}`}</Text>
                    <Ionicons name="play-circle-outline" size={22} color={colors.primary} />
                </View>
            ))}
        </View>
    );
}

import { useApolloClient } from '@apollo/client/react';
import { GET_STREAMING_URL } from '@/lib/graphql';
import { startDownload } from '@/lib/downloads';
import { Alert } from 'react-native';

export default function MovieDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const client = useApolloClient();
    const { data, loading, error } = useQuery<any>(GET_MOVIE, { variables: { id } });
    const [toggleWatchlist] = useMutation<any>(TOGGLE_WATCHLIST);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const movie: Movie | undefined = data?.movie;

    const handleWatchlistToggle = async () => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        try {
            const { data: res } = await toggleWatchlist({ variables: { movieId: id } });
            setInWatchlist(res?.toggleWatchlist?.added ?? false);
        } catch { }
    };

    const handleDownload = async () => {
        if (!isAuthenticated) { router.push('/auth/login'); return; }
        if (!movie) return;
        
        setIsDownloading(true);
        try {
            // Lazily fetch the URL to download
            const { data: streamData } = await client.query<{ streamingUrl: string }>({
                query: GET_STREAMING_URL,
                variables: { movieId: id },
                fetchPolicy: 'network-only' // ensure fresh link for download
            });
            
            if (!streamData?.streamingUrl) {
                Alert.alert('Error', 'Stream is currently unavailable for download.');
                setIsDownloading(false);
                return;
            }
            
            Alert.alert('Download Started', 'You can check the progress in your Downloads tab.');
            await startDownload(
                movie.id,
                movie.title,
                streamData.streamingUrl,
                getPoster(movie) || ''
            );
        } catch (e: any) {
            Alert.alert('Error', 'Failed to start download. ' + (e.message || ''));
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) {
        return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>;
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
                <Image source={{ uri: getBackdrop(movie) }} style={styles.backdropImg} contentFit="cover" transition={300} />
                <Gradient colors={['transparent', colors.background]} style={styles.backdropGradient} />
                <Pressable style={styles.closeBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </Pressable>
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                    <Image source={{ uri: getPoster(movie) }} style={styles.infoPoster} contentFit="cover" />
                    <View style={styles.infoText}>
                        <Text style={styles.title}>{movie.title}</Text>
                        <View style={styles.metaRow}>
                            {movie.releaseDate && <Text style={styles.meta}>{new Date(movie.releaseDate).getFullYear()}</Text>}
                            {movie.runtime ? <Text style={styles.meta}>{movie.runtime} min</Text> : null}
                            {movie.voteAverage ? (
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={11} color={colors.warning} />
                                    <Text style={styles.ratingVal}>{movie.voteAverage.toFixed(1)}</Text>
                                </View>
                            ) : null}
                        </View>
                        {movie.genres?.length ? (
                            <Text style={styles.genres} numberOfLines={1}>
                                {movie.genres.map(g => g.name).join(' • ')}
                            </Text>
                        ) : null}
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <Pressable style={styles.playActionBtn} onPress={() => router.push(`/watch/${movie.id}`)}>
                        <Ionicons name="play" size={20} color="#000" />
                        <Text style={styles.playActionText}>Play</Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={handleWatchlistToggle}>
                        <Ionicons name={inWatchlist ? 'heart' : 'heart-outline'} size={20} color={inWatchlist ? colors.error : colors.text} />
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={handleDownload} disabled={isDownloading}>
                        {isDownloading ? (
                            <ActivityIndicator size="small" color={colors.text} />
                        ) : (
                            <Ionicons name="download-outline" size={20} color={colors.text} />
                        )}
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => router.push({ pathname: '/report', params: { movieId: movie.id, movieTitle: movie.title } })}>
                        <Ionicons name="flag-outline" size={20} color={colors.text} />
                    </Pressable>
                </View>

                {/* Tagline / Overview */}
                {movie.tagline && <Text style={styles.tagline}>"{movie.tagline}"</Text>}
                <Text style={styles.overview}>{movie.overview || movie.description || 'No description available.'}</Text>

                {/* Episodes (if series) */}
                {hasSeries && <EpisodeList seasons={seasons} />}

                {/* Cast */}
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

                {/* Recommendations */}
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
                                <Pressable onPress={() => router.push(`/movie/${item.id}`)} style={styles.recCard}>
                                    <Image source={{ uri: getPoster(item) }} style={styles.recPoster} contentFit="cover" />
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
    closeBtn: { position: 'absolute', top: 52, left: spacing.xl, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

    infoSection: { paddingHorizontal: spacing.xl, marginTop: -40 },
    infoRow: { flexDirection: 'row', gap: spacing.lg },
    infoPoster: { width: POSTER_W, height: POSTER_H, borderRadius: radius.md, backgroundColor: colors.surfaceLight },
    infoText: { flex: 1, paddingTop: 40 },
    title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black, lineHeight: 28 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
    meta: { color: colors.textMuted, fontSize: fontSize.sm },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
    ratingVal: { color: colors.warning, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
    genres: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm },

    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl },
    playActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 12, borderRadius: radius.md },
    playActionText: { color: '#000', fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    actionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },

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
    episodeItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    epNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
    epNumText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
    epTitle: { flex: 1, color: colors.text, fontSize: fontSize.md },
});
