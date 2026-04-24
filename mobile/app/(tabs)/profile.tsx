import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { showImagePickerOptions, UploadResult } from '@/utils/profilePicture';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
    icon: IoniconsName;
    label: string;
    sub?: string;
    onPress: () => void;
    color?: string;
    badge?: string;
}

const tierConfig = {
    free: { label: 'Free', color: colors.free, icon: 'film-outline' as IoniconsName },
    standard: { label: 'Standard', color: colors.standard, icon: 'star' as IoniconsName },
    pro: { label: 'Pro', color: colors.pro, icon: 'diamond' as IoniconsName },
};

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { user, isAuthenticated, logout, refreshUser } = useAuth();
    const router = useRouter();
    const [uploading, setUploading] = useState(false);

    if (!isAuthenticated || !user) {
        return (
            <View style={styles.authContainer}>
                <Ionicons name="person-circle-outline" size={72} color={colors.textMuted} />
                <Text style={styles.authTitle}>Your Account</Text>
                <Text style={styles.authSub}>Sign in to access your profile and settings</Text>
                <Pressable style={styles.signInBtn} onPress={() => router.push('/auth/login')}>
                    <Text style={styles.signInBtnText}>Sign In</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/auth/register')}>
                    <Text style={styles.registerLink}>Don't have an account? <Text style={styles.registerBold}>Sign Up</Text></Text>
                </Pressable>
            </View>
        );
    }

    const tier = tierConfig[user.subscriptionTier as keyof typeof tierConfig] || tierConfig.free;

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    const menuSections: { title: string; items: MenuItem[] }[] = [
        {
            title: 'Account',
            items: [
                { icon: 'person-outline', label: 'Edit Profile', sub: user.email, onPress: () => { } },
                // { icon: tier.icon, label: 'Subscription', sub: `${tier.label} Plan`, onPress: () => router.push('/subscription'), badge: tier.label, color: tier.color },
                { icon: 'grid-outline', label: 'Dashboard', sub: 'Stats & activity', onPress: () => router.push('/dashboard') },
                { icon: 'shield-checkmark-outline', label: 'Security & Privacy', sub: '2FA, password, activity', onPress: () => router.push('/security') },
            ],
        },
        {
            title: 'Browse',
            items: [
                { icon: 'film-outline', label: 'Movies', onPress: () => router.push('/movies') },
                { icon: 'tv-outline', label: 'Series & Anime', onPress: () => router.push('/series') },
                { icon: 'albums-outline', label: 'Browse Genres', onPress: () => router.push('/genres') },
            ],
        },
        {
            title: 'Activity',
            items: [
                { icon: 'time-outline', label: 'Watch History', onPress: () => router.push('/history') },
                { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/notifications') },
            ],
        },
        {
            title: 'Preferences',
            items: [
                { icon: 'download-outline', label: 'Downloads', sub: 'Manage offline content', onPress: () => router.push('/downloads') },
                { icon: 'color-palette-outline', label: 'Display & Settings', sub: 'Quality, data & options', onPress: () => router.push('/dashboard?tab=preference') },
            ],
        },
        {
            title: 'Support',
            items: [
                { icon: 'help-circle-outline', label: 'Help Center', onPress: () => { } },
                { icon: 'flag-outline', label: 'Report an Issue', onPress: () => router.push('/report') },
                { icon: 'document-text-outline', label: 'Terms & Privacy', onPress: () => { } },
            ],
        },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Profile Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
                <View style={styles.avatarContainer}>
                    {user.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitial}>{user.name?.charAt(0).toUpperCase() || 'U'}</Text>
                        </View>
                    )}
                    <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
                        <Ionicons name={tier.icon} size={10} color="#fff" />
                    </View>
                    {/* Profile Picture Change Button (Section 11) */}
                    <Pressable
                        style={styles.avatarEditBtn}
                        onPress={() => {
                            showImagePickerOptions(
                                () => setUploading(true),
                                (result: UploadResult) => {
                                    setUploading(false);
                                    if (result.success) {
                                        Alert.alert('Success', 'Profile picture updated!');
                                        refreshUser?.();
                                    } else {
                                        Alert.alert('Upload Failed', result.error || 'Please try again.');
                                    }
                                }
                            );
                        }}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="camera" size={14} color="#fff" />
                        )}
                    </Pressable>
                </View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>

                {/* Stats */}
                <View style={styles.statsRow}>
                    {[
                        { label: 'Watched', value: user.stats?.moviesWatched || 0 },
                        { label: 'Watch Time', value: `${Math.round((user.stats?.totalWatchTime || 0) / 60)}h` },
                        { label: 'Referrals', value: user.referralCount || 0 },
                    ].map((stat, i) => (
                        <View key={i} style={styles.statItem}>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Menu Sections */}
            {menuSections.map((section) => (
                <View key={section.title} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <View style={styles.menuCard}>
                        {section.items.map((item, idx) => (
                            <Pressable key={idx} style={[styles.menuItem, idx < section.items.length - 1 && styles.menuItemBorder]} onPress={item.onPress}>
                                <Ionicons name={item.icon} size={20} color={item.color || colors.textSecondary} />
                                <View style={styles.menuItemContent}>
                                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                                    {item.sub && <Text style={styles.menuItemSub}>{item.sub}</Text>}
                                </View>
                                {item.badge && (
                                    <View style={[styles.badge, { backgroundColor: `${item.color}20` }]}>
                                        <Text style={[styles.badgeText, { color: item.color }]}>{item.badge}</Text>
                                    </View>
                                )}
                                <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
                            </Pressable>
                        ))}
                    </View>
                </View>
            ))}

            {/* Sign Out */}
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={styles.logoutText}>Sign Out</Text>
            </Pressable>

            <Text style={styles.version}>clipX v1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: 100 },
    authContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl },
    authTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: spacing.xl },
    authSub: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },
    signInBtn: { marginTop: spacing.xxl, paddingHorizontal: 48, paddingVertical: 14, backgroundColor: colors.primary, borderRadius: radius.md },
    signInBtnText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.lg },
    registerLink: { color: colors.textMuted, marginTop: spacing.xl, fontSize: fontSize.md },
    registerBold: { color: colors.primary, fontWeight: fontWeight.bold },

    header: { alignItems: 'center', paddingTop: 32, paddingBottom: spacing.xxl },
    avatarContainer: { position: 'relative' },
    avatar: { width: 80, height: 80, borderRadius: 40 },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: colors.text, fontSize: 32, fontWeight: fontWeight.bold },
    tierBadge: { position: 'absolute', bottom: 0, right: -2, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
    avatarEditBtn: { position: 'absolute', bottom: -4, left: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
    userName: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black, marginTop: spacing.md },
    userEmail: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },

    statsRow: { flexDirection: 'row', gap: spacing.xxxl, marginTop: spacing.xxl },
    statItem: { alignItems: 'center' },
    statValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.black },
    statLabel: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },

    section: { marginTop: spacing.xxl, paddingHorizontal: spacing.xl },
    sectionTitle: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.sm },
    menuCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: 14 },
    menuItemBorder: { borderBottomWidth: 0.5, borderBottomColor: colors.border },
    menuItemContent: { flex: 1 },
    menuItemLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.medium },
    menuItemSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
    badgeText: { fontSize: 10, fontWeight: fontWeight.bold },

    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xxxl, paddingVertical: 14, marginHorizontal: spacing.xl, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' },
    logoutText: { color: colors.error, fontSize: fontSize.md, fontWeight: fontWeight.bold },
    version: { color: colors.textDim, fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.xl },
});
