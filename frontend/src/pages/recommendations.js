import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MovieCard from '@/components/movies/MovieCard';
import { LoadingSpinner, EmptyState, MovieCardSkeleton } from '@/components/common/LoadingSpinner';
import { FiZap, FiTrendingUp, FiStar, FiRefreshCw, FiChevronLeft } from 'react-icons/fi';
import { gql } from '@apollo/client';

const GET_RECOMMENDATIONS = gql`
  query GetRecommendations {
    personalizedRecommendations(limit: 20) {
      id
      title
      description
      year
      rating
      posterUrl
      reason
      score
      genres {
        id
        name
      }
    }
    trending(limit: 10) {
      id
      title
      posterUrl
      rating
      genres {
        name
      }
    }
    popular(limit: 10) {
      id
      title
      posterUrl
      rating
      year
      genres {
        name
      }
    }
  }
`;

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState('personalized');
  const { loading, data, refetch } = useQuery(GET_RECOMMENDATIONS);

  const tabs = [
    { id: 'personalized', label: 'For You', icon: FiZap },
    { id: 'trending', label: 'Trending', icon: FiTrendingUp },
    { id: 'topRated', label: 'Top Rated', icon: FiStar },
  ];

  const getMovies = () => {
    switch (activeTab) {
      case 'personalized':
        return data?.personalizedRecommendations || [];
      case 'trending':
        return data?.trending || [];
      case 'topRated':
        return data?.popular || [];
      default:
        return [];
    }
  };

  return (
    <>
      <Head>
        <title>AI Recommendations - clipX</title>
        <meta name="description" content="Get personalized movie recommendations powered by AI" />
      </Head>

      <div className="min-h-screen py-24 px-6 md:px-12 bg-[#050607]">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors mb-6 group"
          >
            <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 italic uppercase tracking-tighter flex items-center gap-3">
                  <FiZap className="text-primary-500" />
                  AI Recommendations
                </h1>
                <p className="text-gray-400 max-w-2xl leading-relaxed">
                  Experience cinematic discovery redefined. Our neural engines analyze thousands of patterns to curate your perfect watchlist.
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold uppercase text-xs tracking-widest transition-all group"
                disabled={loading}
              >
                <FiRefreshCw className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                Refresh Engine
              </button>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-4 mb-12 overflow-x-auto pb-4 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest
                  transition-all duration-500 whitespace-nowrap border
                  ${activeTab === tab.id
                    ? 'bg-primary-500 text-white border-primary-500 shadow-neon scale-105'
                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'animate-pulse' : ''} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* AI Badge */}
          {activeTab === 'personalized' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-primary-600/20 via-purple-600/10 to-transparent 
                       border border-primary-500/30 rounded-2xl p-8 mb-12 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                <div className="bg-primary-500 p-4 rounded-2xl shadow-neon">
                  <FiZap className="text-white" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Neural Engine Active</h3>
                  <p className="text-gray-400 max-w-xl leading-relaxed">
                    Analyzing your content interactions and cross-referencing with global metadata to predict your next cinematic obsession.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Movies Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(20)].map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : getMovies().length > 0 ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {getMovies().map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="relative">
                    <MovieCard movie={movie} />
                    {/* AI Reason Badge for personalized */}
                    {activeTab === 'personalized' && movie.reason && (
                      <div className="mt-2 text-xs text-gray-400 bg-dark-100 p-2 rounded">
                        💡 {movie.reason}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState
              icon={FiZap}
              title="No recommendations yet"
              message="Watch some movies to get personalized recommendations"
            />
          )}
        </div>
      </div>
    </>
  );
}