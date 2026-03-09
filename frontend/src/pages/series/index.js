import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiChevronLeft } from 'react-icons/fi';
import MovieCard from '@/components/movies/MovieCard';
import MovieFilters from '@/components/movies/MovieFilters';
import Pagination from '@/components/common/Pagination';
import { LoadingSpinner, ErrorMessage, EmptyState, MovieCardSkeleton } from '@/components/common/LoadingSpinner';
import { gql } from '@apollo/client';

const GET_SERIES = gql`
  query GetAllSeries($filter: SeriesFilter, $sort: String, $limit: Int, $offset: Int) {
    allSeries(filter: $filter, sort: $sort, limit: $limit, offset: $offset) {
      series {
        id
        title
        description
        firstAirDate
        rating
        posterUrl
        genres {
          id
          name
          slug
        }
      }
      total
      hasMore
    }
  }
`;

const SERIES_PER_PAGE = 20;

export default function SeriesPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        genre: 'All',
        year: 'All',
        country: 'All',
        sort: 'Hottest',
    });

    const { loading, error, data, refetch } = useQuery(GET_SERIES, {
        variables: {
            filter: {
                genre: filters.genre && filters.genre !== 'All' ? filters.genre : undefined,
                year: filters.year && filters.year !== 'All' ? parseInt(filters.year) : undefined,
            },
            sort: filters.sort !== 'Hottest' ? filters.sort : 'popular',
            limit: SERIES_PER_PAGE,
            offset: (currentPage - 1) * SERIES_PER_PAGE,
        },
    });

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const totalPages = data?.allSeries?.total
        ? Math.ceil(data.allSeries.total / SERIES_PER_PAGE)
        : 1;

    return (
        <>
            <Head>
                <title>Browse Series - clipX</title>
                <meta name="description" content="Browse thousands of TV series across all genres" />
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
                            Browse Series
                        </h1>
                        <p className="text-gray-400 max-w-2xl leading-relaxed">
                            Binge-watch your favorite TV series from our massive library of trending shows and classics.
                        </p>
                    </motion.div>

                    {/* Filters */}
                    <MovieFilters
                        onFilterChange={handleFilterChange}
                        initialFilters={filters}
                    />

                    {/* Series Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {[...Array(SERIES_PER_PAGE)].map((_, i) => (
                                <MovieCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : error ? (
                        <ErrorMessage
                            message="Failed to load series. Please try again."
                            retry={() => refetch()}
                        />
                    ) : data?.allSeries?.series?.length > 0 ? (
                        <>
                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                {data.allSeries.series.map((series, index) => (
                                    <motion.div
                                        key={series.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <MovieCard movie={series} isSeries />
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
                            title="No series found"
                            message="Try adjusting your filters to see more results"
                            action={
                                <button
                                    onClick={() => handleFilterChange({ genre: 'All', year: 'All', country: 'All', sort: 'Hottest' })}
                                    className="btn-primary"
                                >
                                    Clear Filters
                                </button>
                            }
                        />
                    )}
                </div>
            </div>
        </>
    );
}
