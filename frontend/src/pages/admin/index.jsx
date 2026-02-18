// frontend/src/pages/admin/index.jsx
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import StatsCards from '@/components/admin/dashboard/StatsCards';
import UserGrowthChart from '@/components/admin/dashboard/UserGrowthChart';
import TopMoviesTable from '@/components/admin/dashboard/TopMoviesTable';
import RecentActivity from '@/components/admin/dashboard/RecentActivity';
import { GET_DASHBOARD_STATS } from '@/graphql/queries/adminQueries';

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString()
  });

  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS, {
    variables: { dateRange },
    // Skip query if not yet authenticated
    skip: false,
  });

  const stats = data?.dashboardStats;

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <select 
              className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
              onChange={(e) => {
                const days = parseInt(e.target.value);
                setDateRange({
                  startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
                  endDate: new Date().toISOString()
                });
              }}
            >
              <option value="7">Last 7 days</option>
              <option value="30" defaultValue>Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse h-32" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-900/50 text-red-200 p-4 rounded-lg">
              Error loading dashboard: {error.message}
            </div>
          ) : (
            <>
              <StatsCards stats={stats} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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