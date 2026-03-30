import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { GET_STREAMING_URL, GET_MOVIE, UPDATE_WATCH_PROGRESS } from '@/lib/graphql';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function WatchScreen() {
    const { id, localUri } = useLocalSearchParams<{ id: string, localUri?: string }>();
    const router = useRouter();

    const [updateProgress] = useMutation<any>(UPDATE_WATCH_PROGRESS);

    // Queries (Skip if localUri is provided)
    const { data: movieData } = useQuery<any>(GET_MOVIE, { variables: { id }, skip: !!localUri });
    const { data: streamData, loading: streamLoading, error: streamError } = useQuery<any>(GET_STREAMING_URL, {
        variables: { movieId: id },
        skip: !!localUri
    });

    const movie = movieData?.movie;
    const streamUrl = localUri ? localUri : streamData?.streamingUrl;

    // Player setup - initialized when streamUrl is available
    const player = useVideoPlayer(streamUrl || null, player => {
        player.loop = false;
        player.play();
    });

    // Periodic Sync (Only for online streams currently)
    useEffect(() => {
        if (!player || !!localUri) return;
        
        const syncInterval = setInterval(() => {
            if (player.playing) {
                updateProgress({
                    variables: {
                        movieId: id,
                        contentType: 'movie',
                        currentTime: Math.floor(player.currentTime || 0),
                        duration: Math.floor(player.duration || 120 * 60)
                    }
                }).catch(err => console.log('Sync error:', err.message));
            }
        }, 10000);

        return () => clearInterval(syncInterval);
    }, [player, id, updateProgress, localUri]);

    // Final sync on unmount
    useEffect(() => {
        return () => {
            if (player && !localUri) {
                updateProgress({
                    variables: {
                        movieId: id,
                        contentType: 'movie',
                        currentTime: Math.floor(player.currentTime || 0),
                        duration: Math.floor(player.duration || 120 * 60)
                    }
                }).catch(() => {});
            }
        };
    }, [player, id, updateProgress, localUri]);

    if (!localUri && streamLoading) {
        return (
            <View style={styles.centerContainer}>
                <StatusBar hidden />
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading stream...</Text>
            </View>
        );
    }

    if (streamError || !streamUrl) {
        return (
            <View style={styles.centerContainer}>
                <StatusBar hidden />
                <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
                <Text style={styles.errorTitle}>Stream Unavailable</Text>
                <Text style={styles.errorSub}>
                    {streamError?.message || 'This content is not available for streaming right now.'}
                </Text>
                <View style={styles.errorActions}>
                    <Pressable style={styles.retryBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={18} color="#fff" />
                        <Text style={styles.retryText}>Go Back</Text>
                    </Pressable>
                    <Pressable style={styles.reportBtn} onPress={() => router.push({ pathname: '/report', params: { movieId: id, movieTitle: movie?.title } })}>
                        <Ionicons name="flag-outline" size={18} color={colors.warning} />
                        <Text style={styles.reportText}>Report Issue</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <VideoView 
                style={styles.video} 
                player={player} 
                allowsFullscreen 
                allowsPictureInPicture
                nativeControls={true}
            />
            {/* Safe Top left back button if native controls are hidden or don't map well to our 'Go back' */}
            <Pressable style={styles.backBtnWrapper} onPress={() => router.back()}>
                <Ionicons name="close" size={32} color="#fff" />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    video: { flex: 1, width: '100%', height: '100%' },
    centerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: colors.textMuted, marginTop: spacing.lg, fontSize: fontSize.md },
    errorTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: spacing.xl },
    errorSub: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
    errorActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xxl },
    retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radius.md },
    retryText: { color: '#fff', fontWeight: fontWeight.bold },
    reportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
    reportText: { color: colors.warning, fontWeight: fontWeight.bold },
    
    backBtnWrapper: { position: 'absolute', top: 40, left: 20, zIndex: 100, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: radius.round },
});
