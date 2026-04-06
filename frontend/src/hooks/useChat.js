// frontend/src/hooks/useChat.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_CHAT_MESSAGES } from '@/graphql/queries/chatQueries';
import { useAuth } from '@/contexts/AuthContext';

/**
 * useChat — manages WebSocket connection for real-time chat + history loading.
 * Fixed: prevents excessive reconnection loops and auth token issues.
 */
export function useChat(room = 'global') {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState([]);
    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);
    const reconnectAttempts = useRef(0);
    const typingTimers = useRef({});
    const mountedRef = useRef(true);

    // Load history via GraphQL — skip if no user to prevent auth errors
    const { data: historyData, loading: historyLoading } = useQuery(GET_CHAT_MESSAGES, {
        variables: { room, limit: 50 },
        fetchPolicy: 'cache-and-network',
        skip: !user, // Don't query if not logged in — prevents auth errors triggering logouts
        errorPolicy: 'ignore', // Don't propagate errors to prevent UI crashes
    });

    // Seed messages from history on load
    useEffect(() => {
        if (historyData?.chatMessages) {
            setMessages(prev => {
                const historyIds = new Set(historyData.chatMessages.map(m => m.id));
                const wsOnly = prev.filter(m => !historyIds.has(m.id) && !m.id?.startsWith?.('ws-'));
                return [...historyData.chatMessages, ...wsOnly];
            });
        }
    }, [historyData]);

    // Fetch a short-lived (60 s) WS ticket from the server.
    // Browsers do not send httpOnly cookies on WebSocket upgrades, so we
    // call this REST endpoint (which receives the cookie normally) and get
    // a signed ticket to pass as ?ticket= on the WS URL.
    const getWsTicket = useCallback(async () => {
        if (typeof window === 'undefined') return null;
        try {
            const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
                .replace(/\/graphql$/, '');
            const res = await fetch(`${apiBase}/api/auth/ws-ticket`, {
                method: 'POST',
                credentials: 'include', // sends the httpOnly auth_token cookie
            });
            if (!res.ok) return null;
            const json = await res.json();
            return json.ticket ?? null;
        } catch {
            return null;
        }
    }, []);

    // WebSocket connection — stabilized to prevent reconnection storms
    const connect = useCallback(async () => {
        if (!mountedRef.current) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

        const ticket = await getWsTicket();
        if (!ticket) return; // not authenticated

        const wsBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
            .replace(/^http/, 'ws')
            .replace(/\/graphql$/, '');

        const params = new URLSearchParams({ room });
        params.set('ticket', ticket);
        if (user?.name) params.set('name', user.name);
        if (user?.avatar) params.set('avatar', user.avatar);

        try {
            const ws = new WebSocket(`${wsBase}/ws/chat?${params.toString()}`);

            ws.onopen = () => {
                if (!mountedRef.current) { ws.close(); return; }
                setIsConnected(true);
                reconnectAttempts.current = 0;
                console.log(`[Chat] Connected to room: ${room}`);
            };

            ws.onmessage = (event) => {
                if (!mountedRef.current) return;
                try {
                    const data = JSON.parse(event.data);
                    switch (data.type) {
                        case 'message':
                            setMessages(prev => {
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

            ws.onclose = (ev) => {
                if (!mountedRef.current) return;
                setIsConnected(false);
                // Stop reconnecting after 10 attempts — prevents flooding a dead server
                if (reconnectAttempts.current >= 10) {
                    console.log('[Chat] Max reconnect attempts reached. Stopped retrying.');
                    return;
                }
                // Exponential backoff: 2s, 4s, 8s, 16s... max 60s
                const delay = Math.min(2000 * Math.pow(2, reconnectAttempts.current), 60000);
                reconnectAttempts.current += 1;
                clearTimeout(reconnectTimer.current);
                reconnectTimer.current = setTimeout(() => {
                    if (mountedRef.current && getToken()) connect();
                }, delay);
            };

            ws.onerror = () => {
                // Don't log raw WS errors — onclose handles reconnection
            };

            wsRef.current = ws;
        } catch (e) {
            console.error('[Chat] Connection failed:', e);
        }
        // Only re-create when room changes, NOT when user object changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room]);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        mountedRef.current = true;
        // Delay initial connection to avoid competing with auth initialization
        const initTimer = setTimeout(() => {
            if (user && getToken()) connect();
        }, 500);

        return () => {
            mountedRef.current = false;
            clearTimeout(initTimer);
            clearTimeout(reconnectTimer.current);
            if (wsRef.current) {
                wsRef.current.onclose = null; // Prevent reconnect on intentional close
                wsRef.current.close();
            }
        };
    }, [connect, user?.id]); // Only reconnect when user ID truly changes

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