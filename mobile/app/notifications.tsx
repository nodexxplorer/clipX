import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { GET_NOTIFICATIONS } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Notification } from '@/types';

const iconMap: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    info: 'information-circle',
    success: 'checkmark-circle',
    warning: 'warning',
    error: 'alert-circle',
    promo: 'gift',
    update: 'sparkles',
};

const colorMap: Record<string, string> = {
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    promo: colors.accent,
    update: colors.primary,
};

function NotifItem({ item }: { item: Notification }) {
    const icon = iconMap[item.type] || 'notifications';
    const color = colorMap[item.type] || colors.textMuted;
    const timeAgo = getTimeAgo(item.createdAt);

    return (
        <View style={[styles.notifItem, !item.isRead && styles.notifUnread]}>
            <View style={[styles.notifIcon, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifMsg} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.notifTime}>{timeAgo}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
        </View>
    );
}

function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const { data, loading, refetch } = useQuery<any>(GET_NOTIFICATIONS, { skip: !isAuthenticated });

    const notifications: Notification[] = data?.notifications || [];

    if (!isAuthenticated) {
        return (
            <View style={styles.center}>
                <Ionicons name="notifications-outline" size={48} color={colors.textMuted} />
                <Text style={styles.centerTitle}>Notifications</Text>
                <Text style={styles.centerSub}>Sign in to see your notifications</Text>
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
            <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 38 }} />
            </View>

            {notifications.length > 0 ? (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <NotifItem item={item} />}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.empty}>
                    <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No notifications yet</Text>
                    <Text style={styles.emptySub}>We'll notify you about new releases and updates</Text>
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

    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
    backBtn: { padding: spacing.sm },
    headerTitle: { flex: 1, color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black, textAlign: 'center' },

    list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    notifItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    notifUnread: { backgroundColor: 'rgba(8,145,178,0.03)' },
    notifIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    notifContent: { flex: 1 },
    notifTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold },
    notifMsg: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2, lineHeight: 20 },
    notifTime: { color: colors.textDim, fontSize: fontSize.xs, marginTop: 4 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },

    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    emptyText: { color: colors.textSecondary, fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginTop: spacing.lg },
    emptySub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: 40 },
});
