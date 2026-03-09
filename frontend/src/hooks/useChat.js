// frontend/src/hooks/useChat.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_CHAT_MESSAGES } from '@/graphql/queries/chatQueries';
import { useAuth } from '@/contexts/AuthContext';

/**
 * useChat — manages WebSocket connection for real-time chat + history loading.
 * 
 * @param {string} room  - Chat room identifier (default: 'global')
 * @returns {{ messages, sendMessage, isConnected, onlineCount, typingUsers, loadMore }}
 */
export function useChat(room = 'global') {
    const { user } = useAuth();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState([]);
    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);
    const typingTimers = useRef({});

    // Load history via GraphQL
    const { data: historyData, loading: historyLoading, fetchMore } = useQuery(GET_CHAT_MESSAGES, {
        variables: { room, limit: 50 },
        fetchPolicy: 'cache-and-network',
    });

    // Seed messages from history on load
    useEffect(() => {
        if (historyData?.chatMessages) {
            setMessages(prev => {
                // Merge: keep history + any WS messages not in history
                const historyIds = new Set(historyData.chatMessages.map(m => m.id));
                const wsOnly = prev.filter(m => !historyIds.has(m.id) && m.id.startsWith('ws-') === false);
                return [...historyData.chatMessages, ...wsOnly];
            });
        }
    }, [historyData]);

    // WebSocket connection
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const wsBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
            .replace(/^http/, 'ws')
            .replace(/\/graphql$/, '');

        const params = new URLSearchParams({ room });
        if (token) params.set('token', token);
        if (user?.name) params.set('name', user.name);
        if (user?.avatar) params.set('avatar', user.avatar);

        const ws = new WebSocket(`${wsBase}/ws/chat?${params.toString()}`);

        ws.onopen = () => {
            setIsConnected(true);
            console.log(`[Chat] Connected to room: ${room}`);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'message':
                        setMessages(prev => {
                            // Deduplicate
                            if (prev.some(m => m.id === data.id)) return prev;
                            return [...prev, data];
                        });
                        break;

                    case 'system':
                        setMessages(prev => [...prev, {
                            id: `sys-${Date.now()}-${Math.random()}`,
                            type: 'system',
                            content: data.content,
                            createdAt: data.createdAt,
                        }]);
                        break;

                    case 'online_count':
                        setOnlineCount(data.count);
                        break;

                    case 'typing':
                        setTypingUsers(prev => {
                            const existing = prev.filter(u => u.userId !== data.userId);
                            // Clear typing after 3 seconds
                            if (typingTimers.current[data.userId]) {
                                clearTimeout(typingTimers.current[data.userId]);
                            }
                            typingTimers.current[data.userId] = setTimeout(() => {
                                setTypingUsers(p => p.filter(u => u.userId !== data.userId));
                            }, 3000);
                            return [...existing, { userId: data.userId, userName: data.userName }];
                        });
                        break;
                }
            } catch (e) {
                console.error('[Chat] Parse error:', e);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            // Auto-reconnect after 3s
            reconnectTimer.current = setTimeout(() => connect(), 3000);
        };

        ws.onerror = (err) => {
            console.error('[Chat] WebSocket error:', err);
            ws.close();
        };

        wsRef.current = ws;
    }, [room, token, user?.name, user?.avatar]);

    // Connect on mount
    useEffect(() => {
        connect();

        return () => {
            clearTimeout(reconnectTimer.current);
            wsRef.current?.close();
        };
    }, [connect]);

    // Send a message
    const sendMessage = useCallback((content) => {
        if (!content?.trim()) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'message',
                content: content.trim(),
                room,
            }));
        }
    }, [room]);

    // Send typing indicator
    const sendTyping = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'typing', room }));
        }
    }, [room]);

    return {
        messages,
        sendMessage,
        sendTyping,
        isConnected,
        onlineCount,
        typingUsers,
        historyLoading,
        user,
    };
}
