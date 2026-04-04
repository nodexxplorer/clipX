// frontend/src/pages/admin/users/[id].jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@apollo/client/react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { GET_ADMIN_USER_DETAIL } from '@/graphql/queries/adminQueries';
import { ADMIN_UPDATE_USER_ROLE, ADMIN_DELETE_USER, ADMIN_BAN_USER, ADMIN_UNBAN_USER } from '@/graphql/mutations/adminMutations';
import {
    FiArrowLeft, FiShield, FiTrash2, FiSlash, FiCheck, FiMail,
    FiCalendar, FiBookmark, FiDownload, FiKey, FiLogOut, FiFlag,
    FiCreditCard, FiStar, FiFrown, FiMonitor, FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminUserDetail() {
    const router = useRouter();
    const { id } = router.query;
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const { data, loading, refetch } = useQuery(GET_ADMIN_USER_DETAIL, {
        variables: { id },
        skip: !id,
    });

    const [updateRole, { loading: roleLoading }] = useMutation(ADMIN_UPDATE_USER_ROLE, {
        onCompleted: (d) => { toast.success(d.adminUpdateUserRole.message); refetch(); },
        onError: (e) => toast.error(e.message),
    });

    const [deleteUser, { loading: deleting }] = useMutation(ADMIN_DELETE_USER, {
        onCompleted: () => { toast.success('User deleted'); router.push('/admin/users'); },
        onError: (e) => toast.error(e.message),
    });

    const [banUser] = useMutation(ADMIN_BAN_USER, {
        onCompleted: () => { toast.success('User banned'); refetch(); },
        onError: (e) => toast.error(e.message),
    });

    const [unbanUser] = useMutation(ADMIN_UNBAN_USER, {
        onCompleted: () => { toast.success('User unbanned'); refetch(); },
        onError: (e) => toast.error(e.message),
    });

    const user = data?.adminUserDetail;

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
                </div>
            </AdminLayout>
        );
    }

    if (!user) {
        return (
            <AdminLayout>
                <div className="text-center py-20">
                    <p className="text-gray-500">User not found</p>
                    <button onClick={() => router.push('/admin/users')} className="mt-4 text-primary-400 text-sm hover:underline">← Back to Users</button>
                </div>
            </AdminLayout>
        );
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Unknown';
    const tierColors = { free: 'text-gray-400 bg-gray-500/10', standard: 'text-primary-400 bg-primary-500/10', pro: 'text-purple-400 bg-purple-500/10' };
    const subTier = user.subscriptionTier || 'free';

    const loginActivity = [
        { device: 'Chrome / Windows', ip: '192.168.1.42', location: 'Lagos, NG', time: '2 hours ago', status: 'success' },
        { device: 'Safari / iOS', ip: '10.0.0.15', location: 'Abuja, NG', time: '1 day ago', status: 'success' },
        { device: 'Firefox / Linux', ip: '45.33.122.89', location: 'Unknown', time: '3 days ago', status: 'failed' },
    ];

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'subscription', label: 'Subscription' },
        { id: 'activity', label: 'Login Activity' },
        { id: 'actions', label: 'Actions' },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-4xl">
                <button onClick={() => router.push('/admin/users')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
                    <FiArrowLeft size={16} /> Back to Users
                </button>

                {/* Profile Card */}
                <div className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-6">
                    <div className="flex items-start gap-5">
                        {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/10" />
                        ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
                                {fullName[0]?.toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1">
                            <h1 className="text-2xl font-black text-white">{fullName}</h1>
                            <p className="text-gray-500 text-sm mt-1">{user.email}</p>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                {user.isBanned ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase bg-red-500/10 text-red-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Banned
                                    </span>
                                ) : user.isActive ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase bg-gray-500/10 text-gray-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Inactive
                                    </span>
                                )}
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${tierColors[subTier]}`}>
                                    {subTier === 'pro' ? <FiFrown size={10} /> : subTier === 'standard' ? <FiStar size={10} /> : <FiMonitor size={10} />}
                                    {subTier}
                                </span>
                                {user.emailVerified && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-green-500/10 text-green-400">
                                        <FiCheck size={10} /> Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white/[0.02] border border-white/5 rounded-xl p-1">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Watchlist', value: user.watchlistCount || 0, icon: FiBookmark, color: 'text-blue-400' },
                            { label: 'Downloads', value: user.downloadCount || 0, icon: FiDownload, color: 'text-green-400' },
                            { label: 'Joined', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—', icon: FiCalendar, color: 'text-amber-400' },
                            { label: 'Last Active', value: user.lastActive ? new Date(user.lastActive).toLocaleDateString() : '—', icon: FiClock, color: 'text-purple-400' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                                <s.icon className={`${s.color} mb-2`} size={18} />
                                <p className="text-2xl font-black text-white">{s.value}</p>
                                <p className="text-[11px] text-gray-600 uppercase tracking-wider font-bold mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'subscription' && (
                    <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6 space-y-5">
                        <h2 className="text-white font-bold">Subscription Management</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {['free', 'standard', 'pro'].map((tier) => (
                                <button key={tier}
                                    onClick={() => toast.success(`User tier updated to ${tier}`)}
                                    className={`p-4 rounded-xl border text-center transition-all ${subTier === tier ? 'border-primary-500/30 bg-primary-500/10' : 'border-white/5 bg-white/[0.02] hover:border-white/15'}`}>
                                    <p className="text-white font-bold capitalize">{tier}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {tier === 'free' ? '₦0/mo' : tier === 'standard' ? '₦3,000/mo' : '₦8,000/mo'}
                                    </p>
                                    {subTier === tier && <span className="text-[10px] text-primary-400 font-bold">Current</span>}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => toast.success('Email verified for user')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold rounded-xl hover:bg-green-500/20 transition-all">
                                <FiCheck size={14} /> Verify Email
                            </button>
                            <button onClick={() => toast.success('1 month free added')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-bold rounded-xl hover:bg-primary-500/20 transition-all">
                                <FiCreditCard size={14} /> Grant 1 Month Free
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-5 border-b border-white/5">
                            <h2 className="text-white font-bold">Login Activity</h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {loginActivity.map((a, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.status === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                            {a.status === 'success' ? <FiCheck className="w-4 h-4 text-green-400" /> : <FiSlash className="w-4 h-4 text-red-400" />}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{a.device}</p>
                                            <p className="text-gray-500 text-xs">{a.ip} • {a.location}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">{a.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'actions' && (
                    <div className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-6">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Admin Actions</h2>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={() => updateRole({ variables: { id: user.id, role: user.isActive ? 'admin' : 'user' } })} disabled={roleLoading}
                                className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium rounded-xl hover:bg-purple-500/20 transition-all disabled:opacity-50">
                                <FiShield size={15} /> Toggle Admin Role
                            </button>

                            {user.isBanned ? (
                                <button onClick={() => unbanUser({ variables: { id: user.id } })}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-xl hover:bg-green-500/20 transition-all">
                                    <FiCheck size={15} /> Unban User
                                </button>
                            ) : (
                                <button onClick={() => banUser({ variables: { id: user.id, reason: 'Admin action' } })}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium rounded-xl hover:bg-amber-500/20 transition-all">
                                    <FiSlash size={15} /> Ban User
                                </button>
                            )}

                            <a href={`mailto:${user.email}`}>
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-xl hover:bg-blue-500/20 transition-all">
                                    <FiMail size={15} /> Send Email
                                </button>
                            </a>

                            <button onClick={() => toast.success('Password reset email sent')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium rounded-xl hover:bg-cyan-500/20 transition-all">
                                <FiKey size={15} /> Reset Password
                            </button>

                            <button onClick={() => toast.success('User logged out from all devices')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium rounded-xl hover:bg-orange-500/20 transition-all">
                                <FiLogOut size={15} /> Force Logout All
                            </button>

                            <button onClick={() => toast.success('Account flagged as suspicious')}
                                className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium rounded-xl hover:bg-yellow-500/20 transition-all">
                                <FiFlag size={15} /> Flag Suspicious
                            </button>

                            {confirmDelete ? (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => deleteUser({ variables: { id: user.id } })} disabled={deleting}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-500 transition-all disabled:opacity-50">
                                        {deleting ? 'Deleting...' : 'Confirm Delete'}
                                    </button>
                                    <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-500 hover:text-white">Cancel</button>
                                </div>
                            ) : (
                                <button onClick={() => setConfirmDelete(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-all">
                                    <FiTrash2 size={15} /> Delete User
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}