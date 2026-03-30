/**
 * AccountCard — Animated dropdown card for the TopBar
 * Shows: avatar + name + email, subscription badge, watch stats, actions
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import type { User, UserStats } from '@/types';

const { width: SW } = Dimensions.get('window');

interface AccountCardProps {
  visible: boolean;
  onDismiss: () => void;
  user: User;
  stats: UserStats | null;
}

function formatHours(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const TIER_COLORS: Record<string, string> = {
  free: colors.free,
  standard: colors.standard,
  pro: colors.pro,
};

export default function AccountCard({ visible, onDismiss, user, stats }: AccountCardProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const animHeight = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(animHeight, { toValue: 1, useNativeDriver: false, tension: 60, friction: 10 }),
        Animated.timing(animOpacity, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animHeight, { toValue: 0, duration: 180, useNativeDriver: false }),
        Animated.timing(animOpacity, { toValue: 0, duration: 150, useNativeDriver: false }),
      ]).start();
    }
  }, [visible]);

  const cardMaxH = 310;
  const interpolatedH = animHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, cardMaxH],
  });

  const tierColor = TIER_COLORS[user.subscriptionTier] ?? TIER_COLORS.free;
  const moviesWatched = stats?.moviesWatched ?? 0;
  const totalWatchTime = stats?.totalWatchTime ?? 0;
  const watchlistCount = stats?.watchlistCount ?? 0;

  const handleLogout = async () => {
    onDismiss();
    await logout();
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <Pressable style={styles.backdrop} onPress={onDismiss} />

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          { maxHeight: interpolatedH, opacity: animOpacity },
        ]}
      >
        {/* Section 1 — Identity */}
        <View style={styles.identity}>
          <View style={styles.avatarCircle}>
            {user.avatar ? (
              <View style={styles.avatarImg}>
                <Text style={styles.avatarFallback}>{(user.name ?? 'U')[0].toUpperCase()}</Text>
              </View>
            ) : (
              <Text style={styles.avatarFallback}>{(user.name ?? 'U')[0].toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.identityText}>
            <Text style={styles.identityName} numberOfLines={1}>{user.name ?? 'User'}</Text>
            <Text style={styles.identityEmail} numberOfLines={1}>{user.email}</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + '30', borderColor: tierColor + '55' }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>
              {user.subscriptionTier.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Section 3 — Watch Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statEmoji}>🎬</Text>
            <Text style={styles.statValue}>{moviesWatched}</Text>
            <Text style={styles.statLabel}>Watched</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statEmoji}>⏱</Text>
            <Text style={styles.statValue}>{formatHours(totalWatchTime)}</Text>
            <Text style={styles.statLabel}>Watch time</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statEmoji}>📋</Text>
            <Text style={styles.statValue}>{watchlistCount}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Section 4 — Actions */}
        <Pressable
          style={styles.actionRow}
          onPress={() => { onDismiss(); router.push('/dashboard?tab=preference' as any); }}
        >
          <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.actionText}>Settings</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>

        <Pressable style={styles.actionRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>Sign Out</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.error} />
        </Pressable>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 199,
  },
  card: {
    position: 'absolute',
    top: 0,
    right: spacing.lg,
    width: SW * 0.78,
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    zIndex: 200,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 24,
  },

  // Identity
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallback: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  identityText: { flex: 1 },
  identityName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  identityEmail: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statChip: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    padding: 10,
    alignItems: 'center',
  },
  statEmoji: { fontSize: 16 },
  statValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 1,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  actionText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});
