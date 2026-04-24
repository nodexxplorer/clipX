import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { GET_DASHBOARD } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getPosterUri } from '@/lib/utils';
import type { Movie } from '@/types';

// Helper removed — using shared getPosterUri from @/lib/utils

export default function HistoryScreen() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const { data, loading, refetch } = useQuery<any>(GET_DASHBOARD, { skip: !isAuthenticated });
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch().catch(() => {});
        setRefreshing(false);
    }, [refetch]);

    const recentlyViewed: Movie[] = data?.dashboardData?.recentlyViewed || [];

    if (!isAuthenticated) {
        return (
            <View style={styles.center}>
                <Ionicons name="time-outline" size={48} color={colors.textMuted} />
                <Text style={styles.centerTitle}>Watch History</Text>
                <Text style={styles.centerSub}>Sign in to see your history</Text>
                <Pressable style={styles.authBtn} onPress={() => router.push('/auth/login')}>
                    <Text style={styles.authBtnText}>Sign In</Text>
                </Pressable>
            </View>
        );
    }

    if (loading && !data) {
        return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Watch History</Text>
                <View style={{ width: 38 }} />
            </View>

            {recentlyViewed.length > 0 ? (
                <FlatList
                    data={recentlyViewed}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
                    }
                    renderItem={({ item }) => (
                        <Pressable onPress={() => router.push(`/movie/${item.id}`)} style={styles.histItem}>
                            <Image source={{ uri: getPosterUri(item) }} style={styles.poster} contentFit="cover" />
                            <View style={styles.histInfo}>
                                <Text style={styles.histTitle} numberOfLines={1}>{item.title}</Text>
                                {item.rating ? (
                                    <View style={styles.ratingRow}>
                                        <Ionicons name="star" size={12} color={colors.warning} />
                                        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                                    </View>
                                ) : null}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
                        </Pressable>
                    )}
                />
            ) : (
                <View style={styles.empty}>
                    <Ionicons name="time-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No watch history</Text>
                    <Text style={styles.emptySub}>Movies you watch will appear here</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl },
    centerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: spacing.lg },
    centerSub: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm },
    authBtn: { marginTop: spacing.xl, paddingHorizontal: 40, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md },
    authBtnText: { color: '#fff', fontWeight: fontWeight.bold },

    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md },
    backBtn: { padding: spacing.sm },
    headerTitle: { flex: 1, color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black, textAlign: 'center' },

    list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    histItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    poster: { width: 56, height: 84, borderRadius: radius.sm, backgroundColor: colors.surfaceLight },
    histInfo: { flex: 1 },
    histTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
    ratingText: { color: colors.warning, fontSize: fontSize.xs, fontWeight: fontWeight.bold },

    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    emptyText: { color: colors.textSecondary, fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginTop: spacing.lg },
    emptySub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
});
