// frontend/src/pages/admin/revenue/index.jsx
import { useState, useEffect } from 'react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { motion } from 'framer-motion';
import {
    FiDollarSign, FiTrendingUp, FiUsers, FiRefreshCw,
    FiDownload, FiAlertTriangle, FiCheck, FiX,
    FiCreditCard, FiPieChart, FiBarChart2, FiCalendar
} from 'react-icons/fi';

// Revenue stat card
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
                <div className={`p-2.5 rounded-xl bg-white/5`}>
                    <Icon className={`w-5 h-5 ${colorMap[color].split(' ').pop()}`} />
                </div>
            </div>
            {trend && (
                <div className={`flex items-center gap-1 mt-3 text-xs font-bold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <FiTrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                    {Math.abs(trend)}% vs last month
                </div>
            )}
        </div>
    );
}

// Tier distribution bar
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
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    // Mock data — in production, fetch from backend
    useEffect(() => {
        const timer = setTimeout(() => {
            setStats({
                mrr: 245000,
                arr: 2940000,
                churnRate: 3.2,
                totalSubscribers: 156,
                tiers: { free: 89, standard: 45, pro: 22 },
                growth: [
                    { month: 'Oct', value: 120000 },
                    { month: 'Nov', value: 156000 },
                    { month: 'Dec', value: 189000 },
                    { month: 'Jan', value: 201000 },
                    { month: 'Feb', value: 223000 },
                    { month: 'Mar', value: 245000 },
                ],
                failedPayments: [
                    { id: 1, user: 'john@email.com', amount: 3000, plan: 'Standard', date: '2026-03-20', attempts: 2 },
                    { id: 2, user: 'sarah@email.com', amount: 8000, plan: 'Pro', date: '2026-03-19', attempts: 1 },
                    { id: 3, user: 'mike@email.com', amount: 3000, plan: 'Standard', date: '2026-03-18', attempts: 3 },
                ],
                recentPayments: [
                    { id: 1, user: 'alice@email.com', amount: 8000, plan: 'Pro', status: 'paid', date: '2026-03-22' },
                    { id: 2, user: 'bob@email.com', amount: 3000, plan: 'Standard', status: 'paid', date: '2026-03-22' },
                    { id: 3, user: 'carol@email.com', amount: 3000, plan: 'Standard', status: 'paid', date: '2026-03-21' },
                    { id: 4, user: 'dave@email.com', amount: 8000, plan: 'Pro', status: 'failed', date: '2026-03-21' },
                    { id: 5, user: 'eve@email.com', amount: 3000, plan: 'Standard', status: 'paid', date: '2026-03-20' },
                ],
                methodBreakdown: [
                    { method: 'Card', percentage: 65, amount: 159250 },
                    { method: 'Bank Transfer', percentage: 25, amount: 61250 },
                    { method: 'Mobile Money', percentage: 10, amount: 24500 },
                ],
            });
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [dateRange]);

    const formatCurrency = (val) => `₦${val.toLocaleString()}`;
    const maxGrowth = stats ? Math.max(...stats.growth.map(g => g.value)) : 1;

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white">Revenue & Subscriptions</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Financial overview & subscriber analytics</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setLoading(true)} className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <select
                                value={dateRange}
                                onChange={(e) => { setDateRange(e.target.value); setLoading(true); }}
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
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                <StatCard title="MRR" value={formatCurrency(stats.mrr)} subtitle="Monthly Recurring Revenue" icon={FiDollarSign} color="green" trend={9.8} />
                                <StatCard title="ARR" value={formatCurrency(stats.arr)} subtitle="Annual Recurring Revenue" icon={FiTrendingUp} color="primary" trend={12.4} />
                                <StatCard title="Active Subscribers" value={stats.totalSubscribers} subtitle={`${stats.tiers.standard + stats.tiers.pro} paid`} icon={FiUsers} color="purple" trend={5.6} />
                                <StatCard title="Churn Rate" value={`${stats.churnRate}%`} subtitle="Monthly average" icon={FiAlertTriangle} color="yellow" trend={-1.2} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* Revenue Growth Chart */}
                                <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <FiBarChart2 className="w-4 h-4 text-primary-400" /> Revenue Growth
                                    </h3>
                                    <div className="flex items-end gap-3 h-48">
                                        {stats.growth.map((item, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                                <span className="text-[10px] text-gray-500 font-bold">{formatCurrency(item.value)}</span>
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
                                        <TierBar label="Free" count={stats.tiers.free} total={stats.totalSubscribers} color="bg-gray-500" />
                                        <TierBar label="Standard" count={stats.tiers.standard} total={stats.totalSubscribers} color="bg-primary-500" />
                                        <TierBar label="Pro" count={stats.tiers.pro} total={stats.totalSubscribers} color="bg-purple-500" />
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-lg font-black text-white">{stats.tiers.free}</p>
                                            <p className="text-[10px] text-gray-500 font-bold">FREE</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-primary-400">{stats.tiers.standard}</p>
                                            <p className="text-[10px] text-gray-500 font-bold">STANDARD</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-purple-400">{stats.tiers.pro}</p>
                                            <p className="text-[10px] text-gray-500 font-bold">PRO</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method Breakdown */}
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

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Recent Payments */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="p-5 border-b border-white/5">
                                        <h3 className="text-white font-bold">Recent Payments</h3>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        {stats.recentPayments.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.status === 'paid' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                                        {p.status === 'paid' ? <FiCheck className="w-4 h-4 text-green-400" /> : <FiX className="w-4 h-4 text-red-400" />}
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
                                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">{stats.failedPayments.length}</span>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        {stats.failedPayments.map((p) => (
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
