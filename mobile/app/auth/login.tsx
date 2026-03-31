import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await login(email.trim(), password);
            router.back();
        } catch (err: any) {
            const msg = err?.message || 'Login failed. Please try again.';
            setError(msg.replace('ApolloError: ', ''));
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/* Close Button */}
            <Pressable style={styles.closeBtn} onPress={() => router.back()}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>

            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>clip<Text style={styles.logoX}>X</Text></Text>
                    <Text style={styles.tagline}>Stream your world</Text>
                </View>

                {/* Error */}
                {error ? (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={16} color={colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Email */}
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email address"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />
                </View>

                {/* Password */}
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                    </Pressable>
                </View>

                {/* Forgot Password */}
                <Pressable style={styles.forgotBtn} onPress={() => { router.back(); router.push('/auth/forgot-password'); }}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>

                {/* Login Button */}
                <Pressable
                    style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={styles.loginBtnText}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Text>
                </Pressable>

                {/* Register Link */}
                <Pressable onPress={() => { router.back(); router.push('/auth/register'); }} style={styles.registerRow}>
                    <Text style={styles.registerText}>
                        Don't have an account? <Text style={styles.registerBold}>Sign Up</Text>
                    </Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    closeBtn: { position: 'absolute', top: 56, right: spacing.xl, zIndex: 10, padding: 4 },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxxl },

    logoContainer: { alignItems: 'center', marginBottom: 40 },
    logo: { color: colors.text, fontSize: 42, fontWeight: fontWeight.black, letterSpacing: -1 },
    logoX: { color: colors.primary, fontSize: 48 },
    tagline: { color: colors.textMuted, fontSize: fontSize.md, marginTop: 4 },

    errorBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
    errorText: { color: colors.error, fontSize: fontSize.sm, flex: 1 },

    inputContainer: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        backgroundColor: colors.surface, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
        paddingHorizontal: spacing.lg, paddingVertical: Platform.OS === 'ios' ? 14 : 4,
        marginBottom: spacing.md,
    },
    input: { flex: 1, color: colors.text, fontSize: fontSize.md },

    forgotBtn: { alignSelf: 'flex-end', marginBottom: spacing.xxl },
    forgotText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },

    loginBtn: { backgroundColor: colors.primary, paddingVertical: 15, borderRadius: radius.md, alignItems: 'center' },
    loginBtnDisabled: { opacity: 0.6 },
    loginBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: fontWeight.bold },

    registerRow: { alignItems: 'center', marginTop: spacing.xxl },
    registerText: { color: colors.textMuted, fontSize: fontSize.md },
    registerBold: { color: colors.primary, fontWeight: fontWeight.bold },
});
