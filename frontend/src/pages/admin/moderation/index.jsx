// frontend/src/pages/admin/moderation/index.jsx
import { useState } from 'react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {
    FiMessageSquare, FiTrash2, FiAlertTriangle, FiUser,
    FiClock, FiVolume, FiVolumeX, FiSearch, FiFlag, FiCheck, FiX
} from 'react-icons/fi';

export default function ModerationPage() {
    const [activeTab, setActiveTab] = useState('messages');

    // Mock data
    const [messages] = useState([
        { id: 1, user: 'John Doe', avatar: '', content: 'This movie is amazing! Anyone else watching?', room: 'global', time: '2 mins ago', reported: false },
        { id: 2, user: 'BadUser99', avatar: '', content: '*** inappropriate content flagged ***', room: 'global', time: '15 mins ago', reported: true },
        { id: 3, user: 'Sarah K.', avatar: '', content: 'The ending was so unexpected! No spoilers though 😂', room: 'movie:inception', time: '22 mins ago', reported: false },
        { id: 4, user: 'SpamBot', avatar: '', content: 'Buy cheap stuff at spamlink.com!!! Best deals!!!', room: 'global', time: '45 mins ago', reported: true },
        { id: 5, user: 'Alice W.', avatar: '', content: 'Can someone recommend good anime?', room: 'global', time: '1 hour ago', reported: false },
    ]);

    const [reportedMessages] = useState([
        { id: 2, user: 'BadUser99', content: '*** inappropriate content ***', room: 'global', reportedBy: 'John Doe', reason: 'Harassment', time: '15 mins ago' },
        { id: 4, user: 'SpamBot', content: 'Buy cheap stuff at spamlink.com!!!', room: 'global', reportedBy: 'Sarah K.', reason: 'Spam', time: '45 mins ago' },
    ]);

    const [bannedUsers] = useState([
        { id: 1, user: 'OldSpammer', email: 'spammer@bad.com', reason: 'Repeated spam', bannedAt: '2026-03-15' },
        { id: 2, user: 'ToxicUser', email: 'toxic@email.com', reason: 'Harassment', bannedAt: '2026-03-10' },
    ]);

    const tabs = [
        { id: 'messages', label: 'Live Chat', count: messages.length },
        { id: 'reported', label: 'Reported', count: reportedMessages.length },
        { id: 'banned', label: 'Banned Users', count: bannedUsers.length },
    ];

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">Chat Moderation</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Monitor chat messages, handle reports, manage bans</p>
                    </div>

                    <div className="flex gap-1 bg-white/[0.02] border border-white/5 rounded-xl p-1.5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all flex-1 justify-center ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab.label}
                                {tab.count > 0 && <span className="text-[10px] bg-white/10 px-1.5 rounded-full">{tab.count}</span>}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'messages' && (
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex items-center gap-3">
                                <div className="relative flex-1">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                    <input placeholder="Search messages..." className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none" />
                                </div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex items-start gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors ${msg.reported ? 'bg-red-500/[0.02]' : ''}`}>
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            {msg.user.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white text-sm font-bold">{msg.user}</span>
                                                <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">{msg.room}</span>
                                                {msg.reported && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full font-bold">⚠ Reported</span>}
                                                <span className="text-xs text-gray-600 ml-auto flex-shrink-0">{msg.time}</span>
                                            </div>
                                            <p className="text-gray-300 text-sm mt-1 break-words">{msg.content}</p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button className="p-1.5 text-gray-600 hover:text-red-400 transition-colors" title="Delete">
                                                <FiTrash2 size={14} />
                                            </button>
                                            <button className="p-1.5 text-gray-600 hover:text-yellow-400 transition-colors" title="Mute user">
                                                <FiVolumeX size={14} />
                                            </button>
                                            <button className="p-1.5 text-gray-600 hover:text-red-400 transition-colors" title="Ban user">
                                                <FiAlertTriangle size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'reported' && (
                        <div className="space-y-4">
                            {reportedMessages.map((msg) => (
                                <div key={msg.id} className="bg-red-500/[0.03] border border-red-500/10 rounded-2xl p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-white font-bold text-sm">{msg.user}</span>
                                                <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">{msg.room}</span>
                                            </div>
                                            <p className="text-gray-300 text-sm p-3 bg-white/[0.03] rounded-xl border border-white/5">{msg.content}</p>
                                            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                                                <span>Reported by <span className="text-gray-400">{msg.reportedBy}</span></span>
                                                <span>•</span>
                                                <span className="text-red-400 font-bold">{msg.reason}</span>
                                                <span>•</span>
                                                <span>{msg.time}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 rounded-xl text-xs font-bold hover:bg-green-500/20 transition-colors">
                                                <FiCheck size={12} /> Dismiss
                                            </button>
                                            <button className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-colors">
                                                <FiTrash2 size={12} /> Delete & Ban
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {reportedMessages.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <FiCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No reported messages 🎉</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'banned' && (
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                            <div className="divide-y divide-white/5">
                                {bannedUsers.map((u) => (
                                    <div key={u.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                                <FiUser className="w-5 h-5 text-red-400" />
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-bold">{u.user}</p>
                                                <p className="text-gray-500 text-xs">{u.email} • {u.reason}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-600">Banned {u.bannedAt}</span>
                                            <button className="text-xs text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-lg hover:bg-primary-500/20 font-bold">Unban</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
