// frontend/src/pages/chat.js
import { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSend, FiUsers, FiMessageCircle, FiHash, FiChevronDown,
    FiSmile, FiImage, FiMoreVertical
} from 'react-icons/fi';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

// Relative time
function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
}

const ROOMS = [
    { id: 'global', name: 'Global Chat', icon: FiMessageCircle, desc: 'Chat with everyone' },
    { id: 'movies', name: 'Movies', icon: FiHash, desc: 'Movie discussions' },
    { id: 'series', name: 'TV Series', icon: FiHash, desc: 'Series talk' },
    { id: 'requests', name: 'Requests', icon: FiHash, desc: 'Request content' },
];

export default function ChatPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [activeRoom, setActiveRoom] = useState('global');
    const [input, setInput] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeout = useRef(null);
    const wasAtBottomRef = useRef(true);

    const {
        messages,
        sendMessage,
        sendTyping,
        isConnected,
        onlineCount,
        typingUsers,
        historyLoading,
    } = useChat(activeRoom);

    // Redirect if not logged in
    useEffect(() => {
        if (user === null) {
            router.push('/login');
        }
    }, [user, router]);

    // Auto-scroll
    useEffect(() => {
        if (wasAtBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length]);

    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    }, []);

    const handleSend = (e) => {
        e?.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
        wasAtBottomRef.current = true;
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        if (!typingTimeout.current) {
            sendTyping();
            typingTimeout.current = setTimeout(() => { typingTimeout.current = null; }, 2000);
        }
    };

    if (!user) return null;

    return (
        <>
            <Head>
                <title>Chat — clipX</title>
            </Head>

            <div className="min-h-screen pt-20 pb-0 flex">
                {/* Sidebar */}
                <aside className={`w-64 bg-gray-900/60 border-r border-white/5 flex-shrink-0 flex flex-col transition-all ${showSidebar ? '' : 'hidden md:flex'}`}>
                    <div className="p-4 border-b border-white/5">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <FiMessageCircle className="w-5 h-5 text-primary-500" />
                            Chat Rooms
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">{onlineCount} users online</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                        {ROOMS.map(room => (
                            <button
                                key={room.id}
                                onClick={() => setActiveRoom(room.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${activeRoom === room.id
                                        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                    }`}
                            >
                                <room.icon className="w-4 h-4 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">{room.name}</p>
                                    <p className="text-[10px] text-gray-500 truncate">{room.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Current user */}
                    <div className="p-3 border-t border-white/5 flex items-center gap-3">
                        {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                {(user.name || 'U').charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user.name || user.email}</p>
                            <div className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-[10px] text-gray-500">{isConnected ? 'Online' : 'Connecting…'}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Room Header */}
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0 bg-gray-900/40 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                                <FiHash className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">
                                    {ROOMS.find(r => r.id === activeRoom)?.name || activeRoom}
                                </h1>
                                <p className="text-xs text-gray-500">
                                    {onlineCount} online · {messages.filter(m => m.type !== 'system').length} messages
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <FiUsers className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto px-6 py-4 space-y-1"
                    >
                        {/* Welcome message */}
                        <div className="flex justify-center py-6 mb-4">
                            <div className="text-center max-w-xs">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
                                    <FiMessageCircle className="w-8 h-8 text-primary-400" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-1">
                                    Welcome to #{ROOMS.find(r => r.id === activeRoom)?.name || activeRoom}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    This is the beginning of your conversation. Say hi! 👋
                                </p>
                            </div>
                        </div>

                        {historyLoading && messages.length === 0 && (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}

                        {messages.map((msg, idx) => {
                            if (msg.type === 'system') {
                                return (
                                    <div key={msg.id} className="flex justify-center py-2">
                                        <span className="text-[11px] text-gray-500 bg-white/5 px-4 py-1 rounded-full">
                                            {msg.content}
                                        </span>
                                    </div>
                                );
                            }

                            const isMe = msg.userId === user?.id;
                            const showHeader = idx === 0 || messages[idx - 1]?.userId !== msg.userId || messages[idx - 1]?.type === 'system';
                            const showTime = idx === messages.length - 1 || messages[idx + 1]?.userId !== msg.userId || messages[idx + 1]?.type === 'system';

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''} ${showHeader ? 'mt-4' : 'mt-0.5'}`}
                                >
                                    {/* Avatar */}
                                    {!isMe && (
                                        <div className="w-9 h-9 flex-shrink-0 mt-0.5">
                                            {showHeader ? (
                                                msg.userAvatar ? (
                                                    <img src={msg.userAvatar} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white/5" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/5">
                                                        {(msg.userName || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                )
                                            ) : (
                                                <div className="w-9" />
                                            )}
                                        </div>
                                    )}

                                    {/* Message */}
                                    <div className={`max-w-[65%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                        {showHeader && (
                                            <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <span className={`text-xs font-bold ${isMe ? 'text-primary-400' : 'text-gray-300'}`}>
                                                    {isMe ? 'You' : msg.userName}
                                                </span>
                                                <span className="text-[10px] text-gray-600">{timeAgo(msg.createdAt)}</span>
                                            </div>
                                        )}
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${isMe
                                                    ? 'bg-primary-600 text-white rounded-br-md'
                                                    : 'bg-white/[0.06] text-gray-200 rounded-bl-md border border-white/5'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Typing indicator */}
                    <AnimatePresence>
                        {typingUsers.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-6 py-1.5 flex-shrink-0 border-t border-white/5"
                            >
                                <p className="text-xs text-gray-500 italic flex items-center gap-2">
                                    <span className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </span>
                                    {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Input */}
                    <form
                        onSubmit={handleSend}
                        className="px-6 py-4 border-t border-white/5 flex items-center gap-3 flex-shrink-0 bg-gray-900/40"
                    >
                        <div className="flex-1 flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-1 focus-within:border-primary-500/30 transition-colors">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={isConnected ? `Message #${ROOMS.find(r => r.id === activeRoom)?.name || activeRoom}` : 'Connecting…'}
                                disabled={!isConnected}
                                maxLength={2000}
                                className="flex-1 bg-transparent py-2 text-sm text-white placeholder-gray-500 outline-none disabled:opacity-50"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || !isConnected}
                            className="w-12 h-12 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-2xl flex items-center justify-center transition-all flex-shrink-0 shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 disabled:shadow-none"
                        >
                            <FiSend className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
