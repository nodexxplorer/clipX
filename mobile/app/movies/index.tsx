import React, { useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, Dimensions, ActivityIndicator, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { GET_MOVIES, GET_TRENDING } from '@/lib/graphql';
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

type SortOption = 'popularity' | 'release_date' | 'vote_average' | 'title';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'popularity', label: 'Popular' },
  { value: 'release_date', label: 'Newest' },
  { value: 'vote_average', label: 'Top Rated' },
  { value: 'title', label: 'A–Z' },
];

export default function MoviesListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [sort, setSort] = useState<SortOption>('popularity');

  const category = params.category || 'all';
  const pageTitle = category === 'trending' ? '🔥 Trending' :
                    category === 'featured' ? '⭐ Featured' :
                    category === 'recent' ? '🆕 Recent' : '🎬 All Movies';

  const isTrending = category === 'trending';

  const { data: trendData, loading: trendLoading } = useQuery<any>(GET_TRENDING, {
    variables: { limit: 50 },
    skip: !isTrending,
  });

  const { data: moviesData, loading: moviesLoading, fetchMore } = useQuery<any>(GET_MOVIES, {
    variables: {
      limit: 24,
      offset: 0,
      sort,
      filter: category === 'featured' ? { featured: true } :
              category === 'recent' ? { recent: true } : undefined,
    },
    skip: isTrending,
  });

  const loading = isTrending ? trendLoading : moviesLoading;
  const movies: Movie[] = isTrending
    ? (trendData?.trending || [])
    : (moviesData?.movies?.movies || []);
  const hasMore = !isTrending && (moviesData?.movies?.hasMore ?? false);

  const loadMore = () => {
    if (!hasMore || loading) return;
    fetchMore({ variables: { offset: movies.length } });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{pageTitle}</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Sort pills */}
      {!isTrending && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortRow}>
          {sortOptions.map(opt => (
            <Pressable key={opt.value} onPress={() => setSort(opt.value)}
              style={[styles.sortPill, sort === opt.value && styles.sortPillActive]}>
              <Text style={[styles.sortText, sort === opt.value && styles.sortTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Grid */}
      {loading && !movies.length ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
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
              {item.voteAverage ? (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={10} color={colors.warning} />
                  <Text style={styles.ratingText}>{item.voteAverage.toFixed(1)}</Text>
                </View>
              ) : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="film-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No movies found</Text>
            </View>
          }
          ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} style={{ padding: 20 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.sm },
  backBtn: { padding: spacing.sm },
  headerTitle: { flex: 1, color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black, textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.lg, marginTop: spacing.lg },

  sortRow: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.lg },
  sortPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.round, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
  sortPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  sortTextActive: { color: '#fff' },

  grid: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  gridRow: { gap: GAP, marginBottom: GAP },
  card: { width: CARD_W },
  poster: { width: CARD_W, height: CARD_H, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },
  cardTitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 4, fontWeight: fontWeight.medium },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  ratingText: { color: colors.textMuted, fontSize: 9, fontWeight: fontWeight.bold },
});
