import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ApolloProvider } from '@apollo/client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import client from '@/lib/apollo';
import { AuthProvider } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ApolloProvider client={client}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="movie/[id]" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="watch/[id]" options={{ animation: 'fade', orientation: 'all' }} />
            <Stack.Screen name="auth/login" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="auth/register" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="search" options={{ animation: 'fade' }} />
          </Stack>
          <StatusBar style="light" />
        </AuthProvider>
      </ApolloProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
