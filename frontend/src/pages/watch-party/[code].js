/**
 * Watch Party Page — /watch-party/[code]
 * Synchronised playback with WebSocket-driven state
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiPause, FiSkipForward, FiUsers, FiSend, FiCopy, FiCheck, FiArrowLeft, FiX } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

export default function WatchPartyPage() {
    const router = useRouter();
    const { code } = router.query;
    const { user, token } = useAuth();

    const [ws, setWs] = useState(null);
    const [connected, setConnected] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [participants, setParticipants] = useState([]);
    const [participantCount, setParticipantCount] = useState(0);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [syncEvents, setSyncEvents] = useState([]);

    const chatEndRef = useRef(null);

    // Connect to WebSocket
    useEffect(() => {
        if (!code || !token) return;

        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/watch-party/${code}?token=${token}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            setConnected(true);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'sync':
                        setIsPlaying(data.isPlaying);
                        setCurrentTime(data.currentTime || 0);
                        if (data.triggeredBy) {
                            setSyncEvents(prev => [...prev.slice(-4), {
                                text: `${data.triggeredBy} ${data.event === 'play' ? '▶ played' : data.event === 'pause' ? '⏸ paused' : '⏩ seeked'}`,
                                time: new Date().toLocaleTimeString(),
                            }]);
                        }
                        break;

                    case 'chat':
                        setMessages(prev => [...prev.slice(-100), data]);
                        break;

                    case 'user_joined':
                        setParticipantCount(data.participantCount);
                        setMessages(prev => [...prev.slice(-100), {
                            type: 'system',
                            content: `${data.userName} joined the party! 🎉`,
                            createdAt: data.createdAt,
                        }]);
                        break;

                    case 'user_left':
                        setParticipantCount(data.participantCount);
                        setMessages(prev => [...prev.slice(-100), {
                            type: 'system',
                            content: `${data.userName} left the party`,
                            createdAt: data.createdAt,
                        }]);
                        break;
                }
            } catch (e) {
                console.error('WS parse error:', e);
            }
        };

        socket.onclose = () => {
            setConnected(false);
        };

        setWs(socket);
        return () => socket.close();
    }, [code, token]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendEvent = useCallback((type, payload = {}) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type, ...payload }));
        }
    }, [ws]);

    const handlePlay = () => sendEvent('play', { currentTime });
    const handlePause = () => sendEvent('pause', { currentTime });
    const handleSeek = (time) => sendEvent('seek', { currentTime: time });

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        sendEvent('chat', { content: messageInput.trim() });
        setMessageInput('');
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(code || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!code) return null;

    return (
        <>
            <Head>
                <title>Watch Party — clipX</title>
                <meta name="description" content="Watch together in sync with friends on clipX" />
            </Head>

            <div className="min-h-screen bg-[#050607] text-white">
                {/* Header */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-[#050607]/80 backdrop-blur-xl border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                                <FiArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                    Watch Party
                                </h1>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                    {connected ? 'Connected' : 'Disconnected'}
                                </div>
                            </div>
                        </div>

                        {/* Room Code Badge */}
                        <button
                            onClick={copyRoomCode}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                        >
                            <span className="text-xs text-gray-400">Room</span>
                            <span className="font-mono font-bold text-emerald-400 tracking-widest">{code}</span>
                            {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy className="text-gray-500 group-hover:text-white" />}
                        </button>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <FiUsers className="text-emerald-400" />
                            <span>{participantCount} watching</span>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="pt-16 flex h-[calc(100vh-4rem)]">
                    {/* Video area */}
                    <div className="flex-1 flex flex-col">
                        {/* Video player placeholder */}
                        <div className="flex-1 bg-black flex items-center justify-center relative">
                            <div className="text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                                    {isPlaying ? (
                                        <FiPause size={32} className="text-emerald-400" />
                                    ) : (
                                        <FiPlay size={32} className="text-emerald-400 ml-1" />
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm">Video player synced at {formatTime(currentTime)}</p>
                                <p className="text-gray-600 text-xs mt-1">{isPlaying ? 'Playing' : 'Paused'}</p>
                            </div>

                            {/* Sync event toasts */}
                            <div className="absolute top-4 right-4 space-y-2">
                                <AnimatePresence>
                                    {syncEvents.slice(-3).map((evt, i) => (
                                        <motion.div
                                            key={`${evt.time}-${i}`}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg backdrop-blur"
                                        >
                                            {evt.text}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Playback controls */}
                        <div className="bg-[#0a0b0d] border-t border-white/5 p-4">
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                                    aria-label="Rewind 10 seconds"
                                >
                                    <FiSkipForward size={18} className="rotate-180" />
                                </button>
                                <button
                                    onClick={isPlaying ? handlePause : handlePlay}
                                    className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500 transition-all shadow-lg shadow-emerald-600/20"
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                >
                                    {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} className="ml-0.5" />}
                                </button>
                                <button
                                    onClick={() => handleSeek(currentTime + 10)}
                                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                                    aria-label="Forward 10 seconds"
                                >
                                    <FiSkipForward size={18} />
                                </button>
                            </div>
                            
                            {/* Seek bar */}
                            <div className="mt-3 flex items-center gap-3">
                                <span className="text-xs text-gray-500 font-mono w-10 text-right">{formatTime(currentTime)}</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="7200"
                                    value={currentTime}
                                    onChange={(e) => handleSeek(Number(e.target.value))}
                                    className="flex-1 h-1 rounded-full appearance-none bg-white/10 accent-emerald-500"
                                    aria-label="Video seek bar"
                                />
                                <span className="text-xs text-gray-500 font-mono w-10">2:00:00</span>
                            </div>
                        </div>
                    </div>

                    {/* Chat sidebar */}
                    <div className="w-80 border-l border-white/5 bg-[#0a0b0d] flex flex-col">
                        <div className="p-4 border-b border-white/5">
                            <h2 className="text-sm font-semibold text-gray-300">Party Chat</h2>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
                            {messages.map((msg, i) => (
                                <div key={i}>
                                    {msg.type === 'system' ? (
                                        <p className="text-xs text-gray-600 text-center py-1">{msg.content}</p>
                                    ) : (
                                        <div className="flex gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {(msg.userName || '?')[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-emerald-400 font-medium">{msg.userName}</p>
                                                <p className="text-sm text-gray-300 break-words">{msg.content}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Send a message..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50"
                                    id="watch-party-chat-input"
                                />
                                <button
                                    type="submit"
                                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                    aria-label="Send message"
                                >
                                    <FiSend size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
