// frontend/src/pages/admin/analytics/users.jsx
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiUsers, FiTrendingUp, FiSearch, FiUser, FiClock, FiRefreshCw } from 'react-icons/fi';
import { GET_ADMIN_USERS } from '@/graphql/queries/adminQueries';

function timeAgo(dateStr) {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

export default function UserAnalyticsPage() {
    const [search, setSearch] = useState('');

    const { data, loading, refetch } = useQuery(GET_ADMIN_USERS, {
        variables: { limit: 100, search: search || undefined },
        fetchPolicy: 'cache-and-network',
    });

    const users = data?.adminUsers?.users || [];
    const totalCount = data?.adminUsers?.totalCount || 0;
    const activeUsers = users.filter(u => u.isActive && !u.isBanned);
    const bannedUsers = users.filter(u => u.isBanned);
    const recentUsers = users.filter(u => {
        if (!u.createdAt) return false;
        return Date.now() - new Date(u.createdAt).getTime() < 7 * 86400000;
    });

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white">User Analytics</h1>
                            <p className="text-sm text-gray-500 mt-0.5">User activity and growth overview</p>
                        </div>
                        <button onClick={() => refetch()} className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-white">{totalCount}</p>
                            <p className="text-xs text-gray-500 font-bold">Total Users</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-green-400">{activeUsers.length}</p>
                            <p className="text-xs text-gray-500 font-bold">Active</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-primary-400">{recentUsers.length}</p>
                            <p className="text-xs text-gray-500 font-bold">New This Week</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-black text-red-400">{bannedUsers.length}</p>
                            <p className="text-xs text-gray-500 font-bold">Banned</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users by name or email..." className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30" />
                    </div>

                    {/* User List */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-gray-500 text-sm mt-3">Loading users...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left px-5 py-3 text-xs text-gray-500 font-bold uppercase">User</th>
                                            <th className="text-left px-3 py-3 text-xs text-gray-500 font-bold uppercase">Status</th>
                                            <th className="text-right px-3 py-3 text-xs text-gray-500 font-bold uppercase">Watchlist</th>
                                            <th className="text-right px-3 py-3 text-xs text-gray-500 font-bold uppercase">Downloads</th>
                                            <th className="text-right px-3 py-3 text-xs text-gray-500 font-bold uppercase">Last Active</th>
                                            <th className="text-right px-5 py-3 text-xs text-gray-500 font-bold uppercase">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                            {(u.firstName || u.username || u.email || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-white text-sm font-bold">{u.firstName || u.username || 'User'} {u.lastName || ''}</p>
                                                            <p className="text-gray-500 text-xs">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${u.isBanned ? 'bg-red-500/20 text-red-400' : u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-500'}`}>
                                                        {u.isBanned ? 'Banned' : u.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-right text-sm text-gray-300">{u.watchlistCount || 0}</td>
                                                <td className="px-3 py-3 text-right text-sm text-gray-300">{u.downloadCount || 0}</td>
                                                <td className="px-3 py-3 text-right text-xs text-gray-500">{timeAgo(u.lastActive)}</td>
                                                <td className="px-5 py-3 text-right text-xs text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!loading && users.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <FiUsers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No users found</p>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
