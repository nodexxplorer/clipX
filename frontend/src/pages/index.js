// src/pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { FiChevronRight } from 'react-icons/fi';

import MovieHero from '@/components/movies/MovieHero';
import MovieRow from '@/components/movies/MovieRow';
import GenreGrid from '@/components/home/GenreGrid';
import PersonalizedRecommendations from '@/components/recommendations/PersonalizedRecommendations';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

import { useAuth } from '@/contexts/AuthContext';
import { GET_HOME_PAGE_DATA, GET_TRENDING_SERIES } from '@/graphql/queries/movieQueries';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [featuredMovie, setFeaturedMovie] = useState(null);

  const { data, loading, error } = useQuery(GET_HOME_PAGE_DATA, {
    variables: { trendingLimit: 20, popularLimit: 20 }
  });

  const { data: seriesData } = useQuery(GET_TRENDING_SERIES, {
    variables: { limit: 20 }
  });

  useEffect(() => {
    if (data?.trending?.length > 0) {
      const bestMovies = data.trending.filter(m => m.backdropPath && m.overview);
      const pool = bestMovies.length > 0 ? bestMovies : data.trending;
      const randomIndex = Math.floor(Math.random() * Math.min(10, pool.length));
      setFeaturedMovie(pool[randomIndex]);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050607]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-primary-500 font-black uppercase tracking-[0.5em] animate-pulse">clipX Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message="Oops! Failed to load the cinematic experience."
        retry={() => window.location.reload()}
      />
    );
  }

  const { trending, popular, genres } = data || {};
  const trendingSeries = seriesData?.trendingSeries || [];

  return (
    <div className="bg-[#050607] min-h-screen overflow-x-hidden">
      <Head>
        <title>clipX | Stream Smarter</title>
        <meta name="description" content="Discover and stream the world's best movies and series on clipX." />
      </Head>

      {featuredMovie && <MovieHero movie={featuredMovie} />}

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 -mt-16 md:-mt-32 pb-24"
      >
        <MovieRow title="Trending Now" movies={trending} />

        {isAuthenticated && (
          <div className="mb-12">
            <PersonalizedRecommendations userId={user?.id} limit={15} />
          </div>
        )}

        <MovieRow title="Top Rated Hits" movies={popular} />

        {trendingSeries.length > 0 && (
          <MovieRow title="Binge-worthy Series" movies={trendingSeries} variant="series" />
        )}

        {!isAuthenticated && (
          <div className="px-4 md:px-12 mb-16">
            <div className="relative overflow-hidden rounded-2xl group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-indigo-900 opacity-90 transition-opacity group-hover:opacity-100" />
              <div className="relative p-10 md:p-20 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="text-center md:text-left">
                  <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase italic tracking-tighter">
                    Don't Miss Out
                  </h2>
                  <p className="text-primary-100 text-xl font-medium max-w-xl leading-relaxed">
                    Join our community of movie enthusiasts and unlock AI-powered recommendations tailored just for you.
                  </p>
                </div>
                <Link
                  href="/auth/register"
                  className="px-12 py-5 bg-white text-black font-black uppercase rounded shadow-2xl hover:scale-110 transition-transform active:scale-95"
                >
                  Start Streaming Now
                </Link>
              </div>
            </div>
          </div>
        )}

        <section className="px-4 md:px-12 mt-16">
          <SectionHeader title="Explore Genres" href="/genres" />
          <GenreGrid genres={genres} />
        </section>
      </motion.main>
    </div>
  );
}

function SectionHeader({ title, href }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center text-primary-400 hover:text-primary-300 font-bold uppercase text-sm tracking-widest transition-all group"
        >
          View All <FiChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}