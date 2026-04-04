import React from 'react';
import {
    View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { GET_WATCHLIST } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPosterUri } from '@/lib/utils';
import type { Movie } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');

// Helper removed — using shared getPosterUri from @/lib/utils

function WatchlistItem({ movie }: { movie: Movie }) {
    const router = useRouter();
    return (
        <Pressable onPress={() => router.push(`/movie/${movie.id}`)} style={styles.item}>
            <Image source={{ uri: getPosterUri(movie) }} style={styles.poster} contentFit="cover" transition={200} />
            <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{movie.title}</Text>
                {movie.year ? <Text style={styles.itemYear}>{movie.year}</Text> : null}
                {movie.genres?.length ? (
                    <Text style={styles.itemGenres} numberOfLines={1}>
                        {movie.genres.map(g => g.name).join(' • ')}
                    </Text>
                ) : null}
                <View style={styles.itemMeta}>
                    {movie.rating ? (
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color={colors.warning} />
                            <Text style={styles.ratingText}>{movie.rating.toFixed(1)}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
    );
}

export default function WatchlistScreen() {
    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const { data, loading, refetch } = useQuery<any>(GET_WATCHLIST, { skip: !isAuthenticated });

    const movies: Movie[] = data?.watchlist?.movies || [];

    if (!isAuthenticated) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="heart-outline" size={56} color={colors.textMuted} />
                <Text style={styles.centerTitle}>Your Watchlist</Text>
                <Text style={styles.centerSub}>Sign in to save your favorite movies</Text>
                <Pressable style={styles.authBtn} onPress={() => router.push('/auth/login')}>
                    <Text style={styles.authBtnText}>Sign In</Text>
                </Pressable>
            </View>
        );
    }

    if (loading && !data) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
                <Text style={styles.headerTitle}>My Watchlist</Text>
                <Text style={styles.headerCount}>{movies.length} {movies.length === 1 ? 'title' : 'titles'}</Text>
            </View>

            {movies.length > 0 ? (
                <FlatList
                    data={movies}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <WatchlistItem movie={item} />}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.primary} />}
                />
            ) : (
                <View style={styles.empty}>
                    <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyText}>Your watchlist is empty</Text>
                    <Text style={styles.emptySubText}>Tap the heart icon on any movie to add it here</Text>
                    <Pressable style={styles.browseBtn} onPress={() => router.push('/(tabs)/search')}>
                        <Text style={styles.browseBtnText}>Browse Movies</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl },
    centerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: spacing.lg },
    centerSub: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm, textAlign: 'center' },
    authBtn: { marginTop: spacing.xl, paddingHorizontal: 40, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md },
    authBtnText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },

    header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
    headerTitle: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: fontWeight.black },
    headerCount: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4 },

    list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    item: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    poster: { width: 56, height: 84, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },
    itemInfo: { flex: 1 },
    itemTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold },
    itemYear: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
    itemGenres: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
    itemMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    ratingText: { color: colors.warning, fontSize: fontSize.xs, fontWeight: fontWeight.bold },

    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    emptyText: { color: colors.textSecondary, fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginTop: spacing.lg },
    emptySubText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: 40 },
    browseBtn: { marginTop: spacing.xl, paddingHorizontal: 32, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md },
    browseBtnText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },
});
