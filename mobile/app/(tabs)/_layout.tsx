/**
 * clipX — Floating Pill Tab Bar Layout
 * 5 tabs: Home, Search, Watchlist, Downloads, Profile
 * Center FAB play button between Search & Watchlist
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client/react';

import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { GET_DASHBOARD } from '@/lib/graphql';
import type { DashboardData } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabDef {
  name: string;
  title: string;
  icon: IoniconsName;
  iconFocused: IoniconsName;
}

const TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconFocused: 'home' },
  { name: 'search', title: 'Search', icon: 'search-outline', iconFocused: 'search' },
  // slot 2 is the FAB
  { name: 'watchlist', title: 'Watchlist', icon: 'heart-outline', iconFocused: 'heart' },
  { name: 'downloads', title: 'Downloads', icon: 'download-outline', iconFocused: 'download' },
  { name: 'profile', title: 'Profile', icon: 'person-outline', iconFocused: 'person' },
];

const TAB_BAR_HEIGHT = 64;
const FAB_SIZE = 56;

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const { data: dashData } = useQuery<{ dashboardData: DashboardData }>(GET_DASHBOARD, {
    skip: !user,
    fetchPolicy: 'cache-first',
  });

  const handleFABPress = useCallback(() => {
    const continueWatching = dashData?.dashboardData?.continueWatching;
    if (continueWatching && continueWatching.length > 0) {
      const movieId = continueWatching[0].movie.id;
      router.push(`/watch/${movieId}` as any);
    } else {
      router.push('/movies' as any);
    }
  }, [dashData, router]);

  const bottomPad = Platform.OS === 'ios' ? insets.bottom : 12;

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: bottomPad }]}>
      <View style={styles.tabBarPill}>
        {state.routes.map((route: any, index: number) => {
          const tabDef = TABS[index];
          if (!tabDef) return null;

          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          const iconColor = isFocused ? colors.primary : colors.tabInactive;
          const iconName = isFocused ? tabDef.iconFocused : tabDef.icon;

          // Insert FAB before Watchlist (index 2, which is after Search at index 1)
          const insertFAB = index === 2;

          return (
            <React.Fragment key={route.key}>
              {insertFAB && (
                <Pressable style={styles.fabContainer} onPress={handleFABPress}>
                  <View style={styles.fab}>
                    <Ionicons name="play-circle" size={28} color="#fff" />
                  </View>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
              >
                <Ionicons name={iconName} size={22} color={iconColor} />
                {isFocused && (
                  <Text style={styles.tabLabel}>{tabDef.title}</Text>
                )}
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    // No background on outer — the pill handles it
  },
  tabBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: colors.border,
    height: TAB_BAR_HEIGHT,
    width: '100%',
    paddingHorizontal: spacing.sm,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: 2,
  },
  tabLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    marginTop: 1,
  },

  // FAB
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -4,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -20 }],
    // Glow shadow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
});
