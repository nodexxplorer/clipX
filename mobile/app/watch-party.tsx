/**
 * Mobile Watch Party Screen
 * Join via deeplink or room code, synchronized playback with chat
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';

import { API_URL } from '@/constants/theme';

export default function WatchPartyScreen() {
    const { code } = useLocalSearchParams();
    const router = useRouter();

    const [ws, setWs] = useState<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [participantCount, setParticipantCount] = useState(0);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [roomCode, setRoomCode] = useState((typeof code === 'string' ? code : code?.[0]) || '');
    const [joined, setJoined] = useState(!!code);

    const flatListRef = useRef<FlatList<any>>(null);

    const joinRoom = useCallback(async (roomId: string | string[]) => {
        const token = await SecureStore.getItemAsync('clipx_token');
        if (!token || !roomId) return;

        const wsUrl = `${API_URL.replace('http', 'ws')}/ws/watch-party/${roomId}?token=${token}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => setConnected(true);
        socket.onclose = () => setConnected(false);

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'sync':
                        setIsPlaying(data.isPlaying);
                        setCurrentTime(data.currentTime || 0);
                        break;
                    case 'chat':
                        setMessages(prev => [...prev.slice(-100), data]);
                        break;
                    case 'user_joined':
                        setParticipantCount(data.participantCount);
                        setMessages(prev => [...prev, { type: 'system', content: `${data.userName} joined! 🎉` }]);
                        break;
                    case 'user_left':
                        setParticipantCount(data.participantCount);
                        setMessages(prev => [...prev, { type: 'system', content: `${data.userName} left` }]);
                        break;
                }
            } catch (e) {}
        };

        setWs(socket);
        setJoined(true);
    }, []);

    useEffect(() => {
        if (code) joinRoom(code);
        return () => ws?.close();
    }, [code]);

    const sendEvent = (type: string, payload: any = {}) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type, ...payload }));
        }
    };

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        sendEvent('chat', { content: messageInput.trim() });
        setMessageInput('');
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    // Join screen
    if (!joined) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                <LinearGradient colors={['#050607', '#0a1a15']} style={styles.joinScreen}>
                    <Ionicons name="people" size={64} color="#10b981" style={{ marginBottom: 16 }} />
                    <Text style={styles.joinTitle}>Join Watch Party</Text>
                    <Text style={styles.joinSubtitle}>Enter the room code to watch together</Text>

                    <TextInput
                        style={styles.codeInput}
                        value={roomCode}
                        onChangeText={setRoomCode}
                        placeholder="Enter room code"
                        placeholderTextColor="#4b5563"
                        autoCapitalize="characters"
                        maxLength={8}
                    />

                    <TouchableOpacity
                        style={[styles.joinButton, !roomCode && styles.joinButtonDisabled]}
                        onPress={() => joinRoom(roomCode)}
                        disabled={!roomCode}
                    >
                        <LinearGradient
                            colors={['#10b981', '#06b6d4']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.joinButtonGradient}
                        >
                            <Text style={styles.joinButtonText}>Join Party</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color="#9ca3af" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Watch Party</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: connected ? '#10b981' : '#ef4444' }]} />
                        <Text style={styles.statusText}>{connected ? 'Connected' : 'Reconnecting...'}</Text>
                    </View>
                </View>
                <View style={styles.participantBadge}>
                    <Ionicons name="people" size={14} color="#10b981" />
                    <Text style={styles.participantText}>{participantCount}</Text>
                </View>
            </View>

            {/* Video area */}
            <View style={styles.videoArea}>
                <View style={styles.playButtonOuter}>
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => sendEvent(isPlaying ? 'pause' : 'play', { currentTime })}
                    >
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={36} color="#10b981" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.playStateText}>{isPlaying ? 'Playing' : 'Paused'}</Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                <TouchableOpacity
                    onPress={() => sendEvent('seek', { currentTime: Math.max(0, currentTime - 10) })}
                    style={styles.controlButton}
                >
                    <Ionicons name="play-back" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => sendEvent(isPlaying ? 'pause' : 'play', { currentTime })}
                    style={styles.mainPlayButton}
                >
                    <LinearGradient
                        colors={['#10b981', '#06b6d4']}
                        style={styles.mainPlayGradient}
                    >
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => sendEvent('seek', { currentTime: currentTime + 10 })}
                    style={styles.controlButton}
                >
                    <Ionicons name="play-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>

            {/* Chat */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.chatContainer}
            >
                <Text style={styles.chatTitle}>Party Chat</Text>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(_, i) => String(i)}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    style={styles.chatList}
                    renderItem={({ item }) => (
                        item.type === 'system' ? (
                            <Text style={styles.systemMessage}>{item.content}</Text>
                        ) : (
                            <View style={styles.chatMessage}>
                                <View style={styles.chatAvatar}>
                                    <Text style={styles.chatAvatarText}>{(item.userName || '?')[0].toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.chatUserName}>{item.userName}</Text>
                                    <Text style={styles.chatContent}>{item.content}</Text>
                                </View>
                            </View>
                        )
                    )}
                />

                <View style={styles.chatInputRow}>
                    <TextInput
                        style={styles.chatInput}
                        value={messageInput}
                        onChangeText={setMessageInput}
                        placeholder="Send a message..."
                        placeholderTextColor="#4b5563"
                        onSubmitEditing={handleSendMessage}
                        returnKeyType="send"
                    />
                    <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
                        <Ionicons name="send" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050607' },

    // Join screen
    joinScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    joinTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
    joinSubtitle: { color: '#6b7280', fontSize: 15, marginBottom: 32 },
    codeInput: {
        width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 16, fontSize: 24, color: '#fff', textAlign: 'center', letterSpacing: 6, fontWeight: '700',
    },
    joinButton: { width: '100%', marginTop: 20, borderRadius: 16, overflow: 'hidden' },
    joinButtonDisabled: { opacity: 0.4 },
    joinButtonGradient: { padding: 16, alignItems: 'center' },
    joinButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    backButton: { padding: 8, marginRight: 8 },
    headerTitle: { color: '#10b981', fontSize: 18, fontWeight: '700' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { color: '#6b7280', fontSize: 12 },
    participantBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    participantText: { color: '#10b981', fontSize: 13, fontWeight: '600' },

    // Video
    videoArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#000' },
    playButtonOuter: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    playButton: { paddingLeft: 4 },
    timeText: { color: '#9ca3af', fontSize: 14, marginTop: 4 },
    playStateText: { color: '#4b5563', fontSize: 12, marginTop: 2 },

    // Controls
    controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    controlButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    mainPlayButton: { borderRadius: 24, overflow: 'hidden' },
    mainPlayGradient: { width: 64, height: 64, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },

    // Chat
    chatContainer: { flex: 1 },
    chatTitle: { color: '#9ca3af', fontSize: 14, fontWeight: '600', padding: 12, paddingBottom: 8 },
    chatList: { flex: 1, paddingHorizontal: 12 },
    systemMessage: { color: '#4b5563', fontSize: 12, textAlign: 'center', paddingVertical: 4 },
    chatMessage: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    chatAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
    chatAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    chatUserName: { color: '#10b981', fontSize: 12, fontWeight: '600' },
    chatContent: { color: '#d1d5db', fontSize: 14 },
    chatInputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    chatInput: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14,
    },
    sendButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
});
