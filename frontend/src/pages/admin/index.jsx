// frontend/src/pages/admin/index.jsx
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import dynamic from 'next/dynamic';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { GET_DASHBOARD_STATS } from '@/graphql/queries/adminQueries';
import { FiRefreshCw } from 'react-icons/fi';

// Code splitting: lazy-load heavy dashboard components to shrink the main bundle
const StatsCards = dynamic(() => import('@/components/admin/dashboard/StatsCards'), {
  loading: () => <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="bg-white/[0.02] rounded-2xl p-6 animate-pulse h-32 border border-white/5" />)}</div>,
  ssr: false
});
const UserGrowthChart = dynamic(() => import('@/components/admin/dashboard/UserGrowthChart'), {
  loading: () => <div className="bg-white/[0.02] rounded-2xl p-6 animate-pulse h-64 border border-white/5" />,
  ssr: false
});
const TopMoviesTable = dynamic(() => import('@/components/admin/dashboard/TopMoviesTable'), {
  loading: () => <div className="bg-white/[0.02] rounded-2xl p-6 animate-pulse h-64 border border-white/5" />,
  ssr: false
});
const RecentActivity = dynamic(() => import('@/components/admin/dashboard/RecentActivity'), {
  loading: () => <div className="bg-white/[0.02] rounded-2xl p-6 animate-pulse h-48 border border-white/5" />,
  ssr: false
});

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString()
  });

  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_STATS, {
    variables: { dateRange },
  });

  const stats = data?.dashboardStats;

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">Overview of your platform</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all"
              >
                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <select
                className="bg-white/[0.03] text-sm text-gray-300 px-4 py-2 rounded-xl border border-white/5 outline-none focus:border-primary-500/30 transition-colors cursor-pointer"
                defaultValue="7"
                onChange={(e) => {
                  const days = parseInt(e.target.value);
                  setDateRange({
                    startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
                    endDate: new Date().toISOString()
                  });
                }}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/[0.02] rounded-2xl p-6 animate-pulse h-32 border border-white/5" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-500/5 border border-red-500/10 text-red-300 p-5 rounded-2xl">
              <p className="font-bold text-sm mb-1">Failed to load dashboard</p>
              <p className="text-red-400/70 text-xs">{error.message}</p>
              <button onClick={() => refetch()} className="mt-3 text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
                Retry
              </button>
            </div>
          ) : (
            <>
              <StatsCards stats={stats} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <UserGrowthChart data={stats?.userGrowth} />
                <TopMoviesTable movies={stats?.topMovies} />
              </div>

              <RecentActivity activities={stats?.recentActivity} />
            </>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}