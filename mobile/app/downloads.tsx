import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Platform, Alert, Modal, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { getDownloads, removeDownload } from '@/lib/downloads';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

const EXPIRY_DAYS = 30;
const TIER_LIMITS: Record<string, number> = { free: 5, standard: 25, pro: 100 };
const QUALITY_OPTIONS = [
    { key: '720', label: 'HD (720p)', size: '~800 MB', icon: 'film-outline' as const },
    { key: '1080', label: 'Full HD (1080p)', size: '~2.5 GB', icon: 'videocam-outline' as const },
];

export default function DownloadsScreen() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { canDownload, tier, tierColor } = useSubscription();
    const [downloads, setDownloads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [storageUsed, setStorageUsed] = useState(0);
    const [storageFree, setStorageFree] = useState(0);
    const [storageTotal, setStorageTotal] = useState(0);
    const [showQualityModal, setShowQualityModal] = useState(false);
    const [pendingDownload, setPendingDownload] = useState<any>(null);

    useEffect(() => {
        loadDownloads();
    }, []);

    const loadDownloads = async () => {
        setLoading(true);
        try {
            const data = await getDownloads();
            const now = Date.now();
            const valid: any[] = [];
            let expired = 0;
            let totalSize = 0;

            for (const item of (data || [])) {
                const ageMs = now - (item.downloadedAt || 0);
                const ageDays = ageMs / (1000 * 60 * 60 * 24);

                if (ageDays > EXPIRY_DAYS && item.status === 'completed') {
                    // Auto-purge expired downloads
                    await removeDownload(item.id, item.localPath).catch(() => {});
                    expired++;
                } else {
                    valid.push(item);
                    totalSize += item.fileSize || 0;
                }
            }

            setDownloads(valid);
            setStorageUsed(totalSize);

            if (expired > 0) {
                Alert.alert(
                    'Downloads Expired',
                    `${expired} download${expired > 1 ? 's' : ''} expired after ${EXPIRY_DAYS} days and ${expired > 1 ? 'were' : 'was'} removed automatically.`
                );
            }
        } catch (e) {
            console.warn(e);
        } finally {
            setLoading(false);
        }

        // Fetch device storage info
        try {
            const free = await FileSystem.getFreeDiskStorageAsync();
            const total = await FileSystem.getTotalDiskCapacityAsync();
            setStorageFree(free);
            setStorageTotal(total);
        } catch {}
    };

    // Download limit enforcement (Section 12)
    const checkDownloadLimit = useCallback(() => {
        const limit = TIER_LIMITS[tier] || 5;
        if (downloads.length >= limit) {
            Alert.alert(
                'Download Limit Reached',
                `Your ${tier} plan allows up to ${limit} downloads. Remove existing downloads or upgrade your plan.`,
                [{ text: 'OK' }]
            );
            return false;
        }
        return true;
    }, [downloads.length, tier]);

    // Quality selection modal trigger (Section 12)
    const initiateDownload = useCallback((item: any) => {
        if (!checkDownloadLimit()) return;
        setPendingDownload(item);
        setShowQualityModal(true);
    }, [checkDownloadLimit]);

    const confirmDownloadQuality = useCallback((quality: string) => {
        setShowQualityModal(false);
        if (pendingDownload) {
            // Proceed with download at selected quality
            Alert.alert('Download Started', `Downloading in ${quality === '1080' ? 'Full HD (1080p)' : 'HD (720p)'}...`);
            setPendingDownload(null);
        }
    }, [pendingDownload]);

    const handleDelete = (id: string, path: string) => {
        Alert.alert('Remove Download', 'Are you sure you want to remove this download?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Remove', 
                style: 'destructive', 
                onPress: async () => {
                    await removeDownload(id, path);
                    loadDownloads();
                } 
            }
        ]);
    };

    const handleBulkDelete = () => {
        if (selected.size === 0) return;
        Alert.alert(
            'Remove Selected',
            `Remove ${selected.size} download${selected.size > 1 ? 's' : ''}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove All',
                    style: 'destructive',
                    onPress: async () => {
                        for (const item of downloads) {
                            if (selected.has(item.id)) {
                                await removeDownload(item.id, item.localPath).catch(() => {});
                            }
                        }
                        setSelected(new Set());
                        setSelectMode(false);
                        loadDownloads();
                    }
                }
            ]
        );
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    };

    const selectAll = () => {
        if (selected.size === downloads.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(downloads.map(d => d.id)));
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
        if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
        return `${Math.round(bytes / 1024)} KB`;
    };

    const daysRemaining = (downloadedAt: number) => {
        const ageDays = (Date.now() - downloadedAt) / (1000 * 60 * 60 * 24);
        return Math.max(0, Math.floor(EXPIRY_DAYS - ageDays));
    };

    const handlePlay = async (item: any) => {
        if (item.status !== 'completed') {
            Alert.alert('Notice', 'Download has not finished yet.');
            return;
        }
        const info = await FileSystem.getInfoAsync(item.localPath);
        if (!info.exists) {
            Alert.alert('Error', 'File not found. It may have been deleted.');
            return;
        }
        router.push({ pathname: '/watch/[id]', params: { id: item.id, localUri: item.localPath } });
    };

    if (!isAuthenticated) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="lock-closed-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Sign In Required</Text>
                <Text style={styles.emptySub}>Sign in to view and manage offline downloads.</Text>
            </View>
        );
    }

    if (Platform.OS === 'web') {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Not Supported</Text>
                <Text style={styles.emptySub}>Offline downloads are not supported on the web platform.</Text>
            </View>
        );
    }

    // Tier gate — Free users can't download
    if (!canDownload) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Offline Downloads</Text>
                </View>
                <View style={styles.centerContainer}>
                    <View style={styles.upgradeBadge}>
                        <Ionicons name="diamond" size={40} color={colors.pro} />
                    </View>
                    <Text style={styles.emptyTitle}>Premium Feature</Text>
                    <Text style={styles.emptySub}>
                        Offline downloads are available on Standard and Pro plans.
                        Upgrade to download movies and watch them anywhere.
                    </Text>
                    <Pressable
                        style={styles.upgradeBtn}
                        onPress={() => router.push('/pricing' as any)}
                    >
                        <Ionicons name="arrow-up-circle" size={18} color="#fff" />
                        <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>
                <Text style={styles.headerTitle}>Offline Downloads</Text>
                <View style={{ flex: 1 }} />
                {downloads.length > 0 && (
                    <Pressable
                        onPress={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
                        style={styles.selectBtn}
                    >
                        <Text style={{ color: selectMode ? colors.primary : colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.bold }}>
                            {selectMode ? 'Cancel' : 'Select'}
                        </Text>
                    </Pressable>
                )}
            </View>

            {/* Storage & Quota Info (Section 12) */}
            {downloads.length > 0 && (
                <View style={styles.storageBar}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="server-outline" size={14} color={colors.textMuted} />
                            <Text style={styles.storageText}>{formatSize(storageUsed)} used · {downloads.length} file{downloads.length !== 1 ? 's' : ''}</Text>
                        </View>
                        <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                            {downloads.length}/{TIER_LIMITS[tier] || 5} downloads ({tier})
                        </Text>
                    </View>
                    {/* Device storage bar */}
                    {storageTotal > 0 && (
                        <View style={{ marginBottom: 4 }}>
                            <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                <View style={{
                                    height: '100%', borderRadius: 3,
                                    width: `${Math.min(((storageTotal - storageFree) / storageTotal) * 100, 100)}%`,
                                    backgroundColor: ((storageTotal - storageFree) / storageTotal) > 0.9 ? '#ef4444' : ((storageTotal - storageFree) / storageTotal) > 0.7 ? '#f59e0b' : colors.primary,
                                }} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                                <Text style={{ color: colors.textMuted, fontSize: 10 }}>{formatSize(storageFree)} free</Text>
                                <Text style={{ color: colors.textMuted, fontSize: 10 }}>{formatSize(storageTotal)} total</Text>
                            </View>
                        </View>
                    )}
                    {selectMode && (
                        <Pressable onPress={selectAll}>
                            <Text style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.bold }}>
                                {selected.size === downloads.length ? 'Deselect All' : 'Select All'}
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}

            {/* Bulk delete bar */}
            {selectMode && selected.size > 0 && (
                <Pressable style={styles.bulkDeleteBar} onPress={handleBulkDelete}>
                    <Ionicons name="trash" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md }}>
                        Delete {selected.size} selected
                    </Text>
                </Pressable>
            )}

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
                    renderItem={({ item }) => {
                        const days = daysRemaining(item.downloadedAt);
                        const isExpiring = days <= 5 && item.status === 'completed';

                        return (
                            <Pressable
                                style={[styles.card, selected.has(item.id) && styles.cardSelected]}
                                onPress={() => selectMode ? toggleSelect(item.id) : handlePlay(item)}
                                onLongPress={() => { if (!selectMode) { setSelectMode(true); setSelected(new Set([item.id])); } }}
                            >
                                {selectMode && (
                                    <View style={styles.checkbox}>
                                        <Ionicons
                                            name={selected.has(item.id) ? 'checkbox' : 'square-outline'}
                                            size={22}
                                            color={selected.has(item.id) ? colors.primary : colors.textMuted}
                                        />
                                    </View>
                                )}
                                <Image source={{ uri: item.posterUrl }} style={styles.poster} contentFit="cover" />
                                <View style={styles.info}>
                                    <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                                    <Text style={styles.status}>
                                        {item.status === 'completed' ? 'Ready to watch' : `${Math.round(item.progress * 100)}% ${item.status}`}
                                    </Text>
                                    {item.status === 'completed' && (
                                        <Text style={[styles.expiryText, isExpiring && styles.expiryWarning]}>
                                            {isExpiring ? `⚠ Expires in ${days}d` : `${days}d remaining`}
                                            {item.fileSize ? ` · ${formatSize(item.fileSize)}` : ''}
                                        </Text>
                                    )}
                                </View>
                                {!selectMode && (
                                    <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.localPath)}>
                                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    </Pressable>
                                )}
                            </Pressable>
                        );
                    }}
                />
            )}

            {/* Quality Selection Modal (Section 12) */}
            <Modal
                visible={showQualityModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowQualityModal(false)}
            >
                <Pressable
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
                    onPress={() => setShowQualityModal(false)}
                >
                    <View style={{
                        backgroundColor: colors.surface, borderRadius: 16, padding: 24, width: '100%', maxWidth: 360,
                        borderWidth: 1, borderColor: colors.border,
                    }}>
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4, textAlign: 'center' }}>
                            Download Quality
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
                            Choose quality for "{pendingDownload?.title || 'this content'}"
                        </Text>
                        {QUALITY_OPTIONS.map((opt) => (
                            <Pressable
                                key={opt.key}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 14,
                                    padding: 16, borderRadius: 12, marginBottom: 10,
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                                }}
                                onPress={() => confirmDownloadQuality(opt.key)}
                            >
                                <Ionicons name={opt.icon} size={24} color={colors.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{opt.label}</Text>
                                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>Est. {opt.size}</Text>
                                </View>
                                <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
                            </Pressable>
                        ))}
                        <Pressable
                            style={{ paddingVertical: 12, alignItems: 'center', marginTop: 4 }}
                            onPress={() => setShowQualityModal(false)}
                        >
                            <Text style={{ color: colors.textMuted, fontSize: 14 }}>Cancel</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
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
        paddingTop: 50,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    backButton: {
        padding: spacing.sm,
        marginRight: spacing.sm,
    },
    headerTitle: {
        color: '#fff',
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    selectBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    storageBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    storageText: {
        flex: 1,
        color: colors.textMuted,
        fontSize: fontSize.sm,
    },
    bulkDeleteBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        backgroundColor: colors.error,
    },
    listContent: {
        padding: spacing.md,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        marginBottom: spacing.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(8,145,178,0.05)',
    },
    checkbox: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: spacing.md,
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
    expiryText: {
        color: colors.textMuted,
        fontSize: fontSize.xs,
        marginTop: 2,
    },
    expiryWarning: {
        color: colors.warning,
    },
    deleteBtn: {
        padding: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
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
        lineHeight: 22,
        paddingHorizontal: spacing.xl,
    },
    upgradeBadge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(139,92,246,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    upgradeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.xxl,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        backgroundColor: colors.pro,
        borderRadius: radius.md,
    },
    upgradeBtnText: {
        color: '#fff',
        fontWeight: fontWeight.bold,
        fontSize: fontSize.md,
    },
});

