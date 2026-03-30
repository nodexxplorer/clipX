/**
 * "Because You Watched X" Recommendation Rows
 * Fetches personalized recommendations and displays themed horizontal carousels.
 * Pro-only: shows upgrade prompt for free/standard users.
 */
import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { FiStar, FiLock, FiArrowRight, FiZap } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { movieUrl } from '@/utils/urlHelpers';
import { useSubscription } from '@/hooks/useSubscription';
import { GET_RECOMMENDATIONS } from '@/graphql/queries/recommendationQueries';
import { useAuth } from '@/contexts/AuthContext';

// ─── "Because You Watched X" Row ─────────────────────────────────
export function BecauseYouWatchedRow({ sourceMovie, recommendations = [] }) {
  if (!sourceMovie || recommendations.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg ring-1 ring-white/10">
            <Image
              src={sourceMovie.posterPath || sourceMovie.posterUrl || '/images/placeholder.jpg'}
              alt={sourceMovie.title}
              width={32}
              height={48}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Because you watched</p>
            <h3 className="text-white font-bold text-sm">{sourceMovie.title}</h3>
          </div>
        </div>
        <Link
          href={`/recommendations?source=${sourceMovie.id}`}
          className="text-xs text-gray-500 hover:text-primary-400 transition-colors flex items-center gap-1 font-medium"
        >
          See all <FiArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-2 px-2">
        {recommendations.map((movie, i) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="snap-start flex-shrink-0 w-[150px] group"
          >
            <Link href={movieUrl(movie)} className="block">
              <div className="relative w-[150px] h-[225px] rounded-xl overflow-hidden shadow-lg ring-1 ring-white/5 mb-2">
                <Image
                  src={movie.posterPath || movie.posterUrl || '/images/placeholder.jpg'}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {movie.voteAverage > 0 && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    <FiStar className="w-3 h-3" /> {movie.voteAverage.toFixed(1)}
                  </div>
                )}
                {/* Match score */}
                {movie.matchScore && (
                  <div className="absolute bottom-2 left-2 text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md">
                    {Math.round(movie.matchScore)}% Match
                  </div>
                )}
              </div>
              <p className="text-white text-xs font-bold truncate">{movie.title}</p>
              <p className="text-gray-500 text-[10px]">
                {movie.year || movie.releaseDate?.slice(0, 4)}
                {movie.genres?.[0] && ` · ${movie.genres[0].name}`}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── "Recommended For You" Section ───────────────────────────────
export function RecommendedForYou({ movies = [] }) {
  if (movies.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
          <FiZap className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">AI Powered</p>
          <h3 className="text-white font-bold text-sm">Recommended For You</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.slice(0, 12).map((movie, i) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className="group"
          >
            <Link href={movieUrl(movie)} className="block">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg ring-1 ring-white/5 mb-2">
                <Image
                  src={movie.posterPath || movie.posterUrl || '/images/placeholder.jpg'}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {movie.matchScore && (
                  <div className="absolute bottom-2 left-2 text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                    {Math.round(movie.matchScore)}% Match
                  </div>
                )}
              </div>
              <p className="text-white text-xs font-bold truncate">{movie.title}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Pro-Only Gate Banner ─────────────────────────────────────────
export function AIRecommendationsGate() {
  const { isPro } = useSubscription();
  if (isPro) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-black to-cyan-500/5 p-8 mb-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.15),_transparent_50%)]" />
      <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-purple-500/5 blur-2xl" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-purple-600/20 flex-shrink-0">
          <FiZap className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-black text-lg">AI-Powered Recommendations</h3>
            <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">PRO</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Get personalised &ldquo;Because you watched&rdquo; suggestions powered by our recommendation engine.
            Upgrade to Pro to unlock smart picks tailored to your taste.
          </p>
        </div>
        <Link
          href="/pricing"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm rounded-xl hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg shadow-purple-600/20 flex-shrink-0"
        >
          <FiLock className="w-4 h-4" /> Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}

// ─── Combined Data-Fetching Wrapper ──────────────────────────────
export default function AIRecommendations() {
  const { isAuthenticated } = useAuth();
  const { isPro } = useSubscription();

  const { data } = useQuery(GET_RECOMMENDATIONS, {
    skip: !isAuthenticated || !isPro,
    fetchPolicy: 'cache-first',
  });

  if (!isAuthenticated) return null;
  if (!isPro) return <AIRecommendationsGate />;

  const rows = data?.recommendations?.becauseYouWatched || [];
  const forYou = data?.recommendations?.forYou || [];

  return (
    <>
      {rows.map((row, i) => (
        <BecauseYouWatchedRow
          key={row.source?.id || i}
          sourceMovie={row.source}
          recommendations={row.items}
        />
      ))}
      <RecommendedForYou movies={forYou} />
    </>
  );
}
