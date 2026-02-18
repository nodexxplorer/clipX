// frontend/src/hooks/useAdminStats.js
import { useQuery } from '@apollo/client';
import { GET_DASHBOARD_STATS, GET_USER_ANALYTICS, GET_MOVIE_ANALYTICS } from '../graphql/queries/adminQueries';
import { useAdmin } from './useAdmin';

export function useAdminStats(dateRange) {
  const { authContext } = useAdmin();

  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_STATS, {
    variables: { dateRange },
    ...authContext,
    pollInterval: 60000 // Refresh every minute
  });

  return {
    stats: data?.dashboardStats,
    loading,
    error,
    refetch
  };
}

export function useUserAnalytics(dateRange) {
  const { authContext } = useAdmin();

  const { data, loading, error } = useQuery(GET_USER_ANALYTICS, {
    variables: { dateRange },
    ...authContext,
    skip: !dateRange.startDate || !dateRange.endDate
  });

  return { data: data?.userAnalytics, loading, error };
}

export function useMovieAnalytics(dateRange) {
  const { authContext } = useAdmin();

  const { data, loading, error } = useQuery(GET_MOVIE_ANALYTICS, {
    variables: { dateRange },
    ...authContext,
    skip: !dateRange.startDate || !dateRange.endDate
  });

  return { data: data?.movieAnalytics, loading, error };
}
