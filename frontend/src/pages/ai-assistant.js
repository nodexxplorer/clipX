/**
 * AI Assistant Page — Gemini-powered movie recommendation chat
 * Premium conversational UI with glassmorphism, animated particles, and advanced formatting
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSend, FiTrash2, FiCpu, FiFilm, FiStar,
    FiTrendingUp, FiZap, FiChevronLeft, FiLoader,
    FiRefreshCw, FiCopy, FiCheck, FiMessageCircle,
    FiCompass, FiHeart, FiAward, FiBookmark
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/graphql').replace('/graphql', '');

// Suggestion categories
const SUGGESTION_CATEGORIES = [
    {
        title: 'Discover',
        icon: <FiCompass />,
        color: 'from-cyan-500 to-blue-500',
        items: [
            { text: "What's trending right now?", icon: <FiTrendingUp /> },
            { text: "Hidden gems I might have missed", icon: <FiZap /> },
        ]
    },
    {
        title: 'Recommendations',
        icon: <FiHeart />,
        color: 'from-pink-500 to-rose-500',
        items: [
            { text: "Movies like Interstellar", icon: <FiFilm /> },
            { text: "Best movies for a rainy day", icon: <FiStar /> },
        ]
    },
    {
        title: 'Top Picks',
        icon: <FiAward />,
        color: 'from-amber-500 to-orange-500',
        items: [
            { text: "Best sci-fi movies of all time", icon: <FiStar /> },
            { text: "Top rated thrillers from the 2020s", icon: <FiBookmark /> },
        ]
    },
];

function formatAIText(text) {
    if (!text) return '';
    let html = text;
    // Convert **bold** to <strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    // Convert *italic* to <em>
    html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // Convert movie titles in quotes — make them clickable-looking
    html = html.replace(/"(.*?)"/g, '<span class="text-primary-400 font-medium">"$1"</span>');
    // Convert numbered lists with styling
    html = html.replace(/^(\d+)\.\s+(.*?)$/gm, '<div class="flex gap-3 items-start my-1.5"><span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs font-bold flex items-center justify-center mt-0.5">$1</span><span>$2</span></div>');
    // Convert bullet points
    html = html.replace(/^[-•]\s+(.*?)$/gm, '<div class="flex gap-2 items-start my-1"><span class="text-primary-500 mt-1.5">•</span><span>$1</span></div>');
    // Convert line breaks
    html = html.replace(/\n\n/g, '<div class="h-3"></div>');
    html = html.replace(/\n/g, '<br/>');
    return html;
}

// Animated gradient orb background
function GradientOrbs() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
            <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
        </div>
    );
}

// Typing indicator
function TypingIndicator() {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1">
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    className="w-2 h-2 bg-primary-400 rounded-full"
                    animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
            ))}
        </div>
    );
}

export default function AIAssistantPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamText, setStreamText] = useState('');
    const [copiedIdx, setCopiedIdx] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamText]);

    // Focus input on load
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const copyMessage = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const sendMessage = useCallback(async (text) => {
        const userMsg = text || input.trim();
        if (!userMsg || isLoading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
        setIsLoading(true);
        setStreamText('');

        // Build history for context
        const history = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [m.content]
        }));

        try {
            const res = await fetch(`${API_URL}/api/ai/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'AI service unavailable');
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.text) {
                                fullText += data.text;
                                setStreamText(fullText);
                            }
                            if (data.done) {
                                setMessages(prev => [...prev, { role: 'model', content: fullText, timestamp: new Date() }]);
                                setStreamText('');
                            }
                            if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (e) {
                            if (e.message !== 'Unexpected end of JSON input') throw e;
                        }
                    }
                }
            }

            // Ensure message is added even if no 'done' signal
            if (fullText && streamText) {
                setMessages(prev => [...prev, { role: 'model', content: fullText, timestamp: new Date() }]);
                setStreamText('');
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'model',
                content: `Sorry, I couldn't process that request. ${err.message}`,
                isError: true,
                timestamp: new Date()
            }]);
            setStreamText('');
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, streamText]);

    const handleSubmit = (e) => {
        e?.preventDefault();
        sendMessage();
    };

    const clearChat = () => {
        setMessages([]);
        setStreamText('');
        inputRef.current?.focus();
    };

    const regenerate = () => {
        if (messages.length < 2) return;
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg) {
            // Remove the last AI response
            setMessages(prev => {
                const newMsgs = [...prev];
                while (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role !== 'user') {
                    newMsgs.pop();
                }
                return newMsgs;
            });
            setTimeout(() => sendMessage(lastUserMsg.content), 100);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const firstName = user?.name ? user.name.split(' ')[0] : '';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <>
            <Head>
                <title>AI Assistant — clipX</title>
                <meta name="description" content="Get AI-powered movie recommendations with clipX's intelligent assistant" />
            </Head>

            <div className="min-h-screen bg-gray-950 flex flex-col relative" style={{ paddingTop: '80px' }}>
                <GradientOrbs />

                {/* Header Bar */}
                <div className="sticky top-[80px] z-30 bg-gray-950/60 backdrop-blur-2xl border-b border-white/5">
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            >
                                <FiChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                        <FiCpu className="w-5 h-5 text-white" />
                                    </div>
                                    {/* Online pulse */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-950">
                                        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-sm font-bold text-white leading-tight">clipX AI</h1>
                                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                                        Online · Powered by Gemini
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {messages.length > 0 && (
                                <>
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={regenerate}
                                        disabled={isLoading}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors disabled:opacity-30"
                                        title="Regenerate last response"
                                    >
                                        <FiRefreshCw className="w-3.5 h-3.5" />
                                    </motion.button>
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={clearChat}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Clear conversation"
                                    >
                                        <FiTrash2 className="w-3.5 h-3.5" />
                                    </motion.button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto relative z-10" ref={messagesContainerRef}>
                    <div className="max-w-4xl mx-auto px-4 py-6">
                        {/* Empty State — Welcome Screen */}
                        <AnimatePresence>
                            {messages.length === 0 && !streamText && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="flex flex-col items-center justify-center py-8 sm:py-16 text-center"
                                >
                                    {/* AI Avatar */}
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 200 }}
                                        className="relative mb-8"
                                    >
                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 rotate-3">
                                            <FiCpu className="w-12 h-12 text-white" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center border-3 border-gray-950 shadow-lg">
                                            <FiMessageCircle className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    </motion.div>

                                    <motion.h2
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-3xl sm:text-4xl font-bold text-white mb-3"
                                    >
                                        {greeting}{firstName ? `, ${firstName}` : ''}! 👋
                                    </motion.h2>
                                    <motion.p
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-gray-400 text-base mb-10 max-w-lg leading-relaxed"
                                    >
                                        I'm your AI movie companion. I can recommend films, discuss plots, suggest hidden gems, or help you find your next binge session.
                                    </motion.p>

                                    {/* Suggestion Categories */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                                        {SUGGESTION_CATEGORIES.map((cat, ci) => (
                                            <motion.div
                                                key={ci}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ delay: 0.3 + ci * 0.1 }}
                                                className="space-y-2"
                                            >
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest px-1 mb-3">
                                                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${cat.color}`}>
                                                        {cat.icon}
                                                    </span>
                                                    {cat.title}
                                                </div>
                                                {cat.items.map((s, si) => (
                                                    <button
                                                        key={si}
                                                        onClick={() => sendMessage(s.text)}
                                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-primary-500/30 text-left text-sm text-gray-300 hover:text-white transition-all group"
                                                    >
                                                        <span className="text-gray-500 group-hover:text-primary-400 transition-colors flex-shrink-0">
                                                            {s.icon}
                                                        </span>
                                                        <span className="line-clamp-1">{s.text}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Chat Messages */}
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-5`}
                            >
                                <div className={`flex items-start gap-3 max-w-[88%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    {msg.role === 'user' ? (
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-md shadow-primary-500/20">
                                            {(user?.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/20">
                                            <FiCpu className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    {/* Bubble */}
                                    <div className="group relative">
                                        <div
                                            className={`px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl rounded-tr-md shadow-lg shadow-primary-600/20'
                                                : msg.isError
                                                    ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl rounded-tl-md'
                                                    : 'bg-white/[0.04] border border-white/[0.06] text-gray-300 rounded-2xl rounded-tl-md backdrop-blur-sm'
                                                }`}
                                            dangerouslySetInnerHTML={
                                                msg.role === 'model'
                                                    ? { __html: formatAIText(msg.content) }
                                                    : undefined
                                            }
                                        >
                                            {msg.role === 'user' ? msg.content : undefined}
                                        </div>

                                        {/* Message actions — only for AI messages */}
                                        {msg.role === 'model' && !msg.isError && (
                                            <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                <button
                                                    onClick={() => copyMessage(msg.content, idx)}
                                                    className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors px-1.5 py-0.5 rounded"
                                                >
                                                    {copiedIdx === idx ? <FiCheck className="w-3 h-3 text-green-400" /> : <FiCopy className="w-3 h-3" />}
                                                    {copiedIdx === idx ? 'Copied' : 'Copy'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Timestamp */}
                                        {msg.timestamp && (
                                            <div className={`text-[10px] text-gray-600 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'} px-1`}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Streaming response */}
                        <AnimatePresence>
                            {streamText && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-start mb-5"
                                >
                                    <div className="flex items-start gap-3 max-w-[88%] sm:max-w-[80%]">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/20">
                                            <FiCpu className="w-4 h-4 text-white animate-pulse" />
                                        </div>
                                        <div
                                            className="px-4 py-3 rounded-2xl rounded-tl-md bg-white/[0.04] border border-white/[0.06] text-gray-300 text-sm leading-relaxed backdrop-blur-sm"
                                            dangerouslySetInnerHTML={{ __html: formatAIText(streamText) }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Loading indicator */}
                        <AnimatePresence>
                            {isLoading && !streamText && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex justify-start mb-5"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/20">
                                            <FiCpu className="w-4 h-4 text-white animate-pulse" />
                                        </div>
                                        <div className="px-5 py-4 rounded-2xl rounded-tl-md bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
                                            <TypingIndicator />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Bar */}
                <div className="sticky bottom-0 z-30 bg-gradient-to-t from-gray-950 via-gray-950/95 to-gray-950/0 pt-6">
                    <div className="bg-gray-950/80 backdrop-blur-2xl border-t border-white/5">
                        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask me anything about movies..."
                                        disabled={isLoading}
                                        maxLength={1000}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmit(e);
                                            }
                                        }}
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-purple-500/10 transition-all disabled:opacity-50 pr-16"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 tabular-nums">
                                        {input.length > 0 && `${input.length}/1000`}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="w-14 h-14 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 disabled:from-gray-800 disabled:via-gray-800 disabled:to-gray-800 disabled:text-gray-600 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-purple-500/20 disabled:shadow-none hover:shadow-xl hover:shadow-purple-500/30 active:scale-95"
                                >
                                    {isLoading ? (
                                        <FiLoader className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <FiSend className="w-5 h-5 ml-0.5" />
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-2 px-1">
                                <p className="text-[10px] text-gray-600">
                                    Powered by Google Gemini · Responses may be inaccurate
                                </p>
                                {messages.length > 0 && (
                                    <p className="text-[10px] text-gray-600">
                                        {messages.filter(m => m.role === 'user').length} messages
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
