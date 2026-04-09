// frontend/src/pages/admin/moderation/reports.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiFlag, FiCheck, FiX, FiClock, FiAlertTriangle, FiSearch } from 'react-icons/fi';
import { GET_ADMIN_REPORTS } from '@/graphql/queries/adminQueries';
import { gql } from '@apollo/client';

const UPDATE_REPORT_STATUS = gql`
  mutation UpdateReportStatus($id: ID!, $status: String!) {
    updateReportStatus(id: $id, status: $status) { success message }
  }
`;

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

export default function ReportsPage() {
    const [filter, setFilter] = useState('all');
    const { data, loading, refetch } = useQuery(GET_ADMIN_REPORTS, { fetchPolicy: 'cache-and-network' });
    const [updateStatus] = useMutation(UPDATE_REPORT_STATUS);

    const reports = data?.getReports || [];

    const filtered = reports.filter(r => {
        if (filter === 'all') return true;
        return r.status === filter;
    });

    const handleResolve = async (id) => {
        await updateStatus({ variables: { id, status: 'resolved' } });
        refetch();
    };
    const handleDismiss = async (id) => {
        await updateStatus({ variables: { id, status: 'dismissed' } });
        refetch();
    };

    const statusColors = {
        pending: 'bg-yellow-500/20 text-yellow-400',
        resolved: 'bg-green-500/20 text-green-400',
        dismissed: 'bg-gray-500/20 text-gray-500',
    };

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">Reports</h1>
                        <p className="text-sm text-gray-500 mt-0.5">User-submitted reports and flagged content</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center cursor-pointer hover:border-white/10 transition-colors" onClick={() => setFilter('all')}>
                            <p className="text-xl font-black text-white">{reports.length}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Total</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center cursor-pointer hover:border-yellow-500/20 transition-colors" onClick={() => setFilter('pending')}>
                            <p className="text-xl font-black text-yellow-400">{reports.filter(r => r.status === 'pending').length}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Pending</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center cursor-pointer hover:border-green-500/20 transition-colors" onClick={() => setFilter('resolved')}>
                            <p className="text-xl font-black text-green-400">{reports.filter(r => r.status === 'resolved').length}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Resolved</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white/[0.02] rounded-2xl p-5 animate-pulse h-24 border border-white/5" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map((report) => (
                                <div key={report.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                                                <FiFlag className="w-5 h-5 text-yellow-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-white font-bold text-sm">{report.reason}</span>
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full capitalize ${statusColors[report.status] || statusColors.pending}`}>
                                                        {report.status || 'pending'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 text-sm">{report.description || 'No description provided'}</p>
                                                <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                                                    <FiClock className="w-3 h-3" /> {timeAgo(report.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        {(report.status === 'pending' || !report.status) && (
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button onClick={() => handleResolve(report.id)} className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 rounded-xl text-xs font-bold hover:bg-green-500/20 transition-colors">
                                                    <FiCheck size={12} /> Resolve
                                                </button>
                                                <button onClick={() => handleDismiss(report.id)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-500/10 text-gray-400 rounded-xl text-xs font-bold hover:bg-gray-500/20 transition-colors">
                                                    <FiX size={12} /> Dismiss
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <FiCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No reports to show</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
