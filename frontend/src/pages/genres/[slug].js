// src/pages/genres/[slug].js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiChevronLeft } from 'react-icons/fi';
import MovieCard from '@/components/movies/MovieCard';
import Pagination from '@/components/common/Pagination';
import { LoadingSpinner, ErrorMessage, EmptyState, MovieCardSkeleton } from '@/components/common/LoadingSpinner';
import { GET_MOVIES_BY_GENRE } from '@/graphql/queries/movieQueries';

const MOVIES_PER_PAGE = 20;

const genreInfo = {
  action: {
    title: 'Action',
    description: 'High-octane thrills, explosive stunts, and adrenaline-pumping adventures',
    gradient: 'from-red-500 to-orange-500',
  },
  comedy: {
    title: 'Comedy',
    description: 'Laugh out loud with the funniest movies and comedic masterpieces',
    gradient: 'from-yellow-500 to-amber-500',
  },
  drama: {
    title: 'Drama',
    description: 'Compelling stories that touch the heart and soul',
    gradient: 'from-purple-500 to-pink-500',
  },
  horror: {
    title: 'Horror',
    description: 'Terrifying tales that will keep you up at night',
    gradient: 'from-gray-700 to-gray-900',
  },
  'sci-fi': {
    title: 'Science Fiction',
    description: 'Explore the future, space, and beyond with mind-bending sci-fi',
    gradient: 'from-blue-500 to-cyan-500',
  },
  romance: {
    title: 'Romance',
    description: 'Heartwarming love stories and romantic adventures',
    gradient: 'from-pink-500 to-rose-500',
  },
};

export default function GenrePage() {
  const router = useRouter();
  const { slug } = router.query;
  const [currentPage, setCurrentPage] = useState(1);

  const { loading, error, data } = useQuery(GET_MOVIES_BY_GENRE, {
    variables: {
      genreSlug: slug,
      limit: MOVIES_PER_PAGE,
      offset: (currentPage - 1) * MOVIES_PER_PAGE,
    },
    skip: !slug,
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const genre = genreInfo[slug] || {
    title: slug?.charAt(0).toUpperCase() + slug?.slice(1),
    description: 'Explore movies in this genre',
    gradient: 'from-primary-500 to-primary-700',
  };

  const totalPages = data?.moviesByGenre?.totalCount
    ? Math.ceil(data.moviesByGenre.totalCount / MOVIES_PER_PAGE)
    : 1;

  return (
    <>
      <Head>
        <title>{genre.title} Movies - clipX</title>
        <meta name="description" content={genre.description} />
      </Head>

      <div className="min-h-screen">
        {/* Hero Section */}
        <div className={`relative bg-gradient-to-br ${genre.gradient} pt-32 pb-20 px-6`}>
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
          <div className="relative max-w-7xl mx-auto px-6">
            {/* Back Button */}
            <Link
              href="/genres"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 group"
            >
              <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">All Genres</span>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-6xl font-black text-white mb-4 italic uppercase tracking-tighter">
                {genre.title}
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                {genre.description}
              </p>
              {data?.moviesByGenre?.totalCount && (
                <p className="text-white/60 mt-6 font-medium uppercase tracking-[0.2em] text-xs">
                  {data.moviesByGenre.totalCount} cinematic titles
                </p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Movies Section */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(MOVIES_PER_PAGE)].map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorMessage message="Failed to load movies" />
          ) : data?.moviesByGenre?.items?.length > 0 ? (
            <>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {data.moviesByGenre.items.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <MovieCard movie={movie} />
                  </motion.div>
                ))}
              </motion.div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <EmptyState
              title="No movies found"
              message={`No ${genre.title.toLowerCase()} movies available at the moment`}
              action={
                <button onClick={() => router.push('/movies')} className="btn-primary">
                  Browse All Movies
                </button>
              }
            />
          )}
        </div>
      </div>
    </>
  );
}