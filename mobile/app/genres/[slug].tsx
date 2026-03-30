import React from 'react';
import {
    View, Text, FlatList, Pressable, StyleSheet, Dimensions, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { GET_MOVIES } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight, POSTER_ASPECT } from '@/constants/theme';
import type { Movie } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS = 3;
const GAP = spacing.md;
const CARD_W = (SCREEN_W - spacing.xl * 2 - GAP * (COLS - 1)) / COLS;
const CARD_H = CARD_W / POSTER_ASPECT;

function getPoster(m: Movie) {
    return m.posterUrl || (m.posterPath ? `https://image.tmdb.org/t/p/w342${m.posterPath}` : undefined);
}

export default function GenreScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const router = useRouter();
    const genreName = slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Genre';

    const { data, loading, fetchMore } = useQuery<any>(GET_MOVIES, {
        variables: { limit: 24, offset: 0, filter: { genre: slug } },
    });

    const movies: Movie[] = data?.movies?.movies || [];
    const hasMore = data?.movies?.hasMore ?? false;

    const loadMore = () => {
        if (!hasMore || loading) return;
        fetchMore({ variables: { offset: movies.length } });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>{genreName}</Text>
                <View style={{ width: 38 }} />
            </View>

            {loading && !data ? (
                <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : movies.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="film-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No movies in this genre</Text>
                </View>
            ) : (
                <FlatList
                    data={movies}
                    numColumns={COLS}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={styles.gridRow}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <Pressable onPress={() => router.push(`/movie/${item.id}`)} style={styles.card}>
                            <Image source={{ uri: getPoster(item) }} style={styles.poster} contentFit="cover" transition={200} />
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                        </Pressable>
                    )}
                    ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} style={{ padding: 20 }} /> : null}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md },
    backBtn: { padding: spacing.sm },
    headerTitle: { flex: 1, color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black, textAlign: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: colors.textMuted, fontSize: fontSize.lg, marginTop: spacing.lg },
    grid: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    gridRow: { gap: GAP, marginBottom: GAP },
    card: { width: CARD_W },
    poster: { width: CARD_W, height: CARD_H, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },
    cardTitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 4, fontWeight: fontWeight.medium },
});
