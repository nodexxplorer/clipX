import React, { useState, useEffect } from 'react';
import {
    View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@apollo/client/react';
import { INITIALIZE_SUBSCRIPTION } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: '₦0',
        period: '/month',
        icon: 'tv-outline' as const,
        color: '#6B7280',
        gradient: ['#6B7280', '#4B5563'],
        features: ['SD Quality', '1 Screen', 'Ads included', 'Limited library'],
    },
    {
        id: 'standard',
        name: 'Standard',
        price: '₦3,000',
        period: '/month',
        icon: 'star-outline' as const,
        color: '#0891b2',
        gradient: ['#0891b2', '#2563EB'],
        popular: true,
        features: ['HD Quality', '3 Screens', 'No ads', '15 downloads/mo', 'Full library'],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '₦8,000',
        period: '/month',
        icon: 'diamond-outline' as const,
        color: '#8B5CF6',
        gradient: ['#8B5CF6', '#EC4899'],
        features: ['4K Ultra HD', '6 Screens', 'No ads', '50 downloads/mo', 'Full library', 'AI recommendations'],
    },
    {
        id: 'family',
        name: 'Family',
        price: '₦12,000',
        period: '/month',
        icon: 'people-outline' as const,
        color: '#F59E0B',
        gradient: ['#F59E0B', '#EF4444'],
        features: ['4K Ultra HD', '8 Screens', 'No ads', 'Unlimited downloads', '5 family members', 'Parental controls'],
    },
];

export default function SubscriptionPlansScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const [initSubscription] = useMutation(INITIALIZE_SUBSCRIPTION);

    if (!isAuthenticated) {
        router.replace('/auth/login');
        return null;
    }

    const currentTier = (user as any)?.subscriptionTier || 'free';

    const handleSubscribe = async (planId: string) => {
        if (planId === 'free' || planId === currentTier) return;
        setProcessing(true);
        setSelectedPlan(planId);
        try {
            const { data } = await initSubscription({
                variables: { plan: planId, billing: 'monthly' },
            });
            const result = (data as any)?.initializeSubscription;
            if (result?.authorizationUrl) {
                // Navigate to payment WebView
                router.push({
                    pathname: '/subscription/payment' as any,
                    params: { url: result.authorizationUrl, plan: planId },
                });
            }
        } catch (err: any) {
            console.error('Subscription error:', err.message);
        }
        setProcessing(false);
        setSelectedPlan(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Choose Plan</Text>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>Unlock premium features with a plan that works for you</Text>

                {PLANS.map(plan => {
                    const isCurrent = plan.id === currentTier;
                    const isSelected = selectedPlan === plan.id;
                    return (
                        <Pressable
                            key={plan.id}
                            style={[
                                styles.planCard,
                                isCurrent && styles.planCardCurrent,
                                plan.popular && styles.planCardPopular,
                            ]}
                            onPress={() => handleSubscribe(plan.id)}
                            disabled={processing || isCurrent || plan.id === 'free'}
                        >
                            {plan.popular && (
                                <View style={styles.popularBadge}>
                                    <Text style={styles.popularText}>MOST POPULAR</Text>
                                </View>
                            )}
                            <View style={styles.planHeader}>
                                <View style={[styles.planIcon, { backgroundColor: `${plan.color}20` }]}>
                                    <Ionicons name={plan.icon} size={22} color={plan.color} />
                                </View>
                                <View style={styles.planHeaderText}>
                                    <Text style={styles.planName}>{plan.name}</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.planPrice}>{plan.price}</Text>
                                        <Text style={styles.planPeriod}>{plan.period}</Text>
                                    </View>
                                </View>
                                {isCurrent && (
                                    <View style={styles.currentBadge}>
                                        <Text style={styles.currentBadgeText}>Current</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.featureList}>
                                {plan.features.map((f, i) => (
                                    <View key={i} style={styles.featureItem}>
                                        <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                                        <Text style={styles.featureText}>{f}</Text>
                                    </View>
                                ))}
                            </View>

                            {!isCurrent && plan.id !== 'free' && (
                                <View style={[styles.subscribeBtn, { backgroundColor: plan.color }]}>
                                    {isSelected && processing ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.subscribeBtnText}>
                                            {currentTier !== 'free' ? 'Switch Plan' : 'Subscribe'}
                                        </Text>
                                    )}
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md },
    backBtn: { padding: spacing.sm },
    headerTitle: { flex: 1, color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black, textAlign: 'center' },

    scrollContent: { padding: spacing.xl, paddingBottom: 120 },
    subtitle: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center', marginBottom: spacing.xl },

    planCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    planCardCurrent: { borderColor: colors.primary, borderWidth: 2 },
    planCardPopular: { borderColor: '#0891b2', borderWidth: 1.5 },

    popularBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#0891b2', paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 12 },
    popularText: { color: '#fff', fontSize: 10, fontWeight: fontWeight.black, letterSpacing: 1 },

    planHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
    planIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    planHeaderText: { flex: 1 },
    planName: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 2 },
    planPrice: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black },
    planPeriod: { color: colors.textMuted, fontSize: fontSize.sm },

    currentBadge: { backgroundColor: `${colors.primary}20`, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    currentBadgeText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.bold },

    featureList: { gap: 8 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    featureText: { color: colors.textSecondary, fontSize: fontSize.sm },

    subscribeBtn: { marginTop: spacing.lg, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
    subscribeBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
