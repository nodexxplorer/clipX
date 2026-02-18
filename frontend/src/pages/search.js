// src/pages/search.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '@/components/common/SearchBar';
import MovieCard from '@/components/movies/MovieCard';
import UnifiedResultCard from '@/components/search/UnifiedResultCard';
import { LoadingSpinner, EmptyState, MovieCardSkeleton } from '@/components/common/LoadingSpinner';
import { SEARCH_MOVIES } from '@/graphql/queries/movieQueries';
import { unifiedService } from '@/services/unifiedService';
import { FiSearch, FiDatabase, FiGlobe, FiAlertCircle, FiChevronLeft } from 'react-icons/fi';

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const [activeTab, setActiveTab] = useState('library'); // 'library' or 'web'

  // Unified Search State
  const [webResults, setWebResults] = useState([]);
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [webError, setWebError] = useState(null);

  const { loading: libraryLoading, data: libraryData } = useQuery(SEARCH_MOVIES, {
    variables: { query: q || '', limit: 50 },
    skip: !q,
  });

  // Handle Web Search
  useEffect(() => {
    const fetchWebResults = async () => {
      if (!q) return;

      setIsWebSearching(true);
      setWebError(null);
      try {
        const results = await unifiedService.search(q);
        setWebResults(results);
      } catch (err) {
        console.error("Web search failed", err);
        setWebError("Failed to fetch results from web sources.");
      } finally {
        setIsWebSearching(false);
      }
    };

    if (activeTab === 'web' && q) {
      fetchWebResults();
    }
  }, [q, activeTab]);

  const tabs = [
    { id: 'library', label: 'Library', icon: FiDatabase },
    { id: 'web', label: 'Web Sources', icon: FiGlobe },
  ];

  return (
    <>
      <Head>
        <title>{q ? `Search: ${q}` : 'Search'} - clipX</title>
        <meta name="description" content="Search for movies" />
      </Head>

      <div className="min-h-screen py-24 px-6 bg-[#050607]">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-500 transition-colors mb-6 group"
          >
            <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          {/* Search Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 italic uppercase tracking-tighter">
              Search <span className="text-primary-500">Universe</span>
            </h1>
            <div className="max-w-2xl relative">
              <SearchBar placeholder="Scan for cinematic signals..." autoFocus />
              <div className="absolute inset-0 -z-10 bg-primary-500/5 blur-2xl rounded-full" />
            </div>
          </motion.div>

          {/* Tabs */}
          {q && (
            <div className="flex gap-4 mb-8 border-b border-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-4 px-2 text-sm font-medium transition-colors relative
                    ${activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 hover:text-white'}`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Results Content */}
          <AnimatePresence mode="wait">
            {!q ? (
              <EmptyState
                icon={FiSearch}
                title="Start searching"
                message="Enter a movie title, actor, or director to find what you're looking for"
              />
            ) : activeTab === 'library' ? (
              <motion.div
                key="library"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Library Tab Content */}
                {libraryLoading ? (
                  <div>
                    <p className="text-gray-400 mb-6">{`Searching library for "${q}"...`}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {[...Array(10)].map((_, i) => (
                        <MovieCardSkeleton key={i} />
                      ))}
                    </div>
                  </div>
                ) : libraryData?.searchMovies?.items?.length > 0 ? (
                  <div>
                    <p className="text-gray-400 mb-6">
                      {`Found ${libraryData.searchMovies.items.length} results in library for "${q}"`}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {libraryData.searchMovies.items.map((movie, index) => (
                        <motion.div
                          key={movie.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <MovieCard movie={movie} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={FiDatabase}
                    title={`No library results for "${q}"`}
                    message="Try checking the Web Sources tab to find and download this movie."
                    action={
                      <button
                        onClick={() => setActiveTab('web')}
                        className="btn-primary flex items-center gap-2"
                      >
                        <FiGlobe /> Search Web Sources
                      </button>
                    }
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="web"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Web Sources Tab Content */}
                {isWebSearching ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <LoadingSpinner size="lg" />
                    <p className="text-gray-400 mt-4">Searching external providers (MovieBox, Anime-DL, LulaCloud)...</p>
                  </div>
                ) : webError ? (
                  <div className="text-center py-20">
                    <div className="bg-red-500/10 text-red-500 p-4 rounded-lg inline-flex items-center gap-3">
                      <FiAlertCircle size={24} />
                      {webError}
                    </div>
                  </div>
                ) : webResults.length > 0 ? (
                  <div>
                    <p className="text-gray-400 mb-6">
                      {`Found ${webResults.length} downloadable links for "${q}"`}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {webResults.map((result, index) => (
                        <UnifiedResultCard key={index} result={result} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={FiGlobe}
                    title={`No web results for "${q}"`}
                    message="We couldn't find any download links from our providers."
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}