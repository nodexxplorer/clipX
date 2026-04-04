
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable,
  StyleSheet, ActivityIndicator, Keyboard, Dimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SEARCH_MOVIES, GET_TRENDING, GET_HOME_DATA } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight, POSTER_ASPECT } from '@/constants/theme';
import { getPosterUri } from '@/lib/utils';
import type { Movie, Genre } from '@/types';

const { width: SW } = Dimensions.get('window');
const COLS = 3;
const GAP = spacing.md;
const CARD_W = (SW - spacing.xl * 2 - GAP * (COLS - 1)) / COLS;
const CARD_H = CARD_W / POSTER_ASPECT;

const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular' },
  { id: 'trending', label: 'Trending' },
  { id: 'rating', label: 'Top Rated' },
  { id: 'newest', label: 'Newest' },
];

const YEAR_OPTIONS = ['All', '2024', '2023', '2022', '2021', '2020', '2010s', '2000s'];
const RATING_OPTIONS = ['All', '9+', '8+', '7+', '6+'];

// Helper removed — using shared getPosterUri from @/lib/utils

function MovieCard({ movie }: { movie: Movie }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => { Keyboard.dismiss(); router.push(`/movie/${movie.id}` as any); }}
      style={styles.card}
    >
      <Image
        source={{ uri: getPosterUri(movie) }}
        style={styles.poster}
        contentFit="cover"
        transition={200}
      />
      <Text style={styles.cardTitle} numberOfLines={1}>{movie.title}</Text>
      {movie.voteAverage ? (
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={10} color={colors.warning} />
          <Text style={styles.ratingText}>{movie.voteAverage.toFixed(1)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();

  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [query, setQuery] = useState(params.q ?? '');
  const [activeSort, setActiveSort] = useState('popular');
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState('All');
  const [activeRating, setActiveRating] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const [search, { data: searchData, loading: searching }] = useLazyQuery<{ searchMovies: { items: Movie[]; totalCount: number } }>(SEARCH_MOVIES);
  const { data: trendingData } = useQuery<{ trending: Movie[] }>(GET_TRENDING, { variables: { limit: 24 } });
  const { data: homeData } = useQuery<{ genres: Genre[] }>(GET_HOME_DATA, { variables: { trendingLimit: 1, popularLimit: 1 } });

  const genres: Genre[] = homeData?.genres ?? [];

  // Auto-search on mount if q param exists
  useEffect(() => {
    if (params.q?.trim()) {
      setQuery(params.q);
      search({ variables: { query: params.q.trim(), limit: 40 } });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [params.q]);

  const onChangeText = useCallback((text: string) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    if (text.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        search({ variables: { query: text.trim(), limit: 40 } });
      }, 400);
    }
  }, [search]);

  const handleSubmit = () => {
    if (query.trim().length >= 2) {
      clearTimeout(debounceRef.current);
      search({ variables: { query: query.trim(), limit: 40 } });
    }
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    setQuery('');
    Keyboard.dismiss();
  };

  // Filter and sort results
  let results: Movie[] = query.trim().length >= 2
    ? (searchData?.searchMovies?.items ?? [])
    : (trendingData?.trending ?? []);

  // Apply genre filter
  if (activeGenre) {
    results = results.filter(m => m.genres?.some(g => g.id === activeGenre || g.slug === activeGenre));
  }

  // Apply rating filter
  if (activeRating !== 'All') {
    const minRating = parseFloat(activeRating.replace('+', ''));
    results = results.filter(m => (m.voteAverage ?? 0) >= minRating);
  }

  // Apply year filter
  if (activeYear !== 'All') {
    if (activeYear === '2010s') {
      results = results.filter(m => {
        const y = m.year ?? parseInt(m.releaseDate?.slice(0, 4) ?? '0');
        return y >= 2010 && y <= 2019;
      });
    } else if (activeYear === '2000s') {
      results = results.filter(m => {
        const y = m.year ?? parseInt(m.releaseDate?.slice(0, 4) ?? '0');
        return y >= 2000 && y <= 2009;
      });
    } else {
      results = results.filter(m => {
        const y = String(m.year ?? m.releaseDate?.slice(0, 4) ?? '');
        return y === activeYear;
      });
    }
  }

  // Sort
  if (activeSort === 'rating') {
    results = [...results].sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0));
  } else if (activeSort === 'newest') {
    results = [...results].sort((a, b) => {
      const ay = a.year ?? parseInt(a.releaseDate?.slice(0, 4) ?? '0');
      const by = b.year ?? parseInt(b.releaseDate?.slice(0, 4) ?? '0');
      return by - ay;
    });
  } else if (activeSort === 'popular') {
    results = [...results].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }

  const isSearching = query.trim().length >= 2;
  const totalCount = isSearching ? (searchData?.searchMovies?.totalCount ?? results.length) : results.length;
  const hasActiveFilters = activeGenre || activeYear !== 'All' || activeRating !== 'All';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Search Bar ── */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          placeholder="Search movies, series, anime..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          returnKeyType="search"
          autoCorrect={false}
        />
        {searching && <ActivityIndicator size="small" color={colors.primary} />}
        {query.length > 0 && !searching && (
          <Pressable onPress={clearSearch} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
        <Pressable
          onPress={() => setShowFilters(s => !s)}
          style={[styles.filterToggle, (showFilters || hasActiveFilters) && styles.filterToggleActive]}
          hitSlop={8}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={showFilters || hasActiveFilters ? colors.primary : colors.textMuted}
          />
          {hasActiveFilters && <View style={styles.filterDot} />}
        </Pressable>
      </View>

      {/* ── Filters Panel ── */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Sort */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {SORT_OPTIONS.map(s => (
                <Pressable
                  key={s.id}
                  style={[styles.chip, activeSort === s.id && styles.chipActive]}
                  onPress={() => setActiveSort(s.id)}
                >
                  <Text style={[styles.chipText, activeSort === s.id && styles.chipTextActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Genre */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Genre</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Pressable
                style={[styles.chip, !activeGenre && styles.chipActive]}
                onPress={() => setActiveGenre(null)}
              >
                <Text style={[styles.chipText, !activeGenre && styles.chipTextActive]}>All</Text>
              </Pressable>
              {genres.slice(0, 12).map(g => (
                <Pressable
                  key={g.id}
                  style={[styles.chip, activeGenre === g.id && styles.chipActive]}
                  onPress={() => setActiveGenre(activeGenre === g.id ? null : g.id)}
                >
                  <Text style={[styles.chipText, activeGenre === g.id && styles.chipTextActive]}>
                    {g.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Year */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Year</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {YEAR_OPTIONS.map(y => (
                <Pressable
                  key={y}
                  style={[styles.chip, activeYear === y && styles.chipActive]}
                  onPress={() => setActiveYear(y)}
                >
                  <Text style={[styles.chipText, activeYear === y && styles.chipTextActive]}>{y}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Rating */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Rating</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {RATING_OPTIONS.map(r => (
                <Pressable
                  key={r}
                  style={[styles.chip, activeRating === r && styles.chipActive]}
                  onPress={() => setActiveRating(r)}
                >
                  <Text style={[styles.chipText, activeRating === r && styles.chipTextActive]}>{r}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {hasActiveFilters && (
            <Pressable
              onPress={() => { setActiveGenre(null); setActiveYear('All'); setActiveRating('All'); setActiveSort('popular'); }}
              style={styles.clearFilters}
            >
              <Ionicons name="refresh" size={14} color={colors.error} />
              <Text style={styles.clearFiltersText}>Clear all filters</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── Section Header ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {isSearching ? `Results for "${query}"` : '🔥 Trending'}
        </Text>
        {isSearching && (
          <Text style={styles.resultCount}>{totalCount} found</Text>
        )}
      </View>

      {/* ── Grid ── */}
      {results.length > 0 ? (
        <FlatList
          data={results}
          numColumns={COLS}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => <MovieCard movie={item} />}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      ) : isSearching && !searching ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={52} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No results for "{query}"</Text>
          <Text style={styles.emptySubText}>Try a different search term or remove filters</Text>
        </View>
      ) : !isSearching && !trendingData ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.xl, marginTop: spacing.md, marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontSize: fontSize.md, paddingVertical: 0 },
  filterToggle: { padding: 2, position: 'relative' },
  filterToggleActive: {},
  filterDot: {
    position: 'absolute', top: 0, right: 0,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  filtersPanel: {
    backgroundColor: colors.surface, borderBottomWidth: 1,
    borderBottomColor: colors.border, paddingBottom: spacing.md,
  },
  filterRow: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  filterLabel: {
    color: colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.bold,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm,
  },
  chips: { gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    backgroundColor: colors.surfaceLight, borderRadius: radius.round,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: fontSize.sm },
  chipTextActive: { color: '#fff', fontWeight: fontWeight.semibold },
  clearFilters: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.xl, marginTop: spacing.md,
  },
  clearFiltersText: { color: colors.error, fontSize: fontSize.sm },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, marginTop: spacing.md, marginBottom: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  resultCount: { color: colors.textMuted, fontSize: fontSize.sm },
  grid: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  gridRow: { gap: GAP, marginBottom: GAP },
  card: { width: CARD_W },
  poster: { width: CARD_W, height: CARD_H, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },
  cardTitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 4, fontWeight: fontWeight.medium },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  ratingText: { color: colors.textMuted, fontSize: 9, fontWeight: fontWeight.bold },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyTitle: { color: colors.textSecondary, fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginTop: spacing.lg },
  emptySubText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: 'center' },
});