import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, FlatList, Pressable, StyleSheet, Image, Animated,
    ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

const GENRES = ['Action', 'Comedy', 'Drama', 'Thriller', 'Sci-Fi', 'Romance', 'Horror', 'Animation'];

type RecommendedMovie = {
    id: string;
    title: string;
    posterPath: string;
    voteAverage: number;
    releaseDate: string;
    reason: string;
};

const MOCK_RECOMMENDATIONS: RecommendedMovie[] = [
    { id: '1', title: 'Inception', posterPath: 'https://image.tmdb.org/t/p/w342/9gk7adHYeDvHkCSEhniJBRo0HVB.jpg', voteAverage: 8.4, releaseDate: '2010', reason: 'Because you liked Interstellar' },
    { id: '2', title: 'The Dark Knight', posterPath: 'https://image.tmdb.org/t/p/w342/qJ2tW6WMUDux911r6m7haIt5EZi.jpg', voteAverage: 9.0, releaseDate: '2008', reason: 'Top-rated action thriller' },
    { id: '3', title: 'Parasite', posterPath: 'https://image.tmdb.org/t/p/w342/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', voteAverage: 8.5, releaseDate: '2019', reason: 'Award-winning drama' },
    { id: '4', title: 'Dune', posterPath: 'https://image.tmdb.org/t/p/w342/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', voteAverage: 7.9, releaseDate: '2021', reason: 'Trending in Sci-Fi' },
    { id: '5', title: 'Everything Everywhere', posterPath: 'https://image.tmdb.org/t/p/w342/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', voteAverage: 7.8, releaseDate: '2022', reason: 'Critics\' pick' },
];

export default function RecommendationsScreen() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        setTimeout(() => setLoading(false), 800);
    }, []);

    if (!isAuthenticated) {
        return (
            <View style={styles.center}>
                <Ionicons name="bulb-outline" size={48} color={colors.textMuted} />
                <Text style={styles.centerTitle}>For You</Text>
                <Text style={styles.centerSub}>Sign in to get personalized recommendations</Text>
                <Pressable style={styles.authBtn} onPress={() => router.push('/auth/login')}>
                    <Text style={styles.authBtnText}>Sign In</Text>
                </Pressable>
            </View>
        );
    }

    const filtered = selectedGenre
        ? MOCK_RECOMMENDATIONS.filter((_, i) => i % 2 === 0)
        : MOCK_RECOMMENDATIONS;

    const renderMovie = ({ item }: { item: RecommendedMovie }) => (
        <Pressable
            style={styles.movieCard}
            onPress={() => router.push(`/movie/${item.id}` as any)}
        >
            <Image source={{ uri: item.posterPath }} style={styles.poster} />
            <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.movieYear}>{item.releaseDate}</Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                    <Text style={styles.rating}>{item.voteAverage.toFixed(1)}</Text>
                </View>
                <View style={styles.reasonTag}>
                    <Ionicons name="sparkles" size={10} color={colors.primary} />
                    <Text style={styles.reasonText} numberOfLines={1}>{item.reason}</Text>
                </View>
            </View>
        </Pressable>
    );

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Recommendations</Text>
                <View style={{ width: 38 }} />
            </View>

            {/* Genre filter chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
            >
                <Pressable
                    style={[styles.chip, !selectedGenre && styles.chipActive]}
                    onPress={() => setSelectedGenre(null)}
                >
                    <Text style={[styles.chipText, !selectedGenre && styles.chipTextActive]}>All</Text>
                </Pressable>
                {GENRES.map(g => (
                    <Pressable
                        key={g}
                        style={[styles.chip, selectedGenre === g && styles.chipActive]}
                        onPress={() => setSelectedGenre(g === selectedGenre ? null : g)}
                    >
                        <Text style={[styles.chipText, selectedGenre === g && styles.chipTextActive]}>{g}</Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Picked for You</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    renderItem={renderMovie}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl },
    centerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: spacing.lg },
    centerSub: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm, textAlign: 'center' },
    authBtn: { marginTop: spacing.xl, paddingHorizontal: 40, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md },
    authBtnText: { color: '#fff', fontWeight: fontWeight.bold },

    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md },
    backBtn: { padding: spacing.sm },
    headerTitle: { flex: 1, color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black, textAlign: 'center' },

    chipRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
    chipText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
    chipTextActive: { color: colors.primary },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
    sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

    movieCard: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    poster: { width: 90, height: 135, backgroundColor: colors.surface },
    movieInfo: { flex: 1, paddingVertical: spacing.md, paddingRight: spacing.md, justifyContent: 'center' },
    movieTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold },
    movieYear: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    rating: { color: '#FBBF24', fontSize: fontSize.sm, fontWeight: fontWeight.bold },
    reasonTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: `${colors.primary}10`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
    reasonText: { color: colors.primary, fontSize: 11, fontWeight: fontWeight.semibold },
});
