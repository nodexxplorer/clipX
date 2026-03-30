import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@apollo/client/react';
import { FORGOT_PASSWORD } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [forgotPassword] = useMutation<any>(FORGOT_PASSWORD);

  const handleSubmit = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await forgotPassword({ variables: { email } });
      if (res.data?.forgotPassword?.success) {
        setSent(true);
      } else {
        setError(res.data?.forgotPassword?.message || 'Failed to send reset link.');
      }
    } catch (err: any) {
      setError(err.message.replace('ApolloError: ', ''));
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Ionicons name="mail" size={40} color={colors.primary} />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successSub}>
            We've sent password reset instructions to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Pressable style={styles.backToLoginBtn} onPress={() => { router.back(); router.push('/auth/login'); }}>
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </Pressable>
          <Pressable onPress={() => { setSent(false); setEmail(''); }}>
            <Text style={styles.tryAgainText}>Didn't receive it? Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={styles.closeBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={24} color={colors.textSecondary} />
      </Pressable>

      <View style={styles.content}>
        <Ionicons name="lock-open-outline" size={48} color={colors.primary} />
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send you reset instructions.</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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

        <Pressable
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
        </Pressable>

        <Pressable onPress={() => { router.back(); router.push('/auth/login'); }} style={styles.loginRow}>
          <Text style={styles.loginText}>
            Remember your password? <Text style={styles.loginBold}>Sign In</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  closeBtn: { position: 'absolute', top: 56, right: spacing.xl, zIndex: 10, padding: 4 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxl },

  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black, marginTop: spacing.xl },
  subtitle: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xxl },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg, width: '100%' },
  errorText: { color: colors.error, fontSize: fontSize.sm, flex: 1 },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, width: '100%',
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.lg, paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    marginBottom: spacing.xxl,
  },
  input: { flex: 1, color: colors.text, fontSize: fontSize.md },

  submitBtn: { backgroundColor: colors.primary, paddingVertical: 15, borderRadius: radius.md, alignItems: 'center', width: '100%' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: fontWeight.bold },

  loginRow: { marginTop: spacing.xxl },
  loginText: { color: colors.textMuted, fontSize: fontSize.md },
  loginBold: { color: colors.primary, fontWeight: fontWeight.bold },

  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(8,145,178,0.1)', justifyContent: 'center', alignItems: 'center' },
  successTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black, marginTop: spacing.xl },
  successSub: { color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center', lineHeight: 22, marginTop: spacing.md },
  emailHighlight: { color: colors.primary, fontWeight: fontWeight.bold },
  backToLoginBtn: { marginTop: spacing.xxl, paddingVertical: 14, paddingHorizontal: 40, backgroundColor: colors.primary, borderRadius: radius.md },
  backToLoginText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },
  tryAgainText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xl },
});
