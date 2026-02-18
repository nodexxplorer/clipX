import { useQuery } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { GET_ALL_GENRES } from '@/graphql/queries/genreQueries';
import { LoadingSpinner, ErrorMessage } from '@/components/common/LoadingSpinner';
import {
  FiCrosshair, FiSmile, FiHeart, FiAlertTriangle,
  FiZap, FiStar, FiFilm, FiTrendingUp, FiChevronLeft
} from 'react-icons/fi';

const genreIcons = {
  action: FiCrosshair,
  comedy: FiSmile,
  drama: FiHeart,
  horror: FiAlertTriangle,
  'sci-fi': FiZap,
  romance: FiStar,
  thriller: FiFilm,
  animation: FiTrendingUp,
};

const genreGradients = {
  action: 'from-red-500 to-orange-500',
  comedy: 'from-yellow-500 to-amber-500',
  drama: 'from-purple-500 to-pink-500',
  horror: 'from-gray-700 to-gray-900',
  'sci-fi': 'from-blue-500 to-cyan-500',
  romance: 'from-pink-500 to-rose-500',
  thriller: 'from-indigo-500 to-purple-500',
  animation: 'from-green-500 to-teal-500',
};

const genreDescriptions = {
  action: 'Heart-pounding adventures and explosive action sequences',
  comedy: 'Laugh-out-loud moments and comedic brilliance',
  drama: 'Powerful stories that touch the soul',
  horror: 'Spine-chilling tales that haunt your dreams',
  'sci-fi': 'Explore the unknown and future worlds',
  romance: 'Love stories that warm your heart',
  thriller: 'Edge-of-your-seat suspense and mystery',
  animation: 'Animated wonders for all ages',
};

export default function GenresIndexPage() {
  const router = useRouter();
  const { loading, error, data } = useQuery(GET_ALL_GENRES);

  if (loading) return <LoadingSpinner text="Loading genres..." />;
  if (error) return <ErrorMessage message="Failed to load genres" />;

  return (
    <>
      <Head>
        <title>Browse by Genre - clipX</title>
        <meta name="description" content="Explore movies by genre" />
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
            className="text-center mb-20"
          >
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 italic uppercase tracking-tighter">
              Explore <span className="text-primary-500">Genres</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Discover cinematic gems curated across every dimension of storytelling. Your next obsession starts here.
            </p>
          </motion.div>

          {/* Genre Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.genres?.map((genre, index) => {
              const Icon = genreIcons[genre.slug] || FiFilm;
              const gradient = genreGradients[genre.slug] || 'from-primary-500 to-primary-700';
              const description = genreDescriptions[genre.slug] || 'Explore amazing movies';

              return (
                <motion.div
                  key={genre.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => router.push(`/genres/${genre.slug}`)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl h-64"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} 
                                 opacity-80 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Pattern Overlay */}
                  <div
                    className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-between p-8">
                    <div>
                      <Icon size={48} className="mb-4 text-white" />
                      <h3 className="text-3xl font-bold text-white mb-2">
                        {genre.name}
                      </h3>
                      <p className="text-white/90 text-sm mb-2">
                        {description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/90 font-semibold">
                        {genre.movieCount} movies
                      </span>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity
                                       bg-white text-gray-900 px-4 py-2 rounded-full 
                                       font-semibold text-sm hover:bg-gray-100">
                        Explore →
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 text-center"
          >
            <p className="text-gray-400 mb-6">
              Can't decide? Let our AI help you find the perfect movie
            </p>
            <button
              onClick={() => router.push('/recommendations')}
              className="btn-primary"
            >
              Get AI Recommendations
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}