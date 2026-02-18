// src/components/home/GenreGrid.jsx
import { useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { GET_ALL_GENRES } from '@/graphql/queries/genreQueries';
import { 
  FiCrosshair, FiSmile, FiHeart, FiAlertTriangle, 
  FiZap, FiStar 
} from 'react-icons/fi';

const genreIcons = {
  action: FiCrosshair,
  comedy: FiSmile,
  drama: FiHeart,
  horror: FiAlertTriangle,
  'sci-fi': FiZap,
  romance: FiStar,
};

const genreGradients = {
  action: 'from-red-500 to-orange-500',
  comedy: 'from-yellow-500 to-amber-500',
  drama: 'from-purple-500 to-pink-500',
  horror: 'from-gray-700 to-gray-900',
  'sci-fi': 'from-blue-500 to-cyan-500',
  romance: 'from-pink-500 to-rose-500',
};

const GenreCard = ({ genre }) => {
  const router = useRouter();
  const Icon = genreIcons[genre.slug] || FiStar;
  const gradient = genreGradients[genre.slug] || 'from-primary-500 to-primary-700';

  const handleClick = () => {
    router.push(`/genres/${genre.slug}`);
  };

  return (
    <motion.div
      onClick={handleClick}
      className="relative group cursor-pointer overflow-hidden rounded-xl h-48"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-80 
                       group-hover:opacity-100 transition-opacity duration-300`} />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
           }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
        <Icon size={48} className="mb-4 text-white" />
        <h3 className="text-2xl font-bold text-white mb-2">{genre.name}</h3>
        <p className="text-white/90 text-sm">
          {genre.movieCount} movies available
        </p>
      </div>

      {/* Explore Button */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 
                      group-hover:opacity-100 transition-opacity duration-300">
        <button className="bg-white text-gray-900 px-6 py-2 rounded-full 
                         font-semibold text-sm hover:bg-gray-100 transition-colors">
          Explore {genre.name}
        </button>
      </div>
    </motion.div>
  );
};

const GenreGrid = () => {
  const { loading, error, data } = useQuery(GET_ALL_GENRES);

  if (loading) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Browse by Genre</h2>
            <p className="text-gray-400">Loading genres...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-500">Error loading genres</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 bg-dark-300">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold mb-4">Browse by Genre</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Find your perfect movie by exploring different genres
          </p>
        </motion.div>

        {/* Genre Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.genres?.map((genre, index) => (
            <motion.div
              key={genre.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GenreCard genre={genre} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GenreGrid;