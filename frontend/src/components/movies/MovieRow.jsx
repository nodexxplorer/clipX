import { useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import MovieCard from './MovieCard';

const MovieRow = ({ title, movies = [], variant = 'default' }) => {
    const rowRef = useRef(null);

    const scroll = (direction) => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (!movies || movies.length === 0) return null;

    return (
        <div className="mb-12 group relative">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 px-4 md:px-12 flex items-center justify-between">
                <span>{title}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => scroll('left')}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <FiChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <FiChevronRight size={20} />
                    </button>
                </div>
            </h2>

            <div
                ref={rowRef}
                className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4 md:px-12 pb-4 pt-2"
            >
                {movies.map((movie) => (
                    <div key={movie.id} className="flex-shrink-0 w-32 sm:w-40 md:w-48 lg:w-56">
                        <MovieCard
                            movie={movie}
                            size="md"
                            isSeries={variant === 'series'}
                            isAnime={variant === 'anime'}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MovieRow;
