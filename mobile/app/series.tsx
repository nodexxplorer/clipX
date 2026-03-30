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

export default function SeriesScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const isAnime = type === 'anime';
  const pageTitle = isAnime ? '🎌 Anime' : '📺 Series';

  const { data, loading, fetchMore } = useQuery<any>(GET_MOVIES, {
    variables: {
      limit: 24,
      offset: 0,
      filter: isAnime ? { genre: 'animation', type: 'series' } : { type: 'series' },
    },
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
        <Text style={styles.headerTitle}>{pageTitle}</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Quick Filter */}
      <View style={styles.filterRow}>
        <Pressable style={[styles.filterChip, !isAnime && styles.filterActive]}
          onPress={() => router.setParams({ type: '' })}>
          <Text style={[styles.filterText, !isAnime && styles.filterTextActive]}>Series</Text>
        </Pressable>
        <Pressable style={[styles.filterChip, isAnime && styles.filterActive]}
          onPress={() => router.setParams({ type: 'anime' })}>
          <Text style={[styles.filterText, isAnime && styles.filterTextActive]}>Anime</Text>
        </Pressable>
      </View>

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
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="tv-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No series found</Text>
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

  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  filterChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: radius.round, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  filterTextActive: { color: '#fff' },

  grid: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  gridRow: { gap: GAP, marginBottom: GAP },
  card: { width: CARD_W },
  poster: { width: CARD_W, height: CARD_H, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },
  cardTitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 4, fontWeight: fontWeight.medium },
});
