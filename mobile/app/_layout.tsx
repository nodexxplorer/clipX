import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ApolloProvider } from '@apollo/client/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import client from '@/lib/apollo';
import { AuthProvider } from '@/contexts/AuthContext';
import { ParentalProvider } from '@/contexts/ParentalContext';
import { colors } from '@/constants/theme';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { REGISTER_PUSH_TOKEN } from '@/lib/graphql';
import { initOfflineDB, reconcileWithServer } from '@/lib/downloads';
import { initSubscriptions } from '@/lib/subscriptions';
import 'react-native-reanimated';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      registerForPushNotificationsAsync().then(async (token) => {
        if (token) {
          try {
            await client.mutate({
              mutation: REGISTER_PUSH_TOKEN,
              variables: { fcmToken: token, deviceType: Platform.OS },
            });
            console.log('Push token registered with backend');
          } catch (err) {
            console.warn('Failed to register push token:', err);
          }
        }
      });
      initSubscriptions().catch(e => console.log('RevenueCat Init Error:', e));
      initOfflineDB()
        .then(() => {
          console.log('Offline DB initialized');
          return reconcileWithServer();
        })
        .catch(e => console.log('Offline DB Error:', e));
    }
  }, []);
  return (
    <GestureHandlerRootView style={styles.container}>
      <ApolloProvider client={client}>
        <AuthProvider>
          <ParentalProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
              }}
            >
              {/* Tabs */}
              <Stack.Screen name="(tabs)" />

              {/* Detail screens */}
              <Stack.Screen name="movie/[id]" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="watch/[id]" options={{ animation: 'fade' }} />
              <Stack.Screen name="genres/[slug]" />

              {/* Auth - modals */}
              <Stack.Screen name="auth/login" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="auth/register" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="auth/forgot-password" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />

              {/* Browse */}
              <Stack.Screen name="movies/index" />
              <Stack.Screen name="series" />
              <Stack.Screen name="genres/index" />

              {/* Feature pages */}
              <Stack.Screen name="dashboard" />
              {/* Subscription commented out for now */}
              {/* <Stack.Screen name="pricing" options={{ animation: 'slide_from_bottom' }} /> */}
              {/* <Stack.Screen name="subscription" /> */}
              <Stack.Screen name="notifications" />
              <Stack.Screen name="history" />
              <Stack.Screen name="report" />
              <Stack.Screen name="search" options={{ animation: 'fade' }} />
              <Stack.Screen name="legal" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="continue-watching" options={{ animation: 'slide_from_bottom' }} />
            </Stack>
            <StatusBar style="light" />
          </ParentalProvider>
        </AuthProvider>
      </ApolloProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});