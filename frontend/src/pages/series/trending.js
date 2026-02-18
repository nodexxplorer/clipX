import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import MovieCard from '@/components/movies/MovieCard';
import { LoadingSpinner, ErrorMessage } from '@/components/common/LoadingSpinner';
import { gql } from '@apollo/client';

const GET_TRENDING_SERIES = gql`
  query GetTrendingSeries($limit: Int) {
    trendingSeries(limit: $limit) {
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
  }
`;

export default function TrendingSeriesPage() {
    const { loading, error, data } = useQuery(GET_TRENDING_SERIES, {
        variables: { limit: 50 },
    });

    return (
        <>
            <Head>
                <title>Trending Series - clipX</title>
                <meta name="description" content="See what's trending in TV series right now" />
            </Head>

            <div className="min-h-screen py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-4xl font-bold mb-4">Trending Series</h1>
                        <p className="text-gray-400">Most popular TV shows this week</p>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : error ? (
                        <ErrorMessage message="Failed to load trending series" />
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {data?.trendingSeries?.map((series, index) => (
                                <motion.div
                                    key={series.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <MovieCard movie={series} rank={index + 1} showRank isSeries />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
}
