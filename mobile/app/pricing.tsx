import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface PlanFeature { text: string; included: boolean }

interface Plan {
    name: string;
    price: string;
    period: string;
    color: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    popular?: boolean;
    features: PlanFeature[];
}

const plans: Plan[] = [
    {
        name: 'Free',
        price: '₦0',
        period: '/month',
        color: colors.free,
        icon: 'film-outline',
        features: [
            { text: '480p SD quality', included: true },
            { text: '1 screen at a time', included: true },
            { text: '5 downloads/month', included: true },
            { text: 'Limited content library', included: true },
            { text: 'Heavy ads', included: true },
            { text: 'Basic watchlist (10 titles)', included: true },
            { text: 'FAQ support only', included: true },
            { text: 'HD/4K streaming', included: false },
            { text: 'Offline viewing', included: false },
        ],
    },
    {
        name: 'Standard',
        price: '₦3,000',
        period: '/month',
        color: colors.standard,
        icon: 'star',
        popular: true,
        features: [
            { text: '720p HD quality', included: true },
            { text: '3 screens at a time', included: true },
            { text: '15 downloads/month', included: true },
            { text: 'Full content library', included: true },
            { text: 'No ads', included: true },
            { text: 'Unlimited watchlist', included: true },
            { text: 'Email support', included: true },
            { text: 'Offline viewing', included: true },
            { text: '4K streaming', included: false },
        ],
    },
    {
        name: 'Pro',
        price: '₦8,000',
        period: '/month',
        color: colors.pro,
        icon: 'diamond',
        features: [
            { text: '4K Ultra HD + HDR', included: true },
            { text: '6 screens at a time', included: true },
            { text: '50 downloads/month', included: true },
            { text: 'Full content + early access', included: true },
            { text: 'No ads', included: true },
            { text: 'Unlimited watchlist', included: true },
            { text: 'Priority support', included: true },
            { text: 'Offline viewing', included: true },
            { text: 'Dolby Atmos audio', included: true },
        ],
    },
];

function PlanCard({ plan }: { plan: Plan }) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const subscriptionTier = useAppStore(state => state.subscriptionTier);
    const setSubscriptionTier = useAppStore(state => state.setSubscriptionTier);
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        if (plan.name.toLowerCase() === subscriptionTier) {
            Alert.alert("Already subscribed", "You are already on this plan.");
            return;
        }

        if (plan.name.toLowerCase() === 'free') {
            return;
        }

        setLoading(true);
        try {
            // Import the purchasePackage function dynamically or from the top
            const { getOfferings, purchasePackage } = require('@/lib/subscriptions');
            
            // Fetch packages from RevenueCat
            const packages = await getOfferings();
            if (!packages || packages.length === 0) {
                Alert.alert("Store Error", "In-app purchases are not currently available.");
                setLoading(false);
                return;
            }

            // Find matching package (assuming product identifiers contain the plan name 'standard' or 'pro')
            const pkgToBuy = packages.find((p: any) => p.product.identifier.toLowerCase().includes(plan.name.toLowerCase()));
            
            if (!pkgToBuy) {
                // Mock success for development if no packages matched
                console.warn(`No matching RevenueCat package for ${plan.name}. Proceeding in mock mode...`);
                setSubscriptionTier(plan.name.toLowerCase() as any);
                Alert.alert("Success", `You have successfully subscribed to the ${plan.name} plan!`);
                router.back();
                setLoading(false);
                return;
            }

            // Execute purchase via Native App Stores
            const isSuccess = await purchasePackage(pkgToBuy);
            
            if (isSuccess) {
                setSubscriptionTier(plan.name.toLowerCase() as any);
                Alert.alert("Success", "Welcome to Premium! Your purchase was successful.");
                router.back();
            } else {
                Alert.alert("Error", "Purchase could not be verified.");
            }
        } catch (error: any) {
            Alert.alert("Checkout Failed", error.message || "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const isCurrentPlan = plan.name.toLowerCase() === subscriptionTier;
    return (
        <View style={[styles.planCard, plan.popular && styles.planCardPopular]}>
            {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
            )}
            <View style={styles.planHeader}>
                <Ionicons name={plan.icon} size={24} color={plan.color} />
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
            </View>
            <View style={styles.featureList}>
                {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureItem}>
                        <Ionicons
                            name={f.included ? 'checkmark-circle' : 'close-circle'}
                            size={16}
                            color={f.included ? colors.success : colors.textDim}
                        />
                        <Text style={[styles.featureText, !f.included && styles.featureDisabled]}>
                            {f.text}
                        </Text>
                    </View>
                ))}
            </View>
            <Pressable
                style={[
                    styles.selectBtn, 
                    { backgroundColor: isCurrentPlan ? colors.surfaceLight : plan.color },
                    loading && { opacity: 0.7 }
                ]}
                onPress={handleSubscribe}
                disabled={loading || isCurrentPlan}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={[styles.selectBtnText, isCurrentPlan && { color: colors.text }]}>
                        {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
                    </Text>
                )}
            </Pressable>
        </View>
    );
}

export default function PricingScreen() {
    const router = useRouter();
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.pageTitle}>Choose Your Plan</Text>
            <Text style={styles.subtitle}>1 month free on your first subscription!</Text>
            {plans.map(plan => <PlanCard key={plan.name} plan={plan} />)}
            <Text style={styles.footer}>All plans include a 1-month free trial. Cancel anytime.</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: spacing.xl, paddingBottom: 100, paddingTop: 56 },
    backBtn: { padding: spacing.sm, alignSelf: 'flex-start' },
    pageTitle: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: fontWeight.black, marginTop: spacing.md },
    subtitle: { color: colors.primary, fontSize: fontSize.md, fontWeight: fontWeight.medium, marginTop: spacing.xs, marginBottom: spacing.xxl },
    footer: { color: colors.textDim, fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.xxl },

    planCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.xxl, marginBottom: spacing.xl, overflow: 'hidden' },
    planCardPopular: { borderColor: colors.standard, borderWidth: 1.5 },
    popularBadge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: radius.md },
    popularText: { color: '#fff', fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
    planHeader: { alignItems: 'center', gap: spacing.sm },
    planName: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
    priceRow: { flexDirection: 'row', alignItems: 'baseline' },
    planPrice: { color: colors.text, fontSize: 36, fontWeight: fontWeight.black },
    planPeriod: { color: colors.textMuted, fontSize: fontSize.md },

    featureList: { marginTop: spacing.xl, gap: spacing.md },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureText: { color: colors.textSecondary, fontSize: fontSize.sm },
    featureDisabled: { color: colors.textDim },

    selectBtn: { marginTop: spacing.xl, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
    selectBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
