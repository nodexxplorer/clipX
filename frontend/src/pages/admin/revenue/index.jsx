// frontend/src/pages/admin/revenue/index.jsx
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {
    FiDollarSign, FiTrendingUp, FiUsers, FiRefreshCw,
    FiDownload, FiAlertTriangle, FiCheck, FiX,
    FiCreditCard, FiPieChart, FiBarChart2
} from 'react-icons/fi';
import { GET_REVENUE_STATS } from '@/graphql/queries/adminQueries';

function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', trend }) {
    const colorMap = {
        primary: 'from-primary-500/20 to-primary-500/5 border-primary-500/20 text-primary-400',
        green: 'from-green-500/20 to-green-500/5 border-green-500/20 text-green-400',
        purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400',
        red: 'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400',
        yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20 text-yellow-400',
    };
    return (
        <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{title}</p>
                    <p className="text-2xl font-black text-white mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className="p-2.5 rounded-xl bg-white/5">
                    <Icon className={`w-5 h-5 ${colorMap[color].split(' ').pop()}`} />
                </div>
            </div>
        </div>
    );
}

function TierBar({ label, count, total, color }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-20 font-medium">{label}</span>
            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-white font-bold w-12 text-right">{count}</span>
        </div>
    );
}

export default function RevenuePage() {
    const [dateRange, setDateRange] = useState('30');

    const { data, loading, refetch } = useQuery(GET_REVENUE_STATS, {
        variables: { days: parseInt(dateRange) },
        fetchPolicy: 'cache-and-network',
    });

    const stats = data?.revenueStats || null;

    const formatCurrency = (val) => `₦${(val || 0).toLocaleString()}`;
    const maxGrowth = stats ? Math.max(...(stats.growth || []).map(g => g.value), 1) : 1;

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white">Revenue & Subscriptions</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Financial overview & subscriber analytics</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => refetch()} className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="bg-white/[0.03] text-sm text-gray-300 px-4 py-2 rounded-xl border border-white/5 outline-none"
                            >
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="365">Last year</option>
                            </select>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-colors">
                                <FiDownload size={14} /> Export
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white/[0.02] rounded-2xl p-6 animate-pulse h-32 border border-white/5" />
                            ))}
                        </div>
                    ) : stats && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                <StatCard title="MRR" value={formatCurrency(stats.mrr)} subtitle="Monthly Recurring Revenue" icon={FiDollarSign} color="green" />
                                <StatCard title="ARR" value={formatCurrency(stats.arr)} subtitle="Annual Recurring Revenue" icon={FiTrendingUp} color="primary" />
                                <StatCard title="Total Users" value={stats.totalSubscribers || 0} subtitle={`${(stats.tiers?.standard || 0) + (stats.tiers?.pro || 0)} paid`} icon={FiUsers} color="purple" />
                                <StatCard title="Churn Rate" value={`${stats.churnRate || 0}%`} subtitle="Monthly average" icon={FiAlertTriangle} color="yellow" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* Revenue Growth Chart */}
                                <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <FiBarChart2 className="w-4 h-4 text-primary-400" /> User Growth
                                    </h3>
                                    <div className="flex items-end gap-3 h-48">
                                        {(stats.growth || []).map((item, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                                <span className="text-[10px] text-gray-500 font-bold">{item.value}</span>
                                                <div
                                                    className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-lg transition-all duration-700 min-h-[8px]"
                                                    style={{ height: `${(item.value / maxGrowth) * 100}%` }}
                                                />
                                                <span className="text-[10px] text-gray-500 font-medium">{item.month}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tier Distribution */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <FiPieChart className="w-4 h-4 text-purple-400" /> Subscribers by Tier
                                    </h3>
                                    <div className="space-y-4 mt-6">
                                        <TierBar label="Free" count={stats.tiers?.free || 0} total={stats.totalSubscribers || 1} color="bg-gray-500" />
                                        <TierBar label="Standard" count={stats.tiers?.standard || 0} total={stats.totalSubscribers || 1} color="bg-primary-500" />
                                        <TierBar label="Pro" count={stats.tiers?.pro || 0} total={stats.totalSubscribers || 1} color="bg-purple-500" />
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-lg font-black text-white">{stats.tiers?.free || 0}</p>
                                            <p className="text-[10px] text-gray-500 font-bold">FREE</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-primary-400">{stats.tiers?.standard || 0}</p>
                                            <p className="text-[10px] text-gray-500 font-bold">STANDARD</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-purple-400">{stats.tiers?.pro || 0}</p>
                                            <p className="text-[10px] text-gray-500 font-bold">PRO</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method Breakdown */}
                            {(stats.methodBreakdown || []).length > 0 && (
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <FiCreditCard className="w-4 h-4 text-green-400" /> Revenue by Payment Method
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {stats.methodBreakdown.map((m, i) => (
                                            <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-gray-300 font-medium">{m.method}</span>
                                                    <span className="text-sm text-white font-bold">{m.percentage}%</span>
                                                </div>
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                                                    <div className="h-full bg-gradient-to-r from-green-500 to-primary-500 rounded-full" style={{ width: `${m.percentage}%` }} />
                                                </div>
                                                <p className="text-xs text-gray-500">{formatCurrency(m.amount)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Recent Payments */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="p-5 border-b border-white/5">
                                        <h3 className="text-white font-bold">Recent Payments</h3>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        {(stats.recentPayments || []).length === 0 && (
                                            <div className="text-center py-8 text-gray-500 text-sm">No payments recorded yet</div>
                                        )}
                                        {(stats.recentPayments || []).map((p) => (
                                            <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/10">
                                                        <FiCheck className="w-4 h-4 text-green-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{p.user}</p>
                                                        <p className="text-gray-500 text-xs">{p.plan} • {p.date}</p>
                                                    </div>
                                                </div>
                                                <span className="text-white font-bold text-sm">{formatCurrency(p.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Failed Payments */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                        <h3 className="text-white font-bold">Failed Payments</h3>
                                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">{(stats.failedPayments || []).length}</span>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        {(stats.failedPayments || []).length === 0 && (
                                            <div className="text-center py-8 text-gray-500 text-sm">No failed payments 🎉</div>
                                        )}
                                        {(stats.failedPayments || []).map((p) => (
                                            <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                                        <FiAlertTriangle className="w-4 h-4 text-red-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{p.user}</p>
                                                        <p className="text-gray-500 text-xs">{p.plan} • {p.attempts} attempt{p.attempts > 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                                <button className="px-3 py-1.5 text-xs text-primary-400 bg-primary-500/10 rounded-lg hover:bg-primary-500/20 transition-colors font-bold">
                                                    Retry
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
