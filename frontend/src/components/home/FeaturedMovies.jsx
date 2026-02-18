// src/components/home/FeaturedMovies.jsx

import { motion } from 'framer-motion';
import MovieCard from '../movies/MovieCard';

const FeaturedMovies = ({ movies = [] }) => {
    if (!movies || movies.length === 0) return null;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 },
        },
    };

    return (
        <section className="py-16 px-6 bg-dark-200">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl font-bold mb-4">Featured Movies</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Discover our handpicked selection of the latest and greatest movies
                    </p>
                </motion.div>

                {/* Movies Grid */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {movies.slice(0, 4).map((movie) => (
                        <motion.div key={movie.id} variants={itemVariants}>
                            <MovieCard movie={movie} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default FeaturedMovies;