import React from 'react';
import {
    View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Dimensions, FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { GET_DASHBOARD } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPosterUri, getBackdropUri } from '@/lib/utils';
import type { Movie, ContinueWatchingItem } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CW_WIDTH = SCREEN_W * 0.7;

function ContinueCard({ item, onPress }: { item: ContinueWatchingItem; onPress: () => void }) {
    const pct = item.duration > 0 ? (item.currentTime / item.duration) * 100 : 0;
    return (
        <Pressable onPress={onPress} style={styles.cwCard}>
            <Image
                source={{ uri: getBackdropUri(item.movie) }}
                style={styles.cwImage}
                contentFit="cover"
            />
            <View style={styles.cwOverlay}>
                <Text style={styles.cwTitle} numberOfLines={1}>{item.movie.title}</Text>
                <Text style={styles.cwTime}>
                    {Math.floor(item.currentTime / 60)}m left
                </Text>
            </View>
            <View style={styles.cwProgressBg}>
                <View style={[styles.cwProgressFill, { width: `${pct}%` }]} />
            </View>
        </Pressable>
    );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
    return (
        <View style={styles.statCard}>
            <Ionicons name={icon as any} size={20} color={colors.primary} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const { data, loading } = useQuery<any>(GET_DASHBOARD, { skip: !isAuthenticated });

    if (!isAuthenticated) {
        return (
            <View style={styles.center}>
                <Ionicons name="grid-outline" size={48} color={colors.textMuted} />
                <Text style={styles.centerTitle}>Dashboard</Text>
                <Text style={styles.centerSub}>Sign in to see your activity</Text>
                <Pressable style={styles.authBtn} onPress={() => router.push('/auth/login')}>
                    <Text style={styles.authBtnText}>Sign In</Text>
                </Pressable>
            </View>
        );
    }

    if (loading && !data) {
        return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    const dash = data?.dashboardData;
    const stats = dash?.stats;
    const continueWatching: ContinueWatchingItem[] = dash?.continueWatching || [];
    const recentlyViewed: Movie[] = dash?.recentlyViewed || [];

    return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]}>
            <Text style={styles.pageTitle}>Dashboard</Text>

            {/* Stats */}
            <View style={styles.statsGrid}>
                <StatCard icon="film-outline" label="Watched" value={stats?.moviesWatched || 0} />
                <StatCard icon="time-outline" label="Hours" value={`${Math.round((stats?.totalWatchTime || 0) / 60)}`} />
                <StatCard icon="heart-outline" label="Watchlist" value={stats?.watchlistCount || 0} />
                <StatCard icon="chatbubble-outline" label="Reviews" value={stats?.reviewsWritten || 0} />
            </View>

            {/* Continue Watching */}
            {continueWatching.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Continue Watching</Text>
                    <FlatList
                        data={continueWatching}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.cwList}
                        renderItem={({ item }) => (
                            <ContinueCard item={item} onPress={() => router.push(`/watch/${item.movie.id}`)} />
                        )}
                    />
                </View>
            )}

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recently Viewed</Text>
                    <FlatList
                        data={recentlyViewed}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.cwList}
                        renderItem={({ item }) => (
                            <Pressable onPress={() => router.push(`/movie/${item.id}`)} style={styles.recentCard}>
                                <Image
                                    source={{ uri: getPosterUri(item) }}
                                    style={styles.recentPoster}
                                    contentFit="cover"
                                />
                            </Pressable>
                        )}
                    />
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingBottom: 100 },
    center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl },
    centerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: spacing.lg },
    centerSub: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm },
    authBtn: { marginTop: spacing.xl, paddingHorizontal: 40, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md },
    authBtnText: { color: '#fff', fontWeight: fontWeight.bold },
    pageTitle: { color: colors.text, fontSize: fontSize.title, fontWeight: fontWeight.black, paddingHorizontal: spacing.xl },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.xl, marginTop: spacing.xxl },
    statCard: { width: (SCREEN_W - spacing.xl * 2 - spacing.md) / 2, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: 'center', gap: 4 },
    statValue: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black },
    statLabel: { color: colors.textMuted, fontSize: fontSize.xs },

    section: { marginTop: spacing.xxl },
    sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold, paddingHorizontal: spacing.xl, marginBottom: spacing.md },
    cwList: { paddingHorizontal: spacing.xl, gap: spacing.md },

    cwCard: { width: CW_WIDTH, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceLight },
    cwImage: { width: '100%', height: CW_WIDTH * 0.56, backgroundColor: colors.surfaceLight },
    cwOverlay: { padding: spacing.md },
    cwTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold },
    cwTime: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
    cwProgressBg: { height: 3, backgroundColor: colors.surfaceLighter },
    cwProgressFill: { height: '100%', backgroundColor: colors.primary },

    recentCard: { width: 100 },
    recentPoster: { width: 100, height: 150, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },
});
