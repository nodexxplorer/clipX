// frontend/src/pages/admin/security/index.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {
    FiShield, FiActivity, FiAlertTriangle, FiCheck, FiX,
    FiLock, FiGlobe, FiMonitor, FiClock, FiRefreshCw,
    FiServer, FiDatabase, FiHardDrive, FiWifi, FiUser, FiCpu
} from 'react-icons/fi';
import { GET_ADMIN_LOGIN_ACTIVITY, GET_ADMIN_ACTIVE_SESSIONS, ADMIN_REVOKE_SESSION } from '@/graphql/queries/adminQueries';

function HealthCard({ label, status, value, icon: Icon }) {
    const colors = {
        healthy: 'text-green-400 bg-green-500/10 border-green-500/20',
        warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        critical: 'text-red-400 bg-red-500/10 border-red-500/20',
    };
    return (
        <div className={`p-4 rounded-xl border ${colors[status]}`}>
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <div className="flex-1">
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-xs text-gray-500">{value}</p>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'healthy' ? 'bg-green-400' : status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`} />
            </div>
        </div>
    );
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

export default function SecurityPage() {
    const [activeTab, setActiveTab] = useState('health');

    const { data: loginData, loading: loginLoading } = useQuery(GET_ADMIN_LOGIN_ACTIVITY, { variables: { limit: 50 }, fetchPolicy: 'cache-and-network' });
    const { data: sessionData, loading: sessionLoading, refetch: refetchSessions } = useQuery(GET_ADMIN_ACTIVE_SESSIONS, { fetchPolicy: 'cache-and-network' });
    const [revokeSession] = useMutation(ADMIN_REVOKE_SESSION);

    const loginAttempts = loginData?.adminLoginActivity || [];
    const sessions = sessionData?.adminActiveSessions || [];
    const loading = loginLoading || sessionLoading;

    const healthItems = [
        { label: 'API Server', status: 'healthy', value: 'Running', icon: FiServer },
        { label: 'Database', status: 'healthy', value: 'Connected', icon: FiDatabase },
        { label: 'CDN', status: 'healthy', value: 'Active', icon: FiGlobe },
        { label: 'Memory', status: 'healthy', value: 'Normal', icon: FiHardDrive },
        { label: 'CPU', status: 'healthy', value: 'Normal', icon: FiCpu },
        { label: 'WebSocket', status: sessions.length > 0 ? 'healthy' : 'warning', value: `${sessions.length} sessions`, icon: FiWifi },
    ];

    const handleRevoke = async (id) => {
        if (!confirm('Revoke this session?')) return;
        await revokeSession({ variables: { sessionId: id } });
        refetchSessions();
    };

    const tabs = [
        { id: 'health', label: 'System Health', icon: FiActivity },
        { id: 'sessions', label: 'Active Sessions', icon: FiMonitor },
        { id: 'logins', label: 'Login Attempts', icon: FiLock },
    ];

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">Security & System</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Monitor system health, sessions, and security events</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-white/[0.02] border border-white/5 rounded-xl p-1.5 overflow-x-auto">
                        {tabs.map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white/[0.02] rounded-xl p-4 animate-pulse h-20 border border-white/5" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {activeTab === 'health' && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {healthItems.map((h, i) => (
                                            <HealthCard key={i} {...h} />
                                        ))}
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                        <h3 className="text-white font-bold mb-3">Session Overview</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="text-center p-4 bg-white/[0.02] rounded-xl">
                                                <p className="text-2xl font-black text-green-400">{sessions.length}</p>
                                                <p className="text-xs text-gray-500 mt-1">Active Sessions</p>
                                            </div>
                                            <div className="text-center p-4 bg-white/[0.02] rounded-xl">
                                                <p className="text-2xl font-black text-white">{loginAttempts.filter(l => !l.success).length}</p>
                                                <p className="text-xs text-gray-500 mt-1">Failed Logins (recent)</p>
                                            </div>
                                            <div className="text-center p-4 bg-white/[0.02] rounded-xl">
                                                <p className="text-2xl font-black text-primary-400">{loginAttempts.filter(l => l.success).length}</p>
                                                <p className="text-xs text-gray-500 mt-1">Successful Logins</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sessions' && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                        <h3 className="text-white font-bold">Active Sessions ({sessions.length})</h3>
                                        <button onClick={() => refetchSessions()} className="text-xs text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-lg hover:bg-primary-500/20 font-bold flex items-center gap-1">
                                            <FiRefreshCw size={12} /> Refresh
                                        </button>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        {sessions.length === 0 && (
                                            <div className="text-center py-12 text-gray-500"><p className="text-sm">No active sessions found</p></div>
                                        )}
                                        {sessions.map((s) => (
                                            <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-500/10">
                                                        <FiUser className="w-5 h-5 text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-bold">{s.user}</p>
                                                        <p className="text-gray-500 text-xs">{s.device} • {s.ip}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500">{timeAgo(s.lastActive)}</span>
                                                    <button onClick={() => handleRevoke(s.id)} className="text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg hover:bg-red-500/20 font-bold">Revoke</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'logins' && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="p-5 border-b border-white/5">
                                        <h3 className="text-white font-bold">Login Attempts</h3>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        {loginAttempts.length === 0 && (
                                            <div className="text-center py-12 text-gray-500"><p className="text-sm">No login activity recorded</p></div>
                                        )}
                                        {loginAttempts.map((l) => (
                                            <div key={l.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${l.success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                                        {l.success ? <FiCheck className="w-4 h-4 text-green-400" /> : <FiX className="w-4 h-4 text-red-400" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{l.location || 'Unknown'}</p>
                                                        <p className="text-gray-500 text-xs">{l.deviceInfo || 'Unknown device'} • {l.ipAddress || ''}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-xs font-bold ${l.success ? 'text-green-400' : 'text-red-400'}`}>{l.success ? 'success' : 'failed'}</p>
                                                    <p className="text-xs text-gray-600">{timeAgo(l.createdAt)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
