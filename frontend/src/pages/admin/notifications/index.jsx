// frontend/src/pages/admin/notifications/index.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { GET_ADMIN_NOTIFICATIONS, GET_ADMIN_USERS } from '@/graphql/queries/adminQueries';
import { ADMIN_SEND_NOTIFICATION } from '@/graphql/mutations/adminMutations';
import { FiSend, FiBell, FiUsers, FiUser, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString();
}

export default function AdminNotifications() {
    const [mode, setMode] = useState('broadcast'); // 'broadcast' or 'personal'
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [notifType, setNotifType] = useState('system');

    const { data: notifsData, loading: notifsLoading, refetch } = useQuery(GET_ADMIN_NOTIFICATIONS, {
        variables: { limit: 50 },
    });

    const { data: usersData } = useQuery(GET_ADMIN_USERS, {
        variables: { limit: 100, offset: 0 },
    });

    const [sendNotification, { loading: sending }] = useMutation(ADMIN_SEND_NOTIFICATION, {
        onCompleted: (d) => {
            toast.success(d.adminSendNotification.message);
            setTitle('');
            setMessage('');
            setSelectedUserId('');
            refetch();
        },
        onError: (e) => toast.error(e.message),
    });

    const handleSend = (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast.error('Title and message are required');
            return;
        }
        if (mode === 'personal' && !selectedUserId) {
            toast.error('Select a user');
            return;
        }
        sendNotification({
            variables: {
                title: title.trim(),
                message: message.trim(),
                userId: mode === 'personal' ? selectedUserId : null,
                notifType,
            },
        });
    };

    const users = usersData?.adminUsers?.users || [];
    const notifications = notifsData?.adminNotifications || [];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Send notifications to users</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Send Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-5">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <FiSend size={14} className="text-primary-400" /> Send Notification
                            </h2>

                            {/* Mode Toggle */}
                            <div className="flex gap-2 mb-5">
                                <button
                                    onClick={() => setMode('broadcast')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'broadcast' ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20' : 'bg-white/5 text-gray-500 border border-transparent hover:text-gray-300'}`}
                                >
                                    <FiUsers size={14} /> Broadcast
                                </button>
                                <button
                                    onClick={() => setMode('personal')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'personal' ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20' : 'bg-white/5 text-gray-500 border border-transparent hover:text-gray-300'}`}
                                >
                                    <FiUser size={14} /> Personal
                                </button>
                            </div>

                            <form onSubmit={handleSend} className="space-y-4">
                                {mode === 'personal' && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Select User</label>
                                        <select
                                            value={selectedUserId}
                                            onChange={(e) => setSelectedUserId(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30"
                                        >
                                            <option value="">Choose a user...</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.email}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Type</label>
                                    <select
                                        value={notifType}
                                        onChange={(e) => setNotifType(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30"
                                    >
                                        <option value="system">System</option>
                                        <option value="content">Content Update</option>
                                        <option value="milestone">Milestone</option>
                                        <option value="social">Social</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Title</label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Notification title..."
                                        className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30 placeholder-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Message</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={3}
                                        placeholder="Notification message..."
                                        className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30 placeholder-gray-600 resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50"
                                >
                                    <FiSend size={15} />
                                    {sending ? 'Sending...' : mode === 'broadcast' ? 'Send to All Users' : 'Send to User'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Recent Notifications */}
                    <div className="lg:col-span-3">
                        <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
                            <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Notifications</h2>
                                <button onClick={() => refetch()} className="text-gray-600 hover:text-white transition-colors">
                                    <FiRefreshCw size={14} className={notifsLoading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                            <div className="divide-y divide-white/[0.03] max-h-[600px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <FiBell className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                                        <p className="text-sm text-gray-600">No notifications sent yet</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div key={n.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${n.type === 'system' ? 'bg-gray-500/10 text-gray-400' :
                                                            n.type === 'content' ? 'bg-blue-500/10 text-blue-400' :
                                                                n.type === 'milestone' ? 'bg-amber-500/10 text-amber-400' :
                                                                    'bg-purple-500/10 text-purple-400'
                                                        }`}>{n.type}</span>
                                                    <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
