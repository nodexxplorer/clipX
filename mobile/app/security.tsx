import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@apollo/client/react';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import {
    CHANGE_PASSWORD, LOGIN_ACTIVITY,
} from '@/lib/graphql';

export default function SecurityScreen() {
    const router = useRouter();
    const { user, deleteAccount } = useAuth();
    const [activeSection, setActiveSection] = useState<string | null>(null);


    // Change password
    const [changePasswordMutation, { loading: changePwLoading }] = useMutation<any>(CHANGE_PASSWORD);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');

    // Login activity
    const { data: activityData, loading: activityLoading } = useQuery<any>(LOGIN_ACTIVITY, {
        variables: { limit: 15 },
        fetchPolicy: 'network-only',
    });

    const [deletePw, setDeletePw] = useState('');


    const handleChangePassword = async () => {
        if (!currentPw || !newPw || newPw.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        try {
            const { data } = await changePasswordMutation({
                variables: { currentPassword: currentPw, newPassword: newPw },
            });
            if (data?.changePassword?.success) {
                Alert.alert('Success', 'Password changed!');
                setActiveSection(null);
                setCurrentPw('');
                setNewPw('');
            }
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This action is permanent. All your data will be removed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            await deleteAccount(deletePw || undefined);
                            router.replace('/');
                        } catch (err: any) {
                            Alert.alert('Error', err.message);
                        }
                    }
                },
            ]
        );
    };

    const activities = activityData?.loginActivity || [];

    const getActionLabel = (action: string) => {
        const map: Record<string, string> = {
            login: 'Sign In',
            login_failed: 'Failed Login',
        };
        return map[action] || action;
    };

    const getActionIcon = (action: string): React.ComponentProps<typeof Ionicons>['name'] => {
        if (action.includes('fail')) return 'close-circle';
        return 'checkmark-circle';
    };

    const getActionColor = (action: string) => {
        if (action.includes('fail')) return colors.error;
        return '#22c55e';
    };

    const timeAgo = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            const diff = Math.floor((Date.now() - d.getTime()) / 1000);
            if (diff < 60) return 'Just now';
            if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
            return `${Math.floor(diff / 86400)}d ago`;
        } catch {
            return '';
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Security</Text>
                <View style={{ width: 40 }} />
            </View>


            {/* ─── Change Password ─── */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>PASSWORD</Text>
                <Pressable style={styles.card} onPress={() => setActiveSection(activeSection === 'password' ? null : 'password')}>
                    <View style={styles.row}>
                        <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}20` }]}>
                            <Ionicons name="lock-closed" size={20} color={colors.primary} />
                        </View>
                        <Text style={styles.rowTitle}>Change Password</Text>
                        <Ionicons name={activeSection === 'password' ? 'chevron-up' : 'chevron-forward'} size={16} color={colors.textDim} />
                    </View>
                </Pressable>
            </View>

            {activeSection === 'password' && (
                <View style={styles.inlinePanel}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Current password"
                        placeholderTextColor={colors.textMuted}
                        value={currentPw}
                        onChangeText={setCurrentPw}
                        secureTextEntry
                    />
                    <TextInput
                        style={styles.textInput}
                        placeholder="New password (min 6 chars)"
                        placeholderTextColor={colors.textMuted}
                        value={newPw}
                        onChangeText={setNewPw}
                        secureTextEntry
                    />
                    <Pressable style={styles.primaryBtn} onPress={handleChangePassword} disabled={changePwLoading}>
                        <Text style={styles.primaryBtnText}>{changePwLoading ? 'Saving...' : 'Update Password'}</Text>
                    </Pressable>
                </View>
            )}

            {/* ─── Login Activity ─── */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
                <View style={styles.card}>
                    {activityLoading ? (
                        <View style={{ padding: 24, alignItems: 'center' }}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    ) : activities.length === 0 ? (
                        <View style={{ padding: 24, alignItems: 'center' }}>
                            <Ionicons name="shield-outline" size={28} color={colors.textDim} />
                            <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: fontSize.sm }}>No activity yet</Text>
                        </View>
                    ) : (
                        activities.slice(0, 10).map((a: any, i: number) => (
                            <View key={a.id} style={[styles.activityRow, i < Math.min(activities.length, 10) - 1 && styles.activityBorder]}>
                                <View style={[styles.activityIcon, { backgroundColor: `${getActionColor(a.action)}15` }]}>
                                    <Ionicons name={getActionIcon(a.action)} size={16} color={getActionColor(a.action)} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.activityLabel}>{getActionLabel(a.action)}</Text>
                                    {a.ipAddress && <Text style={styles.activitySub}>{a.ipAddress}</Text>}
                                </View>
                                <Text style={styles.activityTime}>{timeAgo(a.createdAt)}</Text>
                            </View>
                        ))
                    )}
                </View>
            </View>

            {/* ─── Danger Zone ─── */}
            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.error }]}>DANGER ZONE</Text>
                <View style={[styles.card, { borderColor: 'rgba(239,68,68,0.15)' }]}>
                    <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, padding: spacing.lg, paddingBottom: 0 }}>
                        Permanently delete your account and all data. This cannot be undone.
                    </Text>
                    <View style={{ padding: spacing.lg }}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Password to confirm"
                            placeholderTextColor={colors.textMuted}
                            value={deletePw}
                            onChangeText={setDeletePw}
                            secureTextEntry
                        />
                        <Pressable style={styles.dangerBtn} onPress={handleDeleteAccount}>
                            <Ionicons name="trash-outline" size={16} color="#fff" />
                            <Text style={styles.dangerBtnText}>Delete Account</Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            <View style={{ height: 80 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: spacing.xl, paddingHorizontal: spacing.xl },
    backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold },

    section: { marginTop: spacing.xxl, paddingHorizontal: spacing.xl },
    sectionLabel: { color: colors.textMuted, fontSize: 11, fontWeight: fontWeight.bold, letterSpacing: 1.5, marginBottom: spacing.sm },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },

    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
    iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    rowTitle: { flex: 1, color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.medium },
    rowSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 1 },

    inlinePanel: { marginHorizontal: spacing.xl, marginTop: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
    panelTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: spacing.sm },
    panelSub: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: spacing.md },
    panelActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },

    textInput: { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.md },
    otpInput: { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, color: colors.text, fontSize: 24, fontWeight: fontWeight.bold, textAlign: 'center', letterSpacing: 12, marginBottom: spacing.sm },

    primarySmallBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: radius.md },
    primarySmallBtnText: { color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.bold },
    dangerSmallBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
    dangerSmallBtnText: { color: colors.error, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
    cancelBtnText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.medium },

    primaryBtn: { paddingVertical: 14, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: 'center' },
    primaryBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.bold },
    dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 14, backgroundColor: '#ef4444', borderRadius: radius.md },
    dangerBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.bold },

    activityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 12 },
    activityBorder: { borderBottomWidth: 0.5, borderBottomColor: colors.border },
    activityIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    activityLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
    activitySub: { color: colors.textDim, fontSize: 10, marginTop: 1 },
    activityTime: { color: colors.textDim, fontSize: 10 },
});
