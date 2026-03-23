// frontend/src/pages/admin/security/index.jsx
import { useState, useEffect } from 'react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {
    FiShield, FiActivity, FiAlertTriangle, FiCheck, FiX,
    FiLock, FiGlobe, FiMonitor, FiClock, FiRefreshCw,
    FiServer, FiDatabase, FiHardDrive, FiWifi, FiUser, FiCpu
} from 'react-icons/fi';

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

export default function SecurityPage() {
    const [activeTab, setActiveTab] = useState('health');
    const [loading, setLoading] = useState(true);

    // Mock data
    const [data, setData] = useState({
        health: [
            { label: 'API Server', status: 'healthy', value: 'Uptime: 99.97%', icon: FiServer },
            { label: 'Database', status: 'healthy', value: 'Response: 12ms avg', icon: FiDatabase },
            { label: 'CDN', status: 'warning', value: '1 node slow', icon: FiGlobe },
            { label: 'Memory', status: 'healthy', value: '62% used', icon: FiHardDrive },
            { label: 'CPU', status: 'healthy', value: '34% usage', icon: FiCpu },
            { label: 'WebSocket', status: 'healthy', value: '142 connections', icon: FiWifi },
        ],
        sessions: [
            { id: 1, user: 'admin@clipx.com', device: 'Chrome / Windows', ip: '192.168.1.1', location: 'Lagos, NG', lastActive: '2m ago', active: true },
            { id: 2, user: 'john@email.com', device: 'Safari / macOS', ip: '10.0.0.45', location: 'Abuja, NG', lastActive: '5m ago', active: true },
            { id: 3, user: 'sara@email.com', device: 'Mobile / Android', ip: '172.16.0.12', location: 'London, UK', lastActive: '12m ago', active: true },
            { id: 4, user: 'mike@email.com', device: 'Firefox / Linux', ip: '192.168.2.20', location: 'Accra, GH', lastActive: '1h ago', active: false },
        ],
        loginAttempts: [
            { id: 1, email: 'admin@clipx.com', ip: '192.168.1.1', status: 'success', time: '2 mins ago', device: 'Chrome / Windows' },
            { id: 2, email: 'unknown@hacker.com', ip: '45.33.122.89', status: 'failed', time: '15 mins ago', device: 'Curl / Unknown' },
            { id: 3, email: 'john@email.com', ip: '10.0.0.45', status: 'success', time: '22 mins ago', device: 'Safari / macOS' },
            { id: 4, email: 'admin@clipx.com', ip: '198.51.100.77', status: 'failed', time: '1 hour ago', device: 'Bot / Headless' },
            { id: 5, email: 'sara@email.com', ip: '172.16.0.12', status: 'success', time: '2 hours ago', device: 'Mobile / Android' },
        ],
        auditLog: [
            { id: 1, admin: 'admin@clipx.com', action: 'Updated user role to admin', target: 'john@email.com', time: '10 mins ago' },
            { id: 2, admin: 'admin@clipx.com', action: 'Deleted review #142', target: 'Review on "Inception"', time: '1 hour ago' },
            { id: 3, admin: 'admin@clipx.com', action: 'Sent broadcast notification', target: 'All users', time: '3 hours ago' },
            { id: 4, admin: 'admin@clipx.com', action: 'Banned user', target: 'spammer@bad.com', time: '1 day ago' },
        ],
    });

    useEffect(() => {
        setTimeout(() => setLoading(false), 600);
    }, []);

    const tabs = [
        { id: 'health', label: 'System Health', icon: FiActivity },
        { id: 'sessions', label: 'Active Sessions', icon: FiMonitor },
        { id: 'logins', label: 'Login Attempts', icon: FiLock },
        { id: 'audit', label: 'Audit Log', icon: FiShield },
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
                                        {data.health.map((h, i) => (
                                            <HealthCard key={i} {...h} />
                                        ))}
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                        <h3 className="text-white font-bold mb-3">API Rate Limit Status</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="text-center p-4 bg-white/[0.02] rounded-xl">
                                                <p className="text-2xl font-black text-green-400">30</p>
                                                <p className="text-xs text-gray-500 mt-1">Requests / minute / IP</p>
                                            </div>
                                            <div className="text-center p-4 bg-white/[0.02] rounded-xl">
                                                <p className="text-2xl font-black text-white">12</p>
                                                <p className="text-xs text-gray-500 mt-1">Rate-limited IPs today</p>
                                            </div>
                                            <div className="text-center p-4 bg-white/[0.02] rounded-xl">
                                                <p className="text-2xl font-black text-primary-400">0</p>
                                                <p className="text-xs text-gray-500 mt-1">Blocked IPs</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sessions' && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                        <h3 className="text-white font-bold">Active Sessions ({data.sessions.filter(s => s.active).length})</h3>
                                        <button className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 font-bold">Force Logout All</button>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        {data.sessions.map((s) => (
                                            <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.active ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                                                        <FiUser className={`w-5 h-5 ${s.active ? 'text-green-400' : 'text-gray-500'}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-bold">{s.user}</p>
                                                        <p className="text-gray-500 text-xs">{s.device} • {s.ip} • {s.location}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500">{s.lastActive}</span>
                                                    <button className="text-xs text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg hover:bg-red-500/20 font-bold">Logout</button>
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
                                        {data.loginAttempts.map((l) => (
                                            <div key={l.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${l.status === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                                        {l.status === 'success' ? <FiCheck className="w-4 h-4 text-green-400" /> : <FiX className="w-4 h-4 text-red-400" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{l.email}</p>
                                                        <p className="text-gray-500 text-xs">{l.device} • {l.ip}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-xs font-bold ${l.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>{l.status}</p>
                                                    <p className="text-xs text-gray-600">{l.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'audit' && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="p-5 border-b border-white/5">
                                        <h3 className="text-white font-bold">Audit Log</h3>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        {data.auditLog.map((a) => (
                                            <div key={a.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <FiShield className="w-4 h-4 text-primary-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{a.action}</p>
                                                        <p className="text-gray-500 text-xs mt-0.5">
                                                            by <span className="text-gray-400">{a.admin}</span> → <span className="text-gray-400">{a.target}</span>
                                                        </p>
                                                        <p className="text-gray-600 text-xs mt-1 flex items-center gap-1"><FiClock className="w-3 h-3" /> {a.time}</p>
                                                    </div>
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
