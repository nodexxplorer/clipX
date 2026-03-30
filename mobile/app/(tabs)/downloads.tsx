/**
 * Downloads Tab Screen
 * Re-exports the existing downloads screen adapted for tab navigation (no back button header)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { getDownloads, removeDownload } from '@/lib/downloads';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '@/contexts/AuthContext';

interface DownloadItem {
  id: string;
  title: string;
  posterUrl: string;
  localPath: string;
  status: 'downloading' | 'completed' | 'failed';
  progress: number;
  fileSize?: number;
  downloadedAt: number;
}

export default function DownloadsTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    setLoading(true);
    try {
      const data = await getDownloads();
      setDownloads((data as DownloadItem[]) || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, path: string) => {
    Alert.alert('Remove Download', 'Are you sure you want to remove this download?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeDownload(id, path);
          loadDownloads();
        },
      },
    ]);
  };

  const handlePlay = async (item: DownloadItem) => {
    if (item.status !== 'completed') {
      Alert.alert('Notice', 'Download has not finished yet.');
      return;
    }
    const info = await FileSystem.getInfoAsync(item.localPath);
    if (!info.exists) {
      Alert.alert('Error', 'File not found. It may have been deleted.');
      return;
    }
    router.push({ pathname: '/watch/[id]', params: { id: item.id, localUri: item.localPath } } as any);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="lock-closed-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Sign In Required</Text>
        <Text style={styles.emptySub}>Sign in to view and manage offline downloads.</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Not Supported</Text>
        <Text style={styles.emptySub}>Offline downloads are not supported on the web platform.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Ionicons name="download" size={22} color={colors.primary} />
        <Text style={styles.headerTitle}>Downloads</Text>
        <Text style={styles.headerCount}>{downloads.length} items</Text>
      </View>

      {downloads.length === 0 && !loading ? (
        <View style={styles.centerContainer}>
          <Ionicons name="download-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Downloads</Text>
          <Text style={styles.emptySub}>Downloaded movies and series will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => handlePlay(item)}>
              <Image source={{ uri: item.posterUrl }} style={styles.poster} contentFit="cover" />
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.status}>
                  {item.status === 'completed' ? '✓ Ready to watch' : `${Math.round(item.progress * 100)}% ${item.status}`}
                </Text>
              </View>
              <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.localPath)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  headerTitle: {
    color: '#fff',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headerCount: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  poster: {
    width: 80,
    height: 120,
  },
  info: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  status: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  deleteBtn: {
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
});
