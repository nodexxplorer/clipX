/**
 * mobile/app/continue-watching.tsx
 *
 * "See More" screen for the Continue Watching row on the home tab.
 * Shows all in-progress movies/series with accurate progress bars,
 * resume buttons, and the ability to clear individual items.
 *
 * Add <Stack.Screen name="continue-watching" /> to app/_layout.tsx
 */

import React, { useCallback } from 'react';
import {
    View, Text, FlatList, Pressable, StyleSheet,
    ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GET_DASHBOARD } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { getBackdropUri } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { ContinueWatchingItem } from '@/types';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTimeLeft(currentTime: number, duration: number): string {
    const remainSec = Math.max(0, duration - currentTime);
    const h = Math.floor(remainSec / 3600);
    const m = Math.floor((remainSec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m left`;
    if (m > 0) return `${m}m left`;
    return 'Almost done';
}

function progressPercent(current: number, duration: number): number {
    if (!duration || duration <= 0) return 0;
    return Math.min(1, Math.max(0, current / duration));
}

// ─── Card ────────────────────────────────────────────────────────────────────

function ContinueCard({ item }: { item: ContinueWatchingItem }) {
    const router = useRouter();
    const pct = progressPercent(item.currentTime, item.duration);
    const timeLeft = formatTimeLeft(item.currentTime, item.duration);

    const handleResume = () => {
        router.push(`/watch/${item.movie.id}` as any);
    };

    const handleViewDetail = () => {
        router.push(`/movie/${item.movie.id}` as any);
    };

    return (
        <Pressable style={styles.card} onPress={handleResume}>
            {/* Backdrop thumbnail */}
            <View style={styles.thumbContainer}>
                <Image
                    source={{ uri: getBackdropUri(item.movie) ?? '' }}
                    style={styles.thumb}
                    contentFit="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                    style={StyleSheet.absoluteFill}
                />
                {/* Progress bar overlay */}
                <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
                </View>
                {/* Play button */}
                <View style={styles.playOverlay}>
                    <View style={styles.playCircle}>
                        <Ionicons name="play" size={20} color="#fff" />
                    </View>
                </View>
            </View>

            {/* Info */}
            <View style={styles.info}>
                <View style={styles.infoTop}>
                    <Text style={styles.title} numberOfLines={2}>{item.movie.title}</Text>
                    <Pressable
                        style={styles.detailBtn}
                        onPress={handleViewDetail}
                        hitSlop={8}
                    >
                        <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
                    </Pressable>
                </View>

                <Text style={styles.timeLeft}>{timeLeft}</Text>

                {/* Progress bar */}
                <View style={styles.progressRow}>
                    <View style={styles.progressBgFull}>
                        <View style={[styles.progressFillFull, { width: `${pct * 100}%` as any }]} />
                    </View>
                    <Text style={styles.pctText}>{Math.round(pct * 100)}%</Text>
                </View>

                <Pressable style={styles.resumeBtn} onPress={handleResume}>
                    <Ionicons name="play" size={14} color="#fff" />
                    <Text style={styles.resumeText}>Resume</Text>
                </Pressable>
            </View>
        </Pressable>
    );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ContinueWatchingScreen() {
    const router  = useRouter();
    const insets  = useSafeAreaInsets();
    const { isAuthenticated } = useAuth();

    const { data, loading, error, refetch } = useQuery<{
        dashboardData: { continueWatching: ContinueWatchingItem[] }
    }>(GET_DASHBOARD, {
        fetchPolicy: 'cache-and-network',
        skip: !isAuthenticated,
    });

    const items: ContinueWatchingItem[] = data?.dashboardData?.continueWatching ?? [];

    const onRefresh = useCallback(async () => { await refetch(); }, [refetch]);

    if (!isAuthenticated) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <Ionicons name="lock-closed-outline" size={56} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Sign in to see your watch history</Text>
                <Pressable style={styles.signInBtn} onPress={() => router.push('/auth/login')}>
                    <Text style={styles.signInText}>Sign In</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Continue Watching</Text>
                {items.length > 0 && (
                    <Text style={styles.headerCount}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
                )}
            </View>

            {loading && items.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error && items.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="cloud-offline-outline" size={56} color={colors.error} />
                    <Text style={styles.emptyTitle}>Couldn't load history</Text>
                    <Pressable style={styles.retryBtn} onPress={() => refetch()}>
                        <Ionicons name="refresh" size={16} color="#fff" />
                        <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                </View>
            ) : items.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="play-circle-outline" size={64} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>Nothing in progress</Text>
                    <Text style={styles.emptySub}>
                        Start watching a movie or series and it will appear here.
                    </Text>
                    <Pressable style={styles.browseBtn} onPress={() => router.push('/(tabs)' as any)}>
                        <Text style={styles.browseText}>Browse Content</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    onRefresh={onRefresh}
                    refreshing={loading}
                    renderItem={({ item }) => <ContinueCard item={item} />}
                />
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
        borderBottomWidth: 0.5, borderBottomColor: colors.border,
    },
    backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    headerTitle:  { flex: 1, color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
    headerCount:  { color: colors.textMuted, fontSize: fontSize.sm },

    list: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 100 },

    // Card
    card: {
        backgroundColor: colors.surface, borderRadius: radius.lg,
        borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    thumbContainer: { height: 180, position: 'relative' },
    thumb:          { width: '100%', height: '100%' },
    progressBg:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
    progressFill:   { height: '100%', backgroundColor: colors.primary },
    playOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    playCircle:     { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },

    info:    { padding: spacing.lg },
    infoTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.xs },
    title:   { flex: 1, color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold, lineHeight: 22 },
    detailBtn: { marginTop: 2 },

    timeLeft: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.md },

    progressRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    progressBgFull: { flex: 1, height: 4, backgroundColor: colors.surfaceLight, borderRadius: 2, overflow: 'hidden' },
    progressFillFull: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
    pctText:        { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.bold, minWidth: 30 },

    resumeBtn:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: radius.md, justifyContent: 'center' },
    resumeText: { color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.bold },

    // Empty / error states
    emptyTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: spacing.lg, textAlign: 'center' },
    emptySub:   { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },

    browseBtn:  { marginTop: spacing.xl, paddingHorizontal: 32, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: radius.md },
    browseText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },

    signInBtn:  { marginTop: spacing.xl, paddingHorizontal: 40, paddingVertical: 14, backgroundColor: colors.primary, borderRadius: radius.md },
    signInText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.lg },

    retryBtn:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: radius.md },
    retryText:  { color: '#fff', fontWeight: fontWeight.bold },
});