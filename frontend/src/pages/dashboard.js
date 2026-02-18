/**
 * Dashboard Page
 * User's personalized dashboard with recommendations, watchlist, and stats
 */

import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import {
  FiPlay, FiClock, FiStar,
  FiFilm, FiBookmark, FiChevronRight
} from 'react-icons/fi';

import { useAuth } from '@/contexts/AuthContext';
import MovieHero from '@/components/movies/MovieHero';
import MovieRow from '@/components/movies/MovieRow';
import PersonalizedRecommendations from '@/components/recommendations/PersonalizedRecommendations';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { GET_DASHBOARD_DATA } from '@/graphql/queries/userQueries';
import { GET_TRENDING, GET_POPULAR } from '@/graphql/queries/movieQueries';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Fetch dashboard data
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_DATA, {
    skip: !isAuthenticated,
    variables: { userId: user?.id },
    pollInterval: 15000,
    fetchPolicy: 'cache-and-network',
  });

  // Fetch TMDB movies for rows
  const { data: trendingData } = useQuery(GET_TRENDING, {
    variables: { timeWindow: 'week', limit: 20 }
  });

  const { data: popularData } = useQuery(GET_POPULAR, {
    variables: { page: 1, limit: 20 }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Refetch on visibility
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refetch?.();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refetch]);

  if (authLoading || (loading && !data)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050607]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  const { watchlist = [], continueWatching = [], recentlyViewed = [], stats } = data?.dashboardData || {};
  const trendingMovies = trendingData?.trending || [];
  const popularMovies = popularData?.popular || [];

  const featuredInDash = trendingMovies.length > 0 ? trendingMovies[0] : null;

  return (
    <div className="bg-[#050607] min-h-screen pb-20">
      <Head>
        <title>Dashboard | clipX</title>
      </Head>

      {featuredInDash && <MovieHero movie={featuredInDash} />}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 -mt-16 md:-mt-32"
      >
        {/* Continue Watching Row */}
        {continueWatching.length > 0 && (
          <div className="mb-12 px-4 md:px-12">
            <SectionHeader title="Continue Watching" />
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-4">
              {continueWatching.map((item) => (
                <div key={item.id} className="flex-shrink-0 w-64 md:w-80">
                  <ContinueWatchingCard item={item} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personalized Recommendations */}
        <div className="mb-12">
          <PersonalizedRecommendations userId={user.id} limit={15} />
        </div>

        {/* My Watchlist Row */}
        {watchlist.length > 0 ? (
          <MovieRow title="My Watchlist" movies={watchlist} />
        ) : (
          <div className="px-4 md:px-12 mb-12">
            <div className="glass-card p-10 rounded-2xl text-center border-dashed border-2 border-white/10">
              <FiBookmark className="mx-auto mb-4 text-primary-500 opacity-50 shadow-neon" size={48} />
              <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Your watchlist is empty</h3>
              <p
                className="text-gray-400 mb-6 underline decoration-primary-500 underline-offset-8 cursor-pointer hover:text-white transition-colors"
                onClick={() => router.push('/')}
              >
                Start exploring movies to add them here
              </p>
            </div>
          </div>
        )}

        <MovieRow title="Global Trends" movies={trendingMovies} />

        {/* User Stats Grid */}
        <div className="px-4 md:px-12 mb-12">
          <SectionHeader title="Account Activity" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={FiFilm} label="Movies Watched" value={stats?.moviesWatched || 0} color="primary" />
            <StatCard icon={FiClock} label="Watch Time" value={formatWatchTime(stats?.totalWatchTime || 0)} color="blue" />
            <StatCard icon={FiBookmark} label="In Watchlist" value={stats?.watchlistCount || 0} color="yellow" />
            <StatCard icon={FiStar} label="Reviews Written" value={stats?.reviewsWritten || 0} color="green" />
          </div>
        </div>

        <MovieRow title="Highly Recommended" movies={popularMovies} />

        {recentlyViewed.length > 0 && (
          <MovieRow title="Recently Viewed" movies={recentlyViewed} />
        )}
      </motion.div>
    </div>
  );
}

// Sub-components
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    primary: 'from-primary-600/20 to-primary-600/5 text-primary-400 border-primary-500/20',
    blue: 'from-blue-600/20 to-blue-600/5 text-blue-400 border-blue-500/20',
    yellow: 'from-yellow-600/20 to-yellow-600/5 text-yellow-400 border-yellow-500/20',
    green: 'from-green-600/20 to-green-600/5 text-green-400 border-green-500/20'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-6 transition-transform hover:scale-105 backdrop-blur-sm`}>
      <Icon className="w-8 h-8 mb-4 opacity-80" />
      <p className="text-3xl font-black text-white tabular-nums tracking-tighter mb-1">{value}</p>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function SectionHeader({ title, href }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center text-primary-400 hover:text-primary-300 font-bold uppercase text-xs tracking-widest transition-all group"
        >
          View All <FiChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}

function ContinueWatchingCard({ item }) {
  const progress = (item.currentTime / item.duration) * 100;

  return (
    <Link href={`/watch/${item.movie.id}`} className="group block">
      <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]">
        <img
          src={item.movie.backdropUrl || item.movie.posterUrl}
          alt={item.movie.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
            <FiPlay className="w-8 h-8 ml-1 fill-current" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
          <div
            className="h-full bg-primary-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Info */}
        <div className="absolute bottom-4 left-4 right-4 translate-y-2 group-hover:translate-y-0 transition-transform">
          <h3 className="font-black text-white text-lg uppercase italic tracking-tighter truncate leading-tight shadow-text">
            {item.movie.title}
          </h3>
          <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">
            {Math.round(item.duration / 60 - item.currentTime / 60)}m left
          </p>
        </div>
      </div>
    </Link>
  );
}

// Utility functions
function formatWatchTime(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}