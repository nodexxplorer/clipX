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
  FiFilm, FiBookmark, FiChevronRight, FiEye, FiCpu
} from 'react-icons/fi';

import { useAuth } from '@/contexts/AuthContext';
import { watchUrl } from '@/utils/urlHelpers';
import MovieHero from '@/components/movies/MovieHero';
import MovieRow from '@/components/movies/MovieRow';
import PersonalizedRecommendations from '@/components/recommendations/PersonalizedRecommendations';
import { DashboardSkeleton } from '@/components/common/LoadingSpinner';
import First50Banner from '@/components/common/First50Banner';
import GracePeriodBanner from '@/components/common/GracePeriodBanner';
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
    return <DashboardSkeleton />;
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
        {/* Banners */}
        <div className="px-4 md:px-12 space-y-4 mb-8">
          <GracePeriodBanner />
          <First50Banner />
        </div>

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

        {/* AI Assistant Card */}
        <div className="px-4 md:px-12 mb-12">
          <Link href="/ai-assistant">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-6 md:p-8 cursor-pointer group hover:border-primary-500/30 transition-all"
            >
              {/* Glow effect */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />

              <div className="relative flex items-center gap-4 md:gap-6">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
                  <FiCpu className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                    Ask ClipX AI
                  </h3>
                  <p className="text-sm text-gray-400">
                    Get personalized movie recommendations powered by Gemini AI — find your next favorite film in seconds.
                  </p>
                </div>
                <FiChevronRight className="w-6 h-6 text-gray-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </motion.div>
          </Link>
        </div>

        <MovieRow title="Highly Recommended" movies={popularMovies} />

        {/* Watch History List */}
        {recentlyViewed.length > 0 && (
          <div className="px-4 md:px-12 mb-12">
            <SectionHeader title="Watch History" />
            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
              {recentlyViewed.map((item, idx) => (
                <Link key={item.id} href={`/movies/${item.id}`}>
                  <div className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer group ${idx !== recentlyViewed.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <span className="text-xs font-bold text-gray-600 w-6 text-center">{idx + 1}</span>
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-12 h-16 rounded-lg object-cover flex-shrink-0 ring-1 ring-white/10 group-hover:ring-primary-500/30 transition-all"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-sm truncate group-hover:text-primary-400 transition-colors">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.rating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-yellow-400">
                            <FiStar className="w-3 h-3 fill-current" /> {item.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest hidden sm:block">Watch Again</span>
                      <FiPlay className="w-4 h-4 text-gray-500 group-hover:text-primary-400 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

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
    <Link href={watchUrl(item.movie)} className="group block">
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