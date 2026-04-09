// frontend/src/pages/admin/moderation/index.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {
    FiMessageSquare, FiTrash2, FiAlertTriangle, FiUser,
    FiSearch, FiCheck, FiX
} from 'react-icons/fi';
import { GET_ADMIN_USERS } from '@/graphql/queries/adminQueries';

export default function ModerationPage() {
    const [activeTab, setActiveTab] = useState('banned');

    const { data: bannedData, loading } = useQuery(GET_ADMIN_USERS, {
        variables: { limit: 50, status: 'banned' },
        fetchPolicy: 'cache-and-network',
    });

    const { data: allData } = useQuery(GET_ADMIN_USERS, {
        variables: { limit: 50, status: 'all' },
        fetchPolicy: 'cache-and-network',
    });

    const bannedUsers = (bannedData?.adminUsers?.users || []).filter(u => u.isBanned);
    const allUsers = allData?.adminUsers?.users || [];

    const tabs = [
        { id: 'banned', label: 'Banned Users', count: bannedUsers.length },
        { id: 'active', label: 'Active Users', count: allUsers.filter(u => u.isActive && !u.isBanned).length },
    ];

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">User Moderation</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage user bans and activity</p>
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

                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white/[0.02] rounded-2xl p-5 animate-pulse h-20 border border-white/5" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {activeTab === 'banned' && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="divide-y divide-white/5">
                                        {bannedUsers.length === 0 && (
                                            <div className="text-center py-12 text-gray-500">
                                                <FiCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No banned users 🎉</p>
                                            </div>
                                        )}
                                        {bannedUsers.map((u) => (
                                            <div key={u.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                                        <FiUser className="w-5 h-5 text-red-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-bold">{u.firstName || u.username || 'User'} {u.lastName || ''}</p>
                                                        <p className="text-gray-500 text-xs">{u.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-600">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}</span>
                                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">Banned</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'active' && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="divide-y divide-white/5">
                                        {allUsers.filter(u => u.isActive && !u.isBanned).map((u) => (
                                            <div key={u.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                        <FiUser className="w-5 h-5 text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-bold">{u.firstName || u.username || 'User'} {u.lastName || ''}</p>
                                                        <p className="text-gray-500 text-xs">{u.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-600">{u.lastActive || ''}</span>
                                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">Active</span>
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
