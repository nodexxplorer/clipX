// frontend/src/pages/admin/logs/index.jsx
import { useQuery } from '@apollo/client/react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { GET_DASHBOARD_STATS } from '@/graphql/queries/adminQueries';
import { FiRefreshCw, FiActivity, FiUser, FiFilm, FiDownload, FiPlay, FiStar, FiFlag, FiBell, FiUserPlus, FiBookmark } from 'react-icons/fi';

const iconMap = {
    user_signup: { icon: FiUserPlus, bg: 'bg-blue-500/10', color: 'text-blue-400' },
    movie_view: { icon: FiFilm, bg: 'bg-purple-500/10', color: 'text-purple-400' },
    download: { icon: FiDownload, bg: 'bg-green-500/10', color: 'text-green-400' },
    watchlist: { icon: FiBookmark, bg: 'bg-amber-500/10', color: 'text-amber-400' },
    watch: { icon: FiPlay, bg: 'bg-cyan-500/10', color: 'text-cyan-400' },
    review: { icon: FiStar, bg: 'bg-orange-500/10', color: 'text-orange-400' },
    report: { icon: FiFlag, bg: 'bg-red-500/10', color: 'text-red-400' },
    system: { icon: FiBell, bg: 'bg-gray-500/10', color: 'text-gray-400' },
};

function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString();
}

export default function AdminLogs() {
    const { data, loading, refetch } = useQuery(GET_DASHBOARD_STATS, {
        variables: {
            dateRange: {
                startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
                endDate: new Date().toISOString(),
            },
        },
    });

    const activities = data?.dashboardStats?.recentActivity || [];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Activity Logs</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Recent platform activity</p>
                    </div>
                    <button onClick={() => refetch()} className="p-2.5 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                        <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
                    <div className="divide-y divide-white/[0.03]">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mx-auto" />
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="p-12 text-center">
                                <FiActivity className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                                <p className="text-sm text-gray-600">No activity logs yet</p>
                            </div>
                        ) : (
                            activities.map((a) => {
                                const config = iconMap[a.type] || iconMap.system;
                                const Icon = config.icon;
                                return (
                                    <div key={a.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                                        <div className={`w-9 h-9 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={config.color} size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">{a.description}</p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>{a.type}</span>
                                            <span className="text-[11px] text-gray-600 tabular-nums">{timeAgo(a.timestamp)}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
