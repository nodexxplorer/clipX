/**
 * clipX — Home / Landing Screen
 * Matches the web version: hero auto-rotate, trending rows, features,
 * genre grid, AI recommendations banner, pull-to-refresh, animations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, Pressable, Dimensions,
  StyleSheet, ActivityIndicator, RefreshControl, Animated,
  NativeScrollEvent, NativeSyntheticEvent, TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GET_HOME_DATA } from '@/lib/graphql';
import {
  colors, spacing, radius, fontSize, fontWeight,
  POSTER_ASPECT, BACKDROP_ASPECT,
} from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import type { Movie, Genre } from '@/types';

const { width: SW, height: SH } = Dimensions.get('window');
const HERO_HEIGHT = SH * 0.58;
const POSTER_W = (SW - spacing.xl * 2 - spacing.md * 2) / 3;
const POSTER_H = POSTER_W / POSTER_ASPECT;
const WIDE_W = SW * 0.68;
const WIDE_H = WIDE_W / BACKDROP_ASPECT;

// ─── helpers ────────────────────────────────────────────────────────────────

function posterUri(m: Movie) {
  if (m.posterUrl) return m.posterUrl;
  if (m.posterPath) return `https://image.tmdb.org/t/p/w342${m.posterPath}`;
  return null;
}

function backdropUri(m: Movie) {
  if (m.backdropUrl) return m.backdropUrl;
  if (m.backdropPath) return `https://image.tmdb.org/t/p/w780${m.backdropPath}`;
  return posterUri(m);
}

function ratingColor(r: number) {
  if (r >= 7.5) return colors.success;
  if (r >= 6) return colors.warning;
  return colors.error;
}

// ─── STICKY SEARCH BAR ────────────────────────────────────────────────────────

function StickySearchBar({ scrollY }: { scrollY: Animated.Value }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const bgOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const borderOpacity = scrollY.interpolate({
    inputRange: [40, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleSubmit = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}` as any);
      setQuery('');
    } else {
      router.push('/search' as any);
    }
  };

  return (
    <View style={[styles.stickyWrapper, { paddingTop: insets.top }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity, backgroundColor: 'rgba(5,6,7,0.88)' }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { borderBottomWidth: 1, borderBottomColor: colors.border, opacity: borderOpacity }]} />

      <View style={styles.stickyInner}>
        <Text style={styles.stickyLogo}>
          clip<Text style={{ color: colors.primary }}>X</Text>
        </Text>

        <Pressable style={styles.searchBox} onPress={() => inputRef.current?.focus()}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search movies, series..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </Pressable>

        <Pressable style={styles.notifBtn} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <View style={styles.notifDot} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── HERO BANNER (auto-rotates every 6 s) ────────────────────────────────────

function HeroBanner({ movies }: { movies: Movie[] }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pool = movies.filter(m => m.backdropPath || m.backdropUrl).slice(0, 8);
  const movie = pool[idx] ?? movies[0];

  // Auto-rotate
  useEffect(() => {
    if (pool.length < 2) return;
    const timer = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.04, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        setIdx(i => (i + 1) % pool.length);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [pool.length]);

  if (!movie) return null;

  return (
    <View style={[styles.hero, { height: HERO_HEIGHT }]}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={{ uri: backdropUri(movie) ?? '' }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
      </Animated.View>

      {/* Gradients */}
      <LinearGradient
        colors={['rgba(5,6,7,0.25)', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: 120 }]}
      />
      <LinearGradient
        colors={['transparent', 'rgba(5,6,7,0.75)', colors.background]}
        style={[StyleSheet.absoluteFill, { top: HERO_HEIGHT * 0.35 }]}
      />

      {/* Dot indicators */}
      {pool.length > 1 && (
        <View style={styles.heroDots}>
          {pool.map((_, i) => (
            <Pressable key={i} onPress={() => setIdx(i)}>
              <View style={[styles.heroDot, i === idx && styles.heroDotActive]} />
            </Pressable>
          ))}
        </View>
      )}

      {/* Content */}
      <View style={styles.heroContent}>
        {/* Genre tags */}
        {movie.genres && movie.genres.length > 0 && (
          <View style={styles.heroGenres}>
            {movie.genres.slice(0, 3).map(g => (
              <View key={g.id} style={styles.heroGenreTag}>
                <Text style={styles.heroGenreText}>{g.name}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.heroTitle} numberOfLines={2}>{movie.title}</Text>

        {/* Meta row */}
        <View style={styles.heroMeta}>
          {movie.voteAverage ? (
            <View style={styles.heroRating}>
              <Ionicons name="star" size={12} color={colors.warning} />
              <Text style={[styles.heroMetaText, { color: ratingColor(movie.voteAverage) }]}>
                {movie.voteAverage.toFixed(1)}
              </Text>
            </View>
          ) : null}
          {movie.year || movie.releaseDate ? (
            <Text style={styles.heroMetaText}>
              {movie.year ?? movie.releaseDate?.slice(0, 4)}
            </Text>
          ) : null}
          {movie.runtime ? (
            <Text style={styles.heroMetaText}>{movie.runtime} min</Text>
          ) : null}
        </View>

        <Text style={styles.heroOverview} numberOfLines={2}>{movie.overview}</Text>

        {/* CTA Buttons */}
        <View style={styles.heroActions}>
          <Pressable
            style={styles.playBtn}
            onPress={() => router.push(`/watch/${movie.id}` as any)}
          >
            <Ionicons name="play" size={16} color="#000" />
            <Text style={styles.playBtnText}>Play Now</Text>
          </Pressable>
          <Pressable
            style={styles.infoBtn}
            onPress={() => router.push(`/movie/${movie.id}` as any)}
          >
            <Ionicons name="information-circle-outline" size={16} color="#fff" />
            <Text style={styles.infoBtnText}>More Info</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── MOVIE CARD (poster) ─────────────────────────────────────────────────────

function MovieCard({ movie }: { movie: Movie }) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const uri = posterUri(movie);

  return (
    <Pressable
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
      onPress={() => router.push(`/movie/${movie.id}` as any)}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={{ uri: uri ?? '' }}
          style={styles.cardPoster}
          contentFit="cover"
          transition={200}
          placeholder={{ color: colors.surfaceLight }}
        />
        {movie.voteAverage ? (
          <View style={styles.cardRating}>
            <Ionicons name="star" size={8} color={colors.warning} />
            <Text style={styles.cardRatingText}>{movie.voteAverage.toFixed(1)}</Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

// ─── WIDE CARD (backdrop) — for "Top Rated" row ──────────────────────────────

function WideCard({ movie }: { movie: Movie }) {
  const router = useRouter();
  const uri = backdropUri(movie);

  return (
    <Pressable onPress={() => router.push(`/movie/${movie.id}` as any)} style={styles.wideCard}>
      <Image
        source={{ uri: uri ?? '' }}
        style={styles.wideImage}
        contentFit="cover"
        transition={200}
        placeholder={{ color: colors.surfaceLight }}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.wideGradient}
      />
      <View style={styles.wideContent}>
        <Text style={styles.wideTitle} numberOfLines={1}>{movie.title}</Text>
        {movie.voteAverage ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="star" size={10} color={colors.warning} />
            <Text style={styles.wideRating}>{movie.voteAverage.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>
      <Pressable
        style={styles.widePlay}
        onPress={() => router.push(`/watch/${movie.id}` as any)}
      >
        <Ionicons name="play-circle" size={38} color="rgba(255,255,255,0.9)" />
      </Pressable>
    </Pressable>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

// ─── MOVIE ROW (poster grid) ──────────────────────────────────────────────────

function MovieRow({ title, movies, onSeeAll }: { title: string; movies: Movie[]; onSeeAll?: () => void }) {
  if (!movies.length) return null;
  return (
    <View style={styles.rowContainer}>
      <SectionHeader title={title} onSeeAll={onSeeAll} />
      <FlatList
        data={movies}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.rowList}
        renderItem={({ item }) => <MovieCard movie={item} />}
      />
    </View>
  );
}

// ─── WIDE ROW (backdrop cards) ────────────────────────────────────────────────

function WideRow({ title, movies, onSeeAll }: { title: string; movies: Movie[]; onSeeAll?: () => void }) {
  if (!movies.length) return null;
  return (
    <View style={styles.rowContainer}>
      <SectionHeader title={title} onSeeAll={onSeeAll} />
      <FlatList
        data={movies}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.rowList}
        renderItem={({ item }) => <WideCard movie={item} />}
      />
    </View>
  );
}

// ─── GENRE CHIP ───────────────────────────────────────────────────────────────

const GENRE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Action: 'flash', Comedy: 'happy', Drama: 'film', Horror: 'skull',
  Romance: 'heart', Thriller: 'eye', Animation: 'color-palette',
  Documentary: 'book', 'Sci-Fi': 'planet', Fantasy: 'sparkles',
  Crime: 'shield', Adventure: 'compass',
};

function GenreChip({ genre }: { genre: Genre }) {
  const router = useRouter();
  const icon = GENRE_ICONS[genre.name] ?? 'grid';
  return (
    <Pressable
      style={styles.genreChip}
      onPress={() => router.push(`/genres/${genre.slug}` as any)}
    >
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={styles.genreChipText}>{genre.name}</Text>
    </Pressable>
  );
}

// ─── FEATURES SECTION ─────────────────────────────────────────────────────────

const FEATURES = [
  { icon: 'flash' as const, label: 'AI Picks', desc: 'Personalized for you', color: colors.accent },
  { icon: 'globe' as const, label: 'Stream Anywhere', desc: 'Any device, anytime', color: colors.primary },
  { icon: 'download' as const, label: 'Download', desc: 'Watch offline', color: colors.success },
  { icon: 'shield-checkmark' as const, label: 'Ad-Free', desc: 'Pro tier', color: colors.warning },
];

function FeaturesSection() {
  return (
    <View style={styles.featuresSection}>
      <SectionHeader title="Why clipX?" />
      <View style={styles.featuresGrid}>
        {FEATURES.map(f => (
          <View key={f.label} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: f.color + '22' }]}>
              <Ionicons name={f.icon} size={20} color={f.color} />
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── PRO UPGRADE BANNER ───────────────────────────────────────────────────────

function UpgradeBanner({ plan }: { plan: string }) {
  const router = useRouter();
  if (plan === 'pro') return null;
  return (
    <Pressable
      style={styles.upgradeBanner}
      onPress={() => router.push('/subscription/plans' as any)}
    >
      <LinearGradient
        colors={['#1e1040', '#0e2a4a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.upgradeBannerInner}
      >
        <View style={styles.upgradeBannerLeft}>
          <Text style={styles.upgradeBannerLabel}>
            {plan === 'free' ? '🚀 Go Premium' : '⚡ Upgrade to Pro'}
          </Text>
          <Text style={styles.upgradeBannerSub}>
            {plan === 'free'
              ? 'Remove ads • HD streaming • More downloads'
              : '4K + AI recommendations + Unlimited downloads'}
          </Text>
        </View>
        <View style={styles.upgradeBannerBtn}>
          <Text style={styles.upgradeBannerBtnText}>Upgrade</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// ─── CONTINUE WATCHING CARD ───────────────────────────────────────────────────

function ContinueCard({ movie, progress }: { movie: Movie; progress: number }) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.continueCard}
      onPress={() => router.push(`/watch/${movie.id}` as any)}
    >
      <Image
        source={{ uri: backdropUri(movie) ?? '' }}
        style={styles.continueImage}
        contentFit="cover"
        placeholder={{ color: colors.surfaceLight }}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.continueGradient}
      />
      <View style={styles.continueInfo}>
        <Text style={styles.continueTitle} numberOfLines={1}>{movie.title}</Text>
        <View style={styles.continueBar}>
          <View style={[styles.continueFill, { width: `${Math.min(progress * 100, 100)}%` as any }]} />
        </View>
      </View>
      <View style={styles.continuePlayIcon}>
        <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
      </View>
    </Pressable>
  );
}

// ─── GREETING ────────────────────────────────────────────────────────────────

function Greeting({ name, plan }: { name: string; plan: string }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const PLAN_COLOR: Record<string, string> = {
    free: colors.free, standard: colors.standard, pro: colors.pro,
  };
  return (
    <View style={styles.greeting}>
      <Text style={styles.greetingText}>
        {greet}, <Text style={{ color: colors.primary, fontWeight: fontWeight.bold }}>{name.split(' ')[0]}</Text> 👋
      </Text>
      <View style={[styles.planBadge, { backgroundColor: PLAN_COLOR[plan] + '33', borderColor: PLAN_COLOR[plan] + '55' }]}>
        <Text style={[styles.planText, { color: PLAN_COLOR[plan] }]}>
          {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </Text>
      </View>
    </View>
  );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────

function Skeleton() {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <ScrollView style={styles.container} scrollEnabled={false}>
      <Animated.View style={[styles.skeletonHero, { opacity: anim }]} />
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        {[1, 2].map(r => (
          <View key={r}>
            <Animated.View style={[styles.skeletonTitle, { opacity: anim }]} />
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
              {[1, 2, 3].map(c => (
                <Animated.View key={c} style={[styles.skeletonCard, { opacity: anim }]} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Sticky bar height approx: insets.top + 56px
  const STICKY_H = insets.top + 56;

  const { data, loading, error, refetch } = useQuery(GET_HOME_DATA, {
    variables: { trendingLimit: 20, popularLimit: 20 },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ── Loading skeleton
  if (loading && !data) return <Skeleton />;

  // ── Error state
  if (error && !data) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={56} color={colors.error} />
        <Text style={styles.errorTitle}>Couldn't load movies</Text>
        <Text style={styles.errorSub}>{error.message}</Text>
        <Pressable style={styles.retryBtn} onPress={() => refetch()}>
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const trending: Movie[] = data?.trending ?? [];
  const popular: Movie[] = data?.popular ?? [];
  const genres: Genre[] = data?.genres ?? [];

  // Pick best hero movies (have backdrop + overview)
  const heroPool = trending.filter(m => (m.backdropPath || m.backdropUrl) && m.overview);

  // Simulate continue watching from first 3 trending (replace with real data)
  const continueWatching = trending.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* ── Sticky Search Bar (always on top) ── */}
      <StickySearchBar scrollY={scrollY} />

      <Animated.ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={[styles.scrollContent, { paddingTop: STICKY_H }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={STICKY_H}
          />
        }
      >
      {/* ── Hero Banner ── */}
      {heroPool.length > 0 && <HeroBanner movies={heroPool} />}

      {/* ── Greeting + Plan Badge ── */}
      {user && (
        <Greeting
          name={user.name ?? 'there'}
          plan={user.subscriptionTier ?? 'free'}
        />
      )}

      {/* ── Upgrade Banner (non-pro) ── */}
      {user && <UpgradeBanner plan={user.subscriptionTier ?? 'free'} />}

      {/* ── Continue Watching ── */}
      {user && continueWatching.length > 0 && (
        <View style={styles.rowContainer}>
          <SectionHeader title="▶  Continue Watching" />
          <FlatList
            data={continueWatching}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.rowList}
            renderItem={({ item, index }) => (
              <ContinueCard movie={item} progress={0.3 + index * 0.2} />
            )}
          />
        </View>
      )}

      {/* ── Trending Now ── */}
      <MovieRow
        title="🔥 Trending Now"
        movies={trending}
        onSeeAll={() => router.push('/movies/trending' as any)}
      />

      {/* ── Features ── */}
      <FeaturesSection />

      {/* ── Top Rated Wide Cards ── */}
      <WideRow
        title="⭐ Top Rated"
        movies={popular.slice(0, 10)}
        onSeeAll={() => router.push('/movies' as any)}
      />

      {/* ── Genre Grid ── */}
      {genres.length > 0 && (
        <View style={styles.rowContainer}>
          <SectionHeader
            title="Browse Genres"
            onSeeAll={() => router.push('/genres' as any)}
          />
          <View style={styles.genreGrid}>
            {genres.slice(0, 10).map(g => (
              <GenreChip key={g.id} genre={g} />
            ))}
          </View>
        </View>
      )}

      {/* ── Popular Row ── */}
      <MovieRow
        title="🌟 Popular Picks"
        movies={popular}
        onSeeAll={() => router.push('/movies' as any)}
      />

      {/* ── AI Recommendation Banner (Pro) ── */}
      {user?.subscriptionTier === 'pro' && (
        <Pressable
          style={styles.aiBanner}
          onPress={() => router.push('/recommendations' as any)}
        >
          <LinearGradient
            colors={['#1a0536', '#051830']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiBannerInner}
          >
            <Ionicons name="sparkles" size={28} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.aiBannerTitle}>Your AI Picks Are Ready</Text>
              <Text style={styles.aiBannerSub}>Personalized recommendations just for you</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.accent} />
          </LinearGradient>
        </Pressable>
      )}
      </Animated.ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 110 },

  // ── Error
  errorContainer: {
    flex: 1, backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl,
  },
  errorTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: spacing.lg },
  errorSub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.sm, textAlign: 'center' },
  retryBtn: {
    marginTop: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md, borderRadius: radius.md,
  },
  retryText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },

  // ── Sticky Search Bar
  stickyWrapper: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
  },
  stickyInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    gap: spacing.sm, height: 56,
  },
  stickyLogo: {
    color: '#fff', fontSize: 18, fontWeight: fontWeight.black,
    letterSpacing: -0.5, minWidth: 52,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.round,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: {
    flex: 1, color: colors.text, fontSize: fontSize.sm,
    paddingVertical: 0,
  },
  notifBtn: { position: 'relative', padding: 4 },
  notifDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.error, borderWidth: 1.5,
    borderColor: colors.background,
  },

  // ── Hero
  hero: { position: 'relative', overflow: 'hidden' },
  heroDots: {
    position: 'absolute', bottom: spacing.xxxl + 90, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6, zIndex: 10,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  heroDotActive: { width: 20, backgroundColor: colors.primary },
  heroContent: { position: 'absolute', bottom: spacing.xxl, left: spacing.xl, right: spacing.xl, zIndex: 10 },
  heroGenres: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  heroGenreTag: {
    backgroundColor: 'rgba(8,145,178,0.25)', borderWidth: 1,
    borderColor: 'rgba(8,145,178,0.4)', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: radius.sm,
  },
  heroGenreText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  heroTitle: { color: '#fff', fontSize: fontSize.title, fontWeight: fontWeight.black, letterSpacing: -0.5 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  heroRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaText: { color: colors.textSecondary, fontSize: fontSize.sm },
  heroOverview: { color: 'rgba(255,255,255,0.65)', fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 18 },
  heroActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md, borderRadius: radius.sm,
  },
  playBtnText: { color: '#000', fontWeight: fontWeight.bold, fontSize: fontSize.md },
  infoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md, borderRadius: radius.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  infoBtnText: { color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.md },

  // ── Greeting
  greeting: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingTop: spacing.xl,
  },
  greetingText: { color: colors.textSecondary, fontSize: fontSize.md },
  planBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.round,
    borderWidth: 1,
  },
  planText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },

  // ── Upgrade Banner
  upgradeBanner: { marginHorizontal: spacing.xl, marginTop: spacing.xl, borderRadius: radius.lg, overflow: 'hidden' },
  upgradeBannerInner: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
    gap: spacing.md,
  },
  upgradeBannerLeft: { flex: 1 },
  upgradeBannerLabel: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },
  upgradeBannerSub: { color: 'rgba(255,255,255,0.6)', fontSize: fontSize.xs, marginTop: 2 },
  upgradeBannerBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderRadius: radius.sm,
  },
  upgradeBannerBtnText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm },

  // ── Continue Watching
  continueCard: { width: WIDE_W, height: WIDE_W * 0.56, borderRadius: radius.md, overflow: 'hidden', position: 'relative' },
  continueImage: { ...StyleSheet.absoluteFillObject },
  continueGradient: { ...StyleSheet.absoluteFillObject },
  continueInfo: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.xxl + 20 },
  continueTitle: { color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  continueBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: spacing.sm },
  continueFill: { height: 3, backgroundColor: colors.primary, borderRadius: 2 },
  continuePlayIcon: { position: 'absolute', right: spacing.md, bottom: spacing.md },

  // ── Section Header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  // ── Movie Row
  rowContainer: { marginTop: spacing.xxl },
  rowList: { paddingHorizontal: spacing.xl, gap: spacing.md },

  // ── Poster Card
  card: { width: POSTER_W, position: 'relative' },
  cardPoster: { width: POSTER_W, height: POSTER_H, borderRadius: radius.sm },
  cardRating: {
    position: 'absolute', top: 6, right: 6, flexDirection: 'row',
    alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  cardRatingText: { color: '#fff', fontSize: 9, fontWeight: fontWeight.bold },

  // ── Wide Card
  wideCard: { width: WIDE_W, height: WIDE_H, borderRadius: radius.md, overflow: 'hidden', position: 'relative' },
  wideImage: { ...StyleSheet.absoluteFillObject },
  wideGradient: { ...StyleSheet.absoluteFillObject, top: '40%' },
  wideContent: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: 50 },
  wideTitle: { color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.bold },
  wideRating: { color: colors.warning, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  widePlay: { position: 'absolute', right: spacing.md, bottom: spacing.md },

  // ── Features
  featuresSection: { marginTop: spacing.xxl },
  featuresGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  featureCard: {
    width: (SW - spacing.xl * 2 - spacing.md) / 2,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  featureIcon: { width: 40, height: 40, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  featureLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  featureDesc: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },

  // ── Genre Grid
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xl },
  genreChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.round,
  },
  genreChipText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  // ── AI Banner
  aiBanner: { marginHorizontal: spacing.xl, marginTop: spacing.xxl, borderRadius: radius.lg, overflow: 'hidden' },
  aiBannerInner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.accent + '33',
  },
  aiBannerTitle: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },
  aiBannerSub: { color: 'rgba(255,255,255,0.55)', fontSize: fontSize.xs, marginTop: 2 },

  // ── Skeleton
  skeletonHero: { width: SW, height: HERO_HEIGHT, backgroundColor: colors.surfaceLight },
  skeletonTitle: { width: 140, height: 18, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },
  skeletonCard: { width: POSTER_W, height: POSTER_H, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },
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
