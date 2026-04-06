import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { GET_DASHBOARD, CANCEL_SUBSCRIPTION } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const tierConfig: Record<string, { label: string; color: string; icon: string }> = {
  free: { label: 'Free', color: colors.free, icon: 'film-outline' },
  standard: { label: 'Standard', color: colors.standard, icon: 'star' },
  pro: { label: 'Pro', color: colors.pro, icon: 'diamond' },
};

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelStep, setCancelStep] = useState<'offer' | 'confirm'>('offer');

  const [cancelSub] = useMutation<any>(CANCEL_SUBSCRIPTION);

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.center}>
        <Ionicons name="card-outline" size={48} color={colors.textMuted} />
        <Text style={styles.centerTitle}>Subscription</Text>
        <Text style={styles.centerSub}>Sign in to manage your plan</Text>
        <Pressable style={styles.authBtn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.authBtnText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  const tier = tierConfig[user.subscriptionTier] || tierConfig.free;
  const isPaid = user.subscriptionTier !== 'free';
  const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;



  const handleCancel = async () => {
    if (cancelStep === 'offer') {
      setCancelStep('confirm');
    } else {
      try {
        const { data } = await cancelSub();
        if (data?.cancelSubscription?.success) {
          Alert.alert('Cancelled', 'Your subscription has been cancelled. You will retain access until your billing period ends.');
          setShowCancel(false);
          setCancelStep('offer');
        } else {
          Alert.alert('Error', data?.cancelSubscription?.message || 'Failed to cancel.');
        }
      } catch (err: any) {
        Alert.alert('Error', err.message.replace('ApolloError: ', ''));
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg }]}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>

      <Text style={styles.pageTitle}>Subscription</Text>

      {/* Current Plan Card */}
      <View style={[styles.planCard, { borderColor: tier.color }]}>
        <View style={styles.planHeader}>
          <Ionicons name={tier.icon as any} size={28} color={tier.color} />
          <View>
            <Text style={styles.planName}>{tier.label} Plan</Text>
            <Text style={styles.planStatus}>
              {isPaid ? 'Active' : 'Free tier'}
            </Text>
          </View>
          <View style={[styles.activeBadge, { backgroundColor: isPaid ? colors.success : colors.free }]}>
            <Text style={styles.activeBadgeText}>{isPaid ? 'ACTIVE' : 'FREE'}</Text>
          </View>
        </View>

        {expiresAt && (
          <View style={styles.expiryRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={styles.expiryText}>
              {isPaid ? 'Renews' : 'Expires'}: {expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        )}
      </View>

      {/* Upgrade / Change Plan */}
      <Pressable style={styles.upgradeBtn} onPress={() => router.push('/pricing')}>
        <Ionicons name="rocket-outline" size={20} color="#fff" />
        <Text style={styles.upgradeBtnText}>
          {isPaid ? 'Change Plan' : 'Upgrade to Premium'}
        </Text>
      </Pressable>

      {/* Features of current plan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YOUR PLAN INCLUDES</Text>
        <View style={styles.featuresCard}>
          {getFeatures(user.subscriptionTier).map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Cancel Subscription */}
      {isPaid && !showCancel && (
        <Pressable style={styles.cancelTrigger} onPress={() => setShowCancel(true)}>
          <Text style={styles.cancelTriggerText}>Cancel Subscription</Text>
        </Pressable>
      )}

      {/* Cancel Flow */}
      {showCancel && (
        <View style={styles.cancelCard}>
          {cancelStep === 'offer' ? (
            <>
              <Ionicons name="heart-circle" size={40} color={colors.warning} />
              <Text style={styles.cancelTitle}>We'd hate to see you go!</Text>
              <Text style={styles.cancelSub}>
                How about 50% off your next month?
              </Text>
              <Pressable style={styles.stayBtn} onPress={() => router.push('/pricing')}>
                <Text style={styles.stayBtnText}>Stay for 50% Off</Text>
              </Pressable>
              <Pressable style={styles.continueCancel} onPress={handleCancel}>
                <Text style={styles.continueCancelText}>No thanks, continue cancellation</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Ionicons name="warning" size={40} color={colors.error} />
              <Text style={styles.cancelTitle}>Are you sure?</Text>
              <Text style={styles.cancelSub}>
                You'll lose access to premium features at the end of your billing period.
              </Text>
              <Pressable style={styles.confirmCancelBtn} onPress={handleCancel}>
                <Text style={styles.confirmCancelText}>Confirm Cancellation</Text>
              </Pressable>
              <Pressable style={styles.keepBtn} onPress={() => { setShowCancel(false); setCancelStep('offer'); }}>
                <Text style={styles.keepBtnText}>Keep My Plan</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function getFeatures(tier: string): string[] {
  switch (tier) {
    case 'pro': return ['4K Ultra HD + HDR', '6 screens at a time', '50 downloads/month', 'Full content + early access', 'No ads', 'Priority support', 'Dolby Atmos audio'];
    case 'standard': return ['720p HD quality', '3 screens at a time', '15 downloads/month', 'Full content library', 'No ads', 'Email support', 'Offline viewing'];
    default: return ['480p SD quality', '1 screen at a time', '5 downloads/month', 'Limited content library', 'Basic watchlist'];
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl },
  centerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: spacing.lg },
  centerSub: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm },
  authBtn: { marginTop: spacing.xl, paddingHorizontal: 40, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md },
  authBtnText: { color: '#fff', fontWeight: fontWeight.bold },
  backBtn: { padding: spacing.sm, alignSelf: 'flex-start' },
  pageTitle: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: fontWeight.black, marginTop: spacing.md, marginBottom: spacing.xxl },

  planCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1.5, padding: spacing.xxl },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  planName: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  planStatus: { color: colors.textMuted, fontSize: fontSize.sm },
  activeBadge: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  activeBadgeText: { color: '#fff', fontSize: 10, fontWeight: fontWeight.black, letterSpacing: 1 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 0.5, borderTopColor: colors.border },
  expiryText: { color: colors.textMuted, fontSize: fontSize.sm },

  upgradeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl, paddingVertical: 14, backgroundColor: colors.primary, borderRadius: radius.md },
  upgradeBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: fontWeight.bold },

  section: { marginTop: spacing.xxl },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 1.5, marginBottom: spacing.md },
  featuresCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, gap: spacing.md },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureText: { color: colors.textSecondary, fontSize: fontSize.md },

  cancelTrigger: { alignItems: 'center', marginTop: spacing.xxxl },
  cancelTriggerText: { color: colors.textDim, fontSize: fontSize.sm },

  cancelCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.xxl, alignItems: 'center', marginTop: spacing.xxl, gap: spacing.md },
  cancelTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  cancelSub: { color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center', lineHeight: 22 },
  stayBtn: { backgroundColor: colors.warning, paddingVertical: 12, paddingHorizontal: 32, borderRadius: radius.md, marginTop: spacing.sm, width: '100%', alignItems: 'center' },
  stayBtnText: { color: '#000', fontWeight: fontWeight.bold, fontSize: fontSize.md },
  continueCancel: { marginTop: spacing.sm },
  continueCancelText: { color: colors.textDim, fontSize: fontSize.sm },
  confirmCancelBtn: { backgroundColor: colors.error, paddingVertical: 12, paddingHorizontal: 32, borderRadius: radius.md, marginTop: spacing.sm, width: '100%', alignItems: 'center' },
  confirmCancelText: { color: '#fff', fontWeight: fontWeight.bold },
  keepBtn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: radius.md, marginTop: spacing.sm, width: '100%', alignItems: 'center' },
  keepBtnText: { color: '#fff', fontWeight: fontWeight.bold },
});
