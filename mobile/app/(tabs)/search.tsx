import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, FlatList, Pressable,
    StyleSheet, ActivityIndicator, Keyboard, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useLazyQuery, useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { SEARCH_MOVIES, GET_TRENDING } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight, POSTER_ASPECT } from '@/constants/theme';
import type { Movie } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = spacing.md;
const COLS = 3;
const CARD_W = (SCREEN_W - spacing.xl * 2 - GRID_GAP * (COLS - 1)) / COLS;
const CARD_H = CARD_W / POSTER_ASPECT;

function getPoster(m: Movie) {
    return m.posterUrl || (m.posterPath ? `https://image.tmdb.org/t/p/w342${m.posterPath}` : undefined);
}

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [search, { data: searchData, loading: searching }] = useLazyQuery(SEARCH_MOVIES);
    const { data: trendingData } = useQuery(GET_TRENDING, { variables: { limit: 18 } });

    const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

    const onChangeText = useCallback((text: string) => {
        setQuery(text);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (text.trim().length >= 2) {
            debounceRef.current = setTimeout(() => {
                search({ variables: { query: text.trim(), limit: 30 } });
            }, 400);
        }
    }, [search]);

    const results: Movie[] = query.trim().length >= 2
        ? (searchData?.searchMovies?.items || [])
        : (trendingData?.trending || []);

    const sectionTitle = query.trim().length >= 2
        ? `Results (${searchData?.searchMovies?.totalCount || 0})`
        : '🔥 Trending';

    const renderItem = ({ item }: { item: Movie }) => (
        <Pressable onPress={() => { Keyboard.dismiss(); router.push(`/movie/${item.id}`); }} style={styles.card}>
            <Image source={{ uri: getPoster(item) }} style={styles.poster} contentFit="cover" transition={200} />
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {item.voteAverage ? (
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={10} color={colors.warning} />
                    <Text style={styles.ratingText}>{item.voteAverage.toFixed(1)}</Text>
                </View>
            ) : null}
        </Pressable>
    );

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput
                    style={styles.input}
                    placeholder="Search movies, series, anime..."
                    placeholderTextColor={colors.textMuted}
                    value={query}
                    onChangeText={onChangeText}
                    autoCapitalize="none"
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <Pressable onPress={() => { setQuery(''); Keyboard.dismiss(); }}>
                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </Pressable>
                )}
            </View>

            {/* Section Title */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                {searching && <ActivityIndicator size="small" color={colors.primary} />}
            </View>

            {/* Results Grid */}
            {results.length > 0 ? (
                <FlatList
                    data={results}
                    numColumns={COLS}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={styles.gridRow}
                    renderItem={renderItem}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                />
            ) : query.trim().length >= 2 && !searching ? (
                <View style={styles.empty}>
                    <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No results for "{query}"</Text>
                    <Text style={styles.emptySubText}>Try a different search term</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
        marginHorizontal: spacing.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        backgroundColor: colors.surfaceLight, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    },
    input: { flex: 1, color: colors.text, fontSize: fontSize.md, paddingVertical: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.md },
    sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    grid: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    gridRow: { gap: GRID_GAP, marginBottom: GRID_GAP },
    card: { width: CARD_W },
    poster: { width: CARD_W, height: CARD_H, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },
    cardTitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 4, fontWeight: fontWeight.medium },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
    ratingText: { color: colors.textMuted, fontSize: 9, fontWeight: fontWeight.bold },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    emptyText: { color: colors.textSecondary, fontSize: fontSize.lg, marginTop: spacing.lg, fontWeight: fontWeight.bold },
    emptySubText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
});
