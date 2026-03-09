// frontend/src/components/chat/ChatWidget.jsx
/**
 * Floating chat widget — appears on all pages when user is logged in.
 * Opens a slide-up panel with real-time messaging.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiUsers, FiSmile, FiChevronDown } from 'react-icons/fi';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';

// Relative time helper
function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
}

export default function ChatWidget({ room = 'global' }) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
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
    } = useChat(room);

    // Auto-scroll to bottom when new messages arrive (if user is already at bottom)
    useEffect(() => {
        if (!user) return;
        if (wasAtBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else if (isOpen) {
            setUnreadCount(prev => prev + 1);
        }
    }, [messages.length, user]);

    // Track scroll position
    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        wasAtBottomRef.current = atBottom;
        setShowScrollBtn(!atBottom);
        if (atBottom) setUnreadCount(0);
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setUnreadCount(0);
    }, []);

    // Reset unread when opening
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                inputRef.current?.focus();
            }, 200);
        }
    }, [isOpen]);

    // Track unread when closed
    useEffect(() => {
        if (!isOpen && messages.length > 0 && user) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.userId !== user?.id && lastMsg.type !== 'system') {
                setUnreadCount(prev => prev + 1);
            }
        }
    }, [messages.length, isOpen, user]);

    const handleSend = useCallback((e) => {
        e?.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
        wasAtBottomRef.current = true;
    }, [input, sendMessage]);

    const handleInputChange = useCallback((e) => {
        setInput(e.target.value);
        if (!typingTimeout.current) {
            sendTyping();
            typingTimeout.current = setTimeout(() => {
                typingTimeout.current = null;
            }, 2000);
        }
    }, [sendTyping]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    // If not logged in, don't show — MUST be after all hooks
    if (!user) return null;

    return (
        <>
            {/* Floating Bubble */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-shadow"
                    >
                        <FiMessageCircle className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-gray-900">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        {/* Pulse ring when connected */}
                        {isConnected && (
                            <span className="absolute inset-0 rounded-full bg-primary-500/30 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-6 right-6 z-[91] w-[380px] h-[520px] max-h-[80vh] bg-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-primary-600/20 to-purple-600/20 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <FiMessageCircle className="w-5 h-5 text-primary-400" />
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-gray-900 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">
                                        {room === 'global' ? 'Global Chat' : `Chat — ${room}`}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                        <FiUsers className="w-3 h-3" />
                                        <span>{onlineCount} online</span>
                                        <span className="mx-1">·</span>
                                        <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                                            {isConnected ? 'Connected' : 'Reconnecting…'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin"
                        >
                            {historyLoading && messages.length === 0 && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {messages.map((msg, idx) => {
                                if (msg.type === 'system') {
                                    return (
                                        <div key={msg.id} className="flex justify-center py-1.5">
                                            <span className="text-[10px] text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                                                {msg.content}
                                            </span>
                                        </div>
                                    );
                                }

                                const isMe = msg.userId === user?.id;
                                const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.userId !== msg.userId || messages[idx - 1]?.type === 'system');

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}
                                    >
                                        {/* Avatar */}
                                        {!isMe && (
                                            <div className="w-6 h-6 flex-shrink-0">
                                                {showAvatar ? (
                                                    msg.userAvatar ? (
                                                        <img src={msg.userAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white">
                                                            {(msg.userName || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    )
                                                ) : <div className="w-6" />}
                                            </div>
                                        )}

                                        {/* Bubble */}
                                        <div className={`max-w-[75%] ${isMe ? 'ml-8' : 'mr-8'}`}>
                                            {showAvatar && !isMe && (
                                                <p className="text-[10px] font-semibold text-gray-400 mb-0.5 ml-1">{msg.userName}</p>
                                            )}
                                            <div
                                                className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${isMe
                                                    ? 'bg-primary-600 text-white rounded-br-md'
                                                    : 'bg-white/8 text-gray-200 rounded-bl-md'
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                            <p className={`text-[9px] text-gray-600 mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                                                {timeAgo(msg.createdAt)}
                                            </p>
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
                                    className="px-4 py-1 flex-shrink-0"
                                >
                                    <p className="text-[10px] text-gray-500 italic">
                                        {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Scroll-to-bottom button */}
                        <AnimatePresence>
                            {showScrollBtn && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={scrollToBottom}
                                    className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 w-8 h-8 bg-gray-800 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shadow-lg"
                                >
                                    <FiChevronDown className="w-4 h-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Input */}
                        <form
                            onSubmit={handleSend}
                            className="px-3 py-3 border-t border-white/10 flex items-center gap-2 flex-shrink-0 bg-gray-900/80"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={isConnected ? 'Type a message…' : 'Connecting…'}
                                disabled={!isConnected}
                                maxLength={2000}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/50 focus:bg-white/8 transition-colors disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || !isConnected}
                                className="w-10 h-10 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                            >
                                <FiSend className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
