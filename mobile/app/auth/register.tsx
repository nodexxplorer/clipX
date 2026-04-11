import React, { useState } from 'react';
import {
    View, Text, TextInput, Pressable, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

export default function RegisterScreen() {
    const router = useRouter();
    const { register } = useAuth();

    const [name,            setName]            = useState('');
    const [email,           setEmail]           = useState('');
    const [password,        setPassword]        = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode,    setReferralCode]    = useState('');
    const [showPassword,    setShowPassword]    = useState(false);
    const [loading,         setLoading]         = useState(false);
    const [error,           setError]           = useState('');

    const validate = (): boolean => {
        if (!name.trim()) {
            setError('Name is required'); return false;
        }
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email'); return false;
        }
        // FIX: was `< 6` — backend enforces minimum 8 chars with letter + digit
        if (password.length < 8) {
            setError('Password must be at least 8 characters'); return false;
        }
        if (!/[A-Za-z]/.test(password)) {
            setError('Password must contain at least one letter'); return false;
        }
        if (!/\d/.test(password)) {
            setError('Password must contain at least one number'); return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match'); return false;
        }
        return true;
    };

    const handleRegister = async () => {
        if (!validate()) return;
        setError('');
        setLoading(true);
        try {
            await register(name.trim(), email.trim(), password, referralCode.trim() || undefined);
            // AuthContext.register navigates after success — no manual push needed
        } catch (err: any) {
            const msg = err?.message || 'Registration failed';
            setError(msg.replace('ApolloError: ', ''));
        }
        setLoading(false);
    };

    const inputField = (
        icon: React.ComponentProps<typeof Ionicons>['name'],
        placeholder: string,
        value: string,
        onChangeText: (t: string) => void,
        opts?: {
            secure?: boolean;
            keyboardType?: 'email-address' | 'default';
            autoCapitalize?: 'none' | 'words';
            togglePassword?: boolean;
        }
    ) => (
        <View style={styles.inputContainer}>
            <Ionicons name={icon} size={18} color={colors.textMuted} />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={opts?.secure && !showPassword}
                keyboardType={opts?.keyboardType || 'default'}
                autoCapitalize={opts?.autoCapitalize || 'none'}
            />
            {opts?.togglePassword && (
                <Pressable onPress={() => setShowPassword(v => !v)}>
                    <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                    />
                </Pressable>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Pressable style={styles.closeBtn} onPress={() => router.back()}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>
                            clip<Text style={styles.logoX}>X</Text>
                        </Text>
                        <Text style={styles.tagline}>Create your account</Text>
                    </View>

                    {/* Error */}
                    {error ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={16} color={colors.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {inputField('person-outline',       'Full Name',        name,            setName,            { autoCapitalize: 'words' })}
                    {inputField('mail-outline',         'Email address',    email,           setEmail,           { keyboardType: 'email-address' })}
                    {inputField('lock-closed-outline',  'Password',         password,        setPassword,        { secure: true, togglePassword: true })}
                    {inputField('lock-closed-outline',  'Confirm Password', confirmPassword, setConfirmPassword, { secure: true })}
                    {inputField('gift-outline',         'Referral Code (optional)', referralCode, setReferralCode)}

                    {/* Password hint */}
                    <Text style={styles.pwHint}>
                        Min 8 characters · at least one letter and one number
                    </Text>

                    {/* Welcome banner */}
                    <View style={styles.freeBanner}>
                        <Ionicons name="sparkles" size={16} color={colors.primary} />
                        <Text style={styles.freeText}>Unlimited streaming — all content, no limits!</Text>
                    </View>

                    {/* Register Button */}
                    <Pressable
                        style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <Text style={styles.registerBtnText}>
                            {loading ? 'Creating Account…' : 'Create Account'}
                        </Text>
                    </Pressable>

                    {/* Login Link */}
                    <Pressable
                        onPress={() => { router.back(); router.push('/auth/login'); }}
                        style={styles.loginRow}
                    >
                        <Text style={styles.loginText}>
                            Already have an account?{' '}
                            <Text style={styles.loginBold}>Sign In</Text>
                        </Text>
                    </Pressable>

                    {/* Terms — FIX: now tappable, links to legal screen */}
                    <Text style={styles.terms}>
                        By creating an account, you agree to our{' '}
                        <Text
                            style={styles.termsLink}
                            onPress={() =>
                                router.push({
                                    pathname: '/legal',
                                    params: { section: 'terms' },
                                } as any)
                            }
                        >
                            Terms of Service
                        </Text>
                        {' '}and{' '}
                        <Text
                            style={styles.termsLink}
                            onPress={() =>
                                router.push({
                                    pathname: '/legal',
                                    params: { section: 'privacy' },
                                } as any)
                            }
                        >
                            Privacy Policy
                        </Text>
                        .
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: colors.background },
    closeBtn:     { position: 'absolute', top: 56, right: spacing.xl, zIndex: 10, padding: 4 },
    scrollContent:{ flexGrow: 1, justifyContent: 'center' },
    content:      { paddingHorizontal: spacing.xxxl, paddingVertical: 60 },

    logoContainer: { alignItems: 'center', marginBottom: 32 },
    logo:          { color: colors.text, fontSize: 42, fontWeight: fontWeight.black, letterSpacing: -1 },
    logoX:         { color: colors.primary, fontSize: 48 },
    tagline:       { color: colors.textMuted, fontSize: fontSize.md, marginTop: 4 },

    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
        backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)', borderRadius: radius.md,
        padding: spacing.md, marginBottom: spacing.lg,
    },
    errorText: { color: colors.error, fontSize: fontSize.sm, flex: 1 },

    inputContainer: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        backgroundColor: colors.surface, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border,
        paddingHorizontal: spacing.lg,
        paddingVertical: Platform.OS === 'ios' ? 14 : 4,
        marginBottom: spacing.md,
    },
    input: { flex: 1, color: colors.text, fontSize: fontSize.md },

    pwHint: {
        color: colors.textDim, fontSize: fontSize.xs,
        marginBottom: spacing.md, paddingHorizontal: 2,
    },

    freeBanner: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
        backgroundColor: 'rgba(8,145,178,0.08)', borderWidth: 1,
        borderColor: 'rgba(8,145,178,0.15)', borderRadius: radius.md,
        padding: spacing.md, marginBottom: spacing.xxl, marginTop: spacing.sm,
    },
    freeText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium, flex: 1 },

    registerBtn:         { backgroundColor: colors.primary, paddingVertical: 15, borderRadius: radius.md, alignItems: 'center' },
    registerBtnDisabled: { opacity: 0.6 },
    registerBtnText:     { color: '#fff', fontSize: fontSize.lg, fontWeight: fontWeight.bold },

    loginRow:  { alignItems: 'center', marginTop: spacing.xxl },
    loginText: { color: colors.textMuted, fontSize: fontSize.md },
    loginBold: { color: colors.primary, fontWeight: fontWeight.bold },

    terms:     { color: colors.textDim, fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.xxl, lineHeight: 18 },
    termsLink: { color: colors.primary, textDecorationLine: 'underline' },
});