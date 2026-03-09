// src/pages/anime/index.js
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiChevronLeft } from 'react-icons/fi';
import MovieCard from '@/components/movies/MovieCard';
import Pagination from '@/components/common/Pagination';
import { LoadingSpinner, ErrorMessage, EmptyState, MovieCardSkeleton } from '@/components/common/LoadingSpinner';
import { gql } from '@apollo/client';

const GET_ANIME = gql`
  query GetAnime($page: Int, $limit: Int) {
    anime(page: $page, limit: $limit) {
      items {
        id
        title
        description
        year
        voteAverage
        posterPath
      }
      totalCount
      hasMore
      currentPage
    }
  }
`;

const MOVIES_PER_PAGE = 20;

export default function AnimePage() {
    const [currentPage, setCurrentPage] = useState(1);
    const { loading, error, data, refetch } = useQuery(GET_ANIME, {
        variables: {
            page: currentPage,
            limit: MOVIES_PER_PAGE,
        },
    });

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const totalPages = data?.anime?.totalCount
        ? Math.ceil(data.anime.totalCount / MOVIES_PER_PAGE)
        : 1;

    const animeList = data?.anime?.items || [];

    return (
        <>
            <Head>
                <title>Browse Anime - clipX</title>
                <meta name="description" content="Browse our anime collection" />
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
                        className="mb-12"
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 italic uppercase tracking-tighter">
                            Browse Anime
                        </h1>
                        <p className="text-gray-400 max-w-2xl leading-relaxed">
                            Dive into our vast collection of anime, from classic masterpieces to the latest hits from Japan.
                        </p>
                    </motion.div>

                    {/* Movies Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {[...Array(MOVIES_PER_PAGE)].map((_, i) => (
                                <MovieCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <ErrorMessage
                            message="Failed to load anime. Please try again."
                            retry={() => refetch()}
                        />
                    ) : animeList.length > 0 ? (
                        <>
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                {animeList.map((movie, index) => (
                                    <motion.div
                                        key={movie.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <div onClick={() => window.location.href = `/anime/${movie.id}`}>
                                            <MovieCard movie={{
                                                ...movie,
                                                rating: movie.voteAverage,
                                                posterUrl: movie.posterPath
                                            }} isAnime />
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Pagination */}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </>
                    ) : (
                        <EmptyState
                            title="No anime found"
                            message="Check back later for more content!"
                        />
                    )}
                </div>
            </div>
        </>
    );
}
