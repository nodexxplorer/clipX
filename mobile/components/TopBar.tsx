/**
 * TopBar — Premium top navigation bar for clipX
 * Features: logo, search press → navigates to search tab, notification bell, account tag + dropdown
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client/react';

import { useAuth } from '@/contexts/AuthContext';
import { GET_DASHBOARD } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import AccountCard from '@/components/AccountCard';
import type { DashboardData, User } from '@/types';

interface TopBarProps {
  scrollY: Animated.Value;
}

export const TOP_BAR_HEIGHT = 56;

export default function TopBar({ scrollY }: TopBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);

  const { data: dashData } = useQuery<{ dashboardData: DashboardData }>(GET_DASHBOARD, {
    skip: !user,
    fetchPolicy: 'cache-first',
  });

  const bgOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const borderOpacity = scrollY.interpolate({
    inputRange: [40, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const toggleAccount = useCallback(() => {
    setAccountOpen(prev => !prev);
  }, []);

  const dismissAccount = useCallback(() => {
    setAccountOpen(false);
  }, []);

  const TIER_COLORS: Record<string, string> = {
    free: colors.free,
    standard: colors.standard,
    pro: colors.pro,
  };

  const tier = user?.subscriptionTier ?? 'free';
  const tierColor = TIER_COLORS[tier] ?? TIER_COLORS.free;
  const firstName = (user?.name ?? 'Guest').split(' ')[0];
  const initial = (user?.name ?? 'U')[0].toUpperCase();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      {/* Background fills */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity, backgroundColor: 'rgba(5,6,7,0.92)' }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { borderBottomWidth: 1, borderBottomColor: colors.border, opacity: borderOpacity }]} />

      <View style={styles.inner}>
        {/* Logo */}
        <Text style={styles.logo}>
          clip<Text style={{ color: colors.primary }}>X</Text>
        </Text>

        {/* Search button → navigates to search tab */}
        <Pressable style={styles.searchBtn} onPress={() => router.push('/(tabs)/search' as any)}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search movies, series...</Text>
        </Pressable>

        {/* Notifications */}
        <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={21} color={colors.text} />
          <View style={styles.notifDot} />
        </Pressable>

        {/* Account tag */}
        <Pressable style={styles.accountTag} onPress={toggleAccount}>
          <View style={[styles.accountAvatar, { borderColor: tierColor }]}>
            <Text style={[styles.accountInitial, { color: tierColor }]}>{initial}</Text>
          </View>
        </Pressable>
      </View>

      {/* Account dropdown card */}
      {user && (
        <View style={styles.cardAnchor}>
          <AccountCard
            visible={accountOpen}
            onDismiss={dismissAccount}
            user={user}
            stats={dashData?.dashboardData?.stats ?? user.stats}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: TOP_BAR_HEIGHT,
    gap: spacing.sm,
  },
  logo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
    minWidth: 48,
  },
  searchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  iconBtn: {
    position: 'relative',
    padding: 4,
  },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  accountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  accountAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  accountInitial: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  cardAnchor: {
    position: 'relative',
  },
});
