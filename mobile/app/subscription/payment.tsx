import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@apollo/client/react';
import { VERIFY_PAYMENT } from '@/lib/graphql';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';

export default function PaymentScreen() {
    const router = useRouter();
    const { url, plan } = useLocalSearchParams<{ url: string; plan: string }>();
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

    const [verifyPayment] = useMutation(VERIFY_PAYMENT);

    const handleNavigationChange = async (navState: any) => {
        const { url: currentUrl } = navState;

        // Paystack redirects back with ?reference=xxx
        if (currentUrl?.includes('reference=') && !verifying) {
            setVerifying(true);
            const ref = new URL(currentUrl).searchParams.get('reference');
            if (ref) {
                try {
                    const { data } = await verifyPayment({
                        variables: { reference: ref },
                    });
                    const result = (data as any)?.verifyPayment;
                    setStatus(result?.success ? 'success' : 'failed');
                } catch {
                    setStatus('failed');
                }
            } else {
                setStatus('failed');
            }
        }
    };

    if (!url) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={styles.centerTitle}>Invalid Payment</Text>
                <Text style={styles.centerSub}>No payment URL provided.</Text>
                <Pressable style={styles.btn} onPress={() => router.back()}>
                    <Text style={styles.btnText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    if (verifying) {
        return (
            <View style={styles.center}>
                {status === 'loading' ? (
                    <>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.centerTitle}>Verifying Payment...</Text>
                        <Text style={styles.centerSub}>Please wait while we confirm your transaction</Text>
                    </>
                ) : status === 'success' ? (
                    <>
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                        </View>
                        <Text style={styles.centerTitle}>Payment Successful! 🎉</Text>
                        <Text style={styles.centerSub}>
                            You've been upgraded to {plan?.charAt(0).toUpperCase()}{plan?.slice(1)}. Enjoy premium features!
                        </Text>
                        <Pressable style={[styles.btn, styles.successBtn]} onPress={() => router.replace('/(tabs)')}>
                            <Text style={styles.btnText}>Start Watching</Text>
                        </Pressable>
                    </>
                ) : (
                    <>
                        <Ionicons name="close-circle" size={64} color={colors.error} />
                        <Text style={styles.centerTitle}>Payment Failed</Text>
                        <Text style={styles.centerSub}>Something went wrong. Please try again.</Text>
                        <Pressable style={[styles.btn, styles.errorBtn]} onPress={() => router.back()}>
                            <Text style={styles.btnText}>Try Again</Text>
                        </Pressable>
                    </>
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Secure Payment</Text>
                <Ionicons name="lock-closed" size={16} color={colors.success} />
            </View>

            {loading && (
                <View style={styles.webviewLoading}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading payment page...</Text>
                </View>
            )}

            <WebView
                source={{ uri: url }}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onNavigationStateChange={handleNavigationChange}
                style={[styles.webview, loading && { opacity: 0 }]}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 },
    centerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: spacing.xl, textAlign: 'center' },
    centerSub: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },

    btn: { marginTop: spacing.xl, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary },
    btnText: { color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.bold },
    successBtn: { backgroundColor: colors.success },
    errorBtn: { backgroundColor: colors.error },
    successIcon: { marginBottom: spacing.sm },

    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md, gap: 8, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    backBtn: { padding: spacing.sm },
    headerTitle: { flex: 1, color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },

    webviewLoading: { position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center', zIndex: 10 },
    loadingText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.md },
    webview: { flex: 1 },
});
