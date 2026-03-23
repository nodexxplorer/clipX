import React from 'react';
import {
  View, Text, ScrollView, FlatList, Pressable, Dimensions,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GET_HOME_DATA } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight, POSTER_ASPECT } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import type { Movie } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POSTER_WIDTH = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md * 2) / 3;
const POSTER_HEIGHT = POSTER_WIDTH / POSTER_ASPECT;

function getPosterUri(movie: Movie): string | undefined {
  if (movie.posterUrl) return movie.posterUrl;
  if (movie.posterPath) return `https://image.tmdb.org/t/p/w342${movie.posterPath}`;
  return undefined;
}

function getBackdropUri(movie: Movie): string | undefined {
  if (movie.backdropUrl) return movie.backdropUrl;
  if (movie.backdropPath) return `https://image.tmdb.org/t/p/w780${movie.backdropPath}`;
  return undefined;
}

// Hero Banner
function HeroBanner({ movie }: { movie: Movie }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(`/movie/${movie.id}`)} style={styles.hero}>
      <Image source={{ uri: getBackdropUri(movie) }} style={styles.heroImage} contentFit="cover" transition={300} />
      <LinearGradient colors={['transparent', 'rgba(5,6,7,0.7)', colors.background]} style={styles.heroGradient} />
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle} numberOfLines={2}>{movie.title}</Text>
        <Text style={styles.heroSub} numberOfLines={2}>{movie.overview}</Text>
        <View style={styles.heroActions}>
          <Pressable style={styles.playBtn} onPress={() => router.push(`/watch/${movie.id}`)}>
            <Ionicons name="play" size={18} color="#000" />
            <Text style={styles.playBtnText}>Play</Text>
          </Pressable>
          <Pressable style={styles.infoBtn} onPress={() => router.push(`/movie/${movie.id}`)}>
            <Ionicons name="information-circle-outline" size={18} color="#fff" />
            <Text style={styles.infoBtnText}>Info</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// Movie Poster Card
function MovieCard({ movie }: { movie: Movie }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/movie/${movie.id}`)}
      style={styles.movieCard}
    >
      <Image source={{ uri: getPosterUri(movie) }} style={styles.moviePoster} contentFit="cover" transition={200} />
      {movie.voteAverage ? (
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={8} color={colors.warning} />
          <Text style={styles.ratingText}>{movie.voteAverage.toFixed(1)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// Movie Row
function MovieRow({ title, movies }: { title: string; movies: Movie[] }) {
  return (
    <View style={styles.rowContainer}>
      <Text style={styles.rowTitle}>{title}</Text>
      <FlatList
        data={movies}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.rowList}
        renderItem={({ item }) => <MovieCard movie={item} />}
      />
    </View>
  );
}

// Empty state
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="film-outline" size={48} color={colors.textMuted} />
      <Text style={styles.emptyText}>No movies available</Text>
      <Text style={styles.emptySubText}>Pull to refresh or try again later</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useQuery(GET_HOME_DATA, {
    variables: { trendingLimit: 20, popularLimit: 20 },
  });

  const trending: Movie[] = data?.trending || [];
  const popular: Movie[] = data?.popular || [];
  const featured = trending[0];

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Failed to load movies</Text>
        <Text style={styles.errorSubText}>{error.message}</Text>
        <Pressable style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (!trending.length && !popular.length) return <EmptyState />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.primary} />}
    >
      {featured && <HeroBanner movie={featured} />}

      {user && (
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            Welcome back, <Text style={styles.greetingName}>{user.name?.split(' ')[0] || 'there'}</Text> 👋
          </Text>
        </View>
      )}

      <MovieRow title="🔥 Trending Now" movies={trending} />
      <MovieRow title="⭐ Popular" movies={popular} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 100 },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl },
  errorText: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginTop: spacing.lg },
  errorSubText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.sm, textAlign: 'center' },
  retryBtn: { marginTop: spacing.xl, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md },
  retryText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },
  emptyState: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.lg, marginTop: spacing.lg },
  emptySubText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },

  // Hero
  hero: { height: 420, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 },
  heroContent: { position: 'absolute', bottom: spacing.xxl, left: spacing.xl, right: spacing.xl },
  heroTitle: { color: '#fff', fontSize: fontSize.xxxl, fontWeight: fontWeight.black, letterSpacing: -0.5 },
  heroSub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs, lineHeight: 20 },
  heroActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.sm },
  playBtnText: { color: '#000', fontWeight: fontWeight.bold, fontSize: fontSize.md },
  infoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.sm },
  infoBtnText: { color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.md },

  // Greeting
  greeting: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  greetingText: { color: colors.textSecondary, fontSize: fontSize.md },
  greetingName: { color: colors.primary, fontWeight: fontWeight.bold },

  // Movie Row
  rowContainer: { marginTop: spacing.xxl },
  rowTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
  rowList: { paddingHorizontal: spacing.xl, gap: spacing.md },
  movieCard: { width: POSTER_WIDTH, position: 'relative' },
  moviePoster: { width: POSTER_WIDTH, height: POSTER_HEIGHT, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },
  ratingBadge: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  ratingText: { color: '#fff', fontSize: 9, fontWeight: fontWeight.bold },
});
