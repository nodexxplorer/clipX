// frontend/src/pages/admin/users/[id].jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@apollo/client/react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { GET_ADMIN_USER_DETAIL } from '@/graphql/queries/adminQueries';
import { ADMIN_UPDATE_USER_ROLE, ADMIN_DELETE_USER, ADMIN_BAN_USER, ADMIN_UNBAN_USER } from '@/graphql/mutations/adminMutations';
import { FiArrowLeft, FiShield, FiTrash2, FiSlash, FiCheck, FiMail, FiCalendar, FiBookmark, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminUserDetail() {
    const router = useRouter();
    const { id } = router.query;
    const [confirmDelete, setConfirmDelete] = useState(false);

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

    const isAdmin = user.username && user.email; // just check existence
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Unknown';

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-4xl">
                {/* Back */}
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
                            <div className="flex items-center gap-3 mt-3">
                                {user.isBanned ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Banned
                                    </span>
                                ) : user.isActive ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Inactive
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Watchlist', value: user.watchlistCount || 0, icon: FiBookmark, color: 'text-blue-400' },
                        { label: 'Downloads', value: user.downloadCount || 0, icon: FiDownload, color: 'text-green-400' },
                        { label: 'Joined', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—', icon: FiCalendar, color: 'text-amber-400' },
                        { label: 'Email', value: user.email?.split('@')[1] || '—', icon: FiMail, color: 'text-purple-400' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                            <s.icon className={`${s.color} mb-2`} size={18} />
                            <p className="text-2xl font-black text-white">{s.value}</p>
                            <p className="text-[11px] text-gray-600 uppercase tracking-wider font-bold mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-6">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Actions</h2>
                    <div className="flex flex-wrap gap-3">
                        {/* Make Admin / Remove Admin */}
                        <button
                            onClick={() => updateRole({ variables: { id: user.id, role: user.isActive ? 'admin' : 'user' } })}
                            disabled={roleLoading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium rounded-xl hover:bg-purple-500/20 transition-all disabled:opacity-50"
                        >
                            <FiShield size={15} /> {roleLoading ? 'Updating...' : 'Toggle Admin Role'}
                        </button>

                        {/* Ban / Unban */}
                        {user.isBanned ? (
                            <button
                                onClick={() => unbanUser({ variables: { id: user.id } })}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-xl hover:bg-green-500/20 transition-all"
                            >
                                <FiCheck size={15} /> Unban User
                            </button>
                        ) : (
                            <button
                                onClick={() => banUser({ variables: { id: user.id, reason: 'Admin action' } })}
                                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium rounded-xl hover:bg-amber-500/20 transition-all"
                            >
                                <FiSlash size={15} /> Ban User
                            </button>
                        )}

                        {/* Email */}
                        <a href={`mailto:${user.email}`}>
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-xl hover:bg-blue-500/20 transition-all">
                                <FiMail size={15} /> Send Email
                            </button>
                        </a>

                        {/* Delete */}
                        {confirmDelete ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => deleteUser({ variables: { id: user.id } })}
                                    disabled={deleting}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-500 transition-all disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                                <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-500 hover:text-white">Cancel</button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-all"
                            >
                                <FiTrash2 size={15} /> Delete User
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}