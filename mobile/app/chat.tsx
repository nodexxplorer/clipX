import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, FlatList, Pressable, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

const AI_RESPONSES: Record<string, string> = {
    default: "I can help you discover movies, get recommendations, and answer questions about clipX. What would you like to know?",
    recommend: "Based on popular choices, here are some recommendations:\n\n🎬 **Inception** — A mind-bending thriller\n🎬 **The Dark Knight** — An iconic superhero film\n🎬 **Parasite** — A genre-defying masterpiece\n\nWould you like more personalized suggestions?",
    help: "Here's what I can help with:\n\n• 🔍 Search for movies and TV shows\n• 🎯 Get personalized recommendations\n• 📊 View your watch stats\n• 💳 Subscription questions\n• 🛠️ Technical support\n\nJust ask me anything!",
};

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
};

function getAIResponse(userMessage: string): string {
    const lower = userMessage.toLowerCase();
    if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('watch'))
        return AI_RESPONSES.recommend;
    if (lower.includes('help') || lower.includes('support') || lower.includes('how'))
        return AI_RESPONSES.help;
    return `Great question! I'll look into "${userMessage}" for you. In the meanwhile, our catalog has thousands of movies and shows you can explore. Try searching in the Search tab!`;
}

export default function ChatScreen() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', text: AI_RESPONSES.default, sender: 'ai', timestamp: new Date() },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const handleSend = () => {
        if (!input.trim()) return;
        const userMsg: Message = {
            id: Date.now().toString(),
            text: input.trim(),
            sender: 'user',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: getAIResponse(userMsg.text),
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1200);
    };

    if (!isAuthenticated) {
        return (
            <View style={styles.center}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
                <Text style={styles.centerTitle}>AI Assistant</Text>
                <Text style={styles.centerSub}>Sign in to chat with our AI assistant</Text>
                <Pressable style={styles.authBtn} onPress={() => router.push('/auth/login')}>
                    <Text style={styles.authBtnText}>Sign In</Text>
                </Pressable>
            </View>
        );
    }

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[styles.msgRow, item.sender === 'user' && styles.msgRowUser]}>
            {item.sender === 'ai' && (
                <View style={styles.aiBubbleIcon}>
                    <Ionicons name="sparkles" size={14} color={colors.primary} />
                </View>
            )}
            <View style={[styles.msgBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.msgText, item.sender === 'user' && styles.userMsgText]}>{item.text}</Text>
            </View>
        </View>
    );

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Ionicons name="sparkles" size={18} color={colors.primary} />
                    <Text style={styles.headerTitle}>AI Assistant</Text>
                </View>
                <View style={{ width: 38 }} />
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {isTyping && (
                <View style={styles.typingRow}>
                    <View style={styles.aiBubbleIcon}>
                        <Ionicons name="sparkles" size={14} color={colors.primary} />
                    </View>
                    <View style={styles.typingBubble}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.typingText}>Thinking...</Text>
                    </View>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                <View style={styles.inputRow}>
                    <TextInput
                        value={input}
                        onChangeText={setInput}
                        placeholder="Ask me anything..."
                        placeholderTextColor={colors.textMuted}
                        style={styles.textInput}
                        multiline
                        maxLength={500}
                        onSubmitEditing={handleSend}
                    />
                    <Pressable
                        onPress={handleSend}
                        disabled={!input.trim()}
                        style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                    >
                        <Ionicons name="send" size={18} color={input.trim() ? '#fff' : colors.textMuted} />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl },
    centerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: spacing.lg },
    centerSub: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm, textAlign: 'center' },
    authBtn: { marginTop: spacing.xl, paddingHorizontal: 40, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md },
    authBtnText: { color: '#fff', fontWeight: fontWeight.bold },

    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    backBtn: { padding: spacing.sm },
    headerCenter: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    headerTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.black },

    messageList: { padding: spacing.lg, paddingBottom: 20 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.md, gap: 8 },
    msgRowUser: { justifyContent: 'flex-end' },
    aiBubbleIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center' },

    msgBubble: { maxWidth: '78%', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 18 },
    userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    aiBubble: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
    msgText: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 22 },
    userMsgText: { color: '#fff' },

    typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 18 },
    typingText: { color: colors.textMuted, fontSize: fontSize.sm },

    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 0.5, borderTopColor: colors.border, backgroundColor: colors.background },
    textInput: { flex: 1, backgroundColor: colors.card, color: colors.text, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 24, fontSize: fontSize.md, maxHeight: 100, borderWidth: 1, borderColor: colors.border },
    sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    sendBtnDisabled: { backgroundColor: colors.card },
});
