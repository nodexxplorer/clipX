import React, { useState } from 'react';
import {
    View, Text, TextInput, Pressable, StyleSheet, Image,
    ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@apollo/client/react';
import { UPDATE_PROFILE } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [saving, setSaving] = useState(false);

    const [updateProfile] = useMutation(UPDATE_PROFILE);

    if (!isAuthenticated) {
        router.replace('/auth/login');
        return null;
    }

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateProfile({
                variables: {
                    name: name.trim() || null,
                    bio: bio.trim() || null,
                    avatar: avatar.trim() || null,
                },
            });
            const data = result?.data as any;
            if (data?.updateProfile) {
                Alert.alert('Updated!', 'Your profile has been saved.');
                router.back();
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update profile');
        }
        setSaving(false);
    };

    const initials = (name || user?.email || '?').charAt(0).toUpperCase();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <Pressable onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                    {saving ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Text style={styles.saveBtnText}>Save</Text>
                    )}
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
                {/* Avatar Preview */}
                <View style={styles.avatarSection}>
                    {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.avatarImg} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitial}>{initials}</Text>
                        </View>
                    )}
                    <Text style={styles.changeAvatarText}>Tap to change avatar</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Display Name</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Your name"
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                        maxLength={50}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Bio</Text>
                    <TextInput
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell us about yourself..."
                        placeholderTextColor={colors.textMuted}
                        style={[styles.input, styles.textArea]}
                        multiline
                        maxLength={200}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{bio.length}/200</Text>
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Avatar URL</Text>
                    <TextInput
                        value={avatar}
                        onChangeText={setAvatar}
                        placeholder="https://example.com/avatar.jpg"
                        placeholderTextColor={colors.textMuted}
                        style={styles.input}
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.readonlyField}>
                        <Text style={styles.readonlyText}>{user?.email}</Text>
                        <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    backBtn: { padding: spacing.sm },
    headerTitle: { flex: 1, color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.black, textAlign: 'center' },
    saveBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    saveBtnText: { color: colors.primary, fontSize: fontSize.md, fontWeight: fontWeight.bold },

    form: { padding: spacing.xl, paddingBottom: 120 },

    avatarSection: { alignItems: 'center', marginBottom: spacing.xxxl },
    avatarImg: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.primary },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: `${colors.primary}20`, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.primary },
    avatarInitial: { fontSize: 36, fontWeight: fontWeight.black, color: colors.primary },
    changeAvatarText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginTop: spacing.sm },

    fieldGroup: { marginBottom: spacing.xl },
    label: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.bold, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: colors.card, color: colors.text, paddingHorizontal: spacing.lg, paddingVertical: 14, borderRadius: radius.md, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
    textArea: { height: 100, paddingTop: 14 },
    charCount: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'right', marginTop: 4 },
    readonlyField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
    readonlyText: { color: colors.textMuted, fontSize: fontSize.md },
});
