import { motion } from 'framer-motion';
import { FiPlay, FiPlus, FiInfo, FiStar } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Image from 'next/image';

const MovieHero = ({ movie }) => {
    const router = useRouter();

    if (!movie) return null;

    const backdropUrl = movie.backdropPath || movie.posterPath;
    const rating = movie.voteAverage || 0;

    return (
        <div className="relative h-[85vh] w-full overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <Image
                    src={backdropUrl}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Gradients to blend */}
                <div className="absolute inset-0 cinematic-gradient" />
                <div className="absolute inset-0 netflix-gradient" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-4 md:px-12 max-w-7xl mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-2xl"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-500 font-bold text-sm">
                            <FiStar className="fill-current" />
                            {rating.toFixed(1)}
                        </div>
                        {movie.releaseDate && (
                            <span className="text-gray-300 font-medium">{movie.releaseDate.split('-')[0]}</span>
                        )}
                        <span className="px-2 py-0.5 border border-gray-500 rounded text-xs text-gray-300 uppercase letter tracking-widest">
                            4K Ultra HD
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 text-shadow uppercase italic">
                        {movie.title}
                    </h1>

                    <p className="text-lg text-gray-200 mb-8 line-clamp-3 text-shadow md:max-w-xl">
                        {movie.overview}
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => router.push(`/watch/${movie.id}`)}
                            className="flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded hover:bg-white/90 transition-all transform hover:scale-105"
                        >
                            <FiPlay className="fill-current" /> Play Now
                        </button>

                        <button
                            onClick={() => router.push(`/movies/${movie.id}`)}
                            className="flex items-center gap-2 px-8 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded transition-all transform hover:scale-105"
                        >
                            <FiInfo /> More Info
                        </button>

                        <button
                            className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-white/50 text-white hover:border-white hover:bg-white/10 transition-all"
                            title="Add to Watchlist"
                        >
                            <FiPlus size={24} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MovieHero;
