// src/pages/index.js

/**
 * Landing Page — clipX Home
 * Premium streaming landing with hero, trending, features, genres, and CTA
 */

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { motion, useInView } from 'framer-motion';
import {
  FiChevronRight, FiPlay, FiZap, FiGlobe, FiShield,
  FiDownload, FiSmartphone, FiTrendingUp, FiClock, FiHeart
} from 'react-icons/fi';

import MovieHero from '@/components/movies/MovieHero';
import MovieRow from '@/components/movies/MovieRow';
import GenreGrid from '@/components/home/GenreGrid';
import PersonalizedRecommendations from '@/components/recommendations/PersonalizedRecommendations';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

import { useAuth } from '@/contexts/AuthContext';
import { GET_HOME_PAGE_DATA, GET_TRENDING_SERIES } from '@/graphql/queries/movieQueries';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const FEATURES = [
  {
    icon: FiZap,
    title: 'AI Recommendations',
    desc: 'Our ML engine learns your taste and surfaces movies you\'ll actually love.',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    icon: FiGlobe,
    title: 'Stream Anywhere',
    desc: 'Watch on any device — phone, tablet, laptop, or TV. No limits.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    icon: FiDownload,
    title: 'Download & Go',
    desc: 'Save movies for offline viewing. Perfect for flights and commutes.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: FiShield,
    title: 'Ad-Free & Secure',
    desc: 'No pop-ups, no trackers. Just pure cinema in a secure environment.',
    color: 'from-orange-500 to-red-600',
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [featuredMovie, setFeaturedMovie] = useState(null);

  const { data, loading, error } = useQuery(GET_HOME_PAGE_DATA, {
    variables: { trendingLimit: 20, popularLimit: 20 }
  });

  const { data: seriesData } = useQuery(GET_TRENDING_SERIES, {
    variables: { limit: 20 }
  });

  useEffect(() => {
    if (data?.trending?.length > 0) {
      const bestMovies = data.trending.filter(m => m.backdropPath && m.overview);
      const pool = bestMovies.length > 0 ? bestMovies : data.trending;
      const randomIndex = Math.floor(Math.random() * Math.min(10, pool.length));
      setFeaturedMovie(pool[randomIndex]);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050607]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-primary-500 font-black uppercase tracking-[0.5em] animate-pulse">clipX Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message="Oops! Failed to load the cinematic experience."
        retry={() => window.location.reload()}
      />
    );
  }

  const { trending, popular, genres } = data || {};
  const trendingSeries = seriesData?.trendingSeries || [];

  return (
    <div className="bg-[#050607] min-h-screen overflow-x-hidden">
      <Head>
        <title>clipX | Stream Smarter</title>
        <meta name="description" content="Discover and stream the world's best movies and series on clipX. AI-powered recommendations, ad-free streaming, offline downloads." />
      </Head>

      {/* Hero */}
      {featuredMovie && <MovieHero movie={featuredMovie} />}

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 -mt-8 md:-mt-16 pb-24"
      >
        {/* Trending Row */}
        <MovieRow title="Trending Now" movies={trending} />

        {/* AI Recommendations (authenticated users) */}
        {isAuthenticated && (
          <div className="mb-16 px-4 md:px-12 mx-auto w-full">
            <PersonalizedRecommendations userId={user?.id} limit={15} />
          </div>
        )}

        {/* Top Rated */}
        <MovieRow title="Top Rated Hits" movies={popular} />

        {/* Series Row */}
        {trendingSeries.length > 0 && (
          <MovieRow title="Binge-worthy Series" movies={trendingSeries} variant="series" />
        )}

        {/* ═══ Features Section ═══ */}
        <FeaturesSection />

        {/* ═══ How It Works ═══ */}
        <HowItWorksSection />

        {/* ═══ Stats Counter ═══ */}
        <StatsCounter />

        {/* Join CTA (guests only) */}
        {!isAuthenticated && <JoinBanner />}

        {/* Quick Access Grid */}
        <QuickAccessGrid />

        {/* Recently Added link */}
        <div className="px-4 md:px-12 mb-8">
          <Link
            href="/movies/recent"
            className="group flex items-center justify-between glass-card rounded-2xl p-6 md:p-8 hover:border-primary-500/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <FiClock className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">New &amp; Recent</h3>
                <p className="text-gray-400 text-sm">Discover the latest additions to clipX</p>
              </div>
            </div>
            <FiChevronRight className="w-6 h-6 text-gray-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Genre Grid */}
        <section className="px-4 md:px-12 mt-8">
          <SectionHeader title="Explore Genres" href="/genres" />
          <GenreGrid genres={genres} />
        </section>

        {/* ═══ FAQ Section ═══ */}
        <FAQSection />
      </motion.main>
    </div>
  );
}

/* ──────────────────── Sub-components ──────────────────── */

function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="px-4 md:px-12 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
          Why clipX?
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Built for cinephiles who deserve more than just another streaming app.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
            className="group glass-card rounded-2xl p-7 hover:scale-[1.03] transition-all duration-300 cursor-default"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
              <f.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function StatsCounter() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const stats = [
    { label: 'Movies & Series', value: 10000, suffix: '+' },
    { label: 'Active Users', value: 50000, suffix: '+' },
    { label: 'Genres', value: 25, suffix: '' },
    { label: 'Countries', value: 190, suffix: '+' },
  ];

  return (
    <section ref={ref} className="px-4 md:px-12 py-16">
      <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
            className="text-center py-8"
          >
            <p className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cyan-400 tabular-nums">
              {isInView ? <CountUp target={s.value} /> : 0}{s.suffix}
            </p>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CountUp({ target }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000; // ms
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return <>{count.toLocaleString()}</>;
}

function JoinBanner() {
  return (
    <div className="px-4 md:px-12 mb-16">
      <div className="relative overflow-hidden rounded-2xl group">
        {/* Animated gradient BG */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-700 opacity-90 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5 mix-blend-overlay" />

        <div className="relative p-10 md:p-20 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase italic tracking-tighter">
              Don&apos;t Miss Out
            </h2>
            <p className="text-primary-100 text-xl font-medium max-w-xl leading-relaxed">
              Join our community of movie enthusiasts and unlock AI-powered recommendations tailored just for you.
            </p>
            <div className="flex flex-wrap gap-4 mt-8 justify-center md:justify-start">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <FiZap className="text-yellow-300" /> AI Recommendations
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <FiSmartphone className="text-green-300" /> All Devices
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <FiShield className="text-blue-300" /> No Ads
              </div>
            </div>
          </div>
          <Link
            href="/auth/register"
            className="px-12 py-5 bg-white text-black font-black uppercase rounded-xl shadow-2xl hover:scale-110 transition-transform active:scale-95 flex items-center gap-2"
          >
            <FiPlay className="fill-current" />
            Start Streaming Free
          </Link>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, href }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center text-primary-400 hover:text-primary-300 font-bold uppercase text-sm tracking-widest transition-all group"
        >
          View All <FiChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}

/* ─── How It Works ────────────────────────────── */
function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const steps = [
    { num: '01', title: 'Search & Discover', desc: 'Browse thousands of movies, series, and anime. Our AI will learn your taste.', color: 'from-primary-500 to-cyan-500' },
    { num: '02', title: 'Stream Instantly', desc: 'Hit play and enjoy HD streaming — no buffering, no ads, no interruptions.', color: 'from-purple-500 to-pink-500' },
    { num: '03', title: 'Download & Share', desc: 'Save for offline. Watch on-the-go. Share recommendations with friends.', color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <section ref={ref} className="px-4 md:px-12 py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="text-center mb-14">
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">How It Works</h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">Three steps to your next movie night</p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="relative glass-card rounded-2xl p-8 text-center group hover:scale-[1.03] transition-transform"
          >
            <div className={`text-7xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-20 group-hover:opacity-40 transition-opacity mb-4`}>
              {step.num}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
            {i < 2 && (
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-white/20 to-transparent" />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── Quick Access Grid ───────────────────────── */
function QuickAccessGrid() {
  const links = [
    { icon: FiPlay, title: 'Browse Movies', desc: 'Explore our full catalog', href: '/movies', color: 'bg-primary-500/10 text-primary-400' },
    { icon: FiTrendingUp, title: 'Trending Series', desc: 'Binge-worthy picks', href: '/series', color: 'bg-purple-500/10 text-purple-400' },
    { icon: FiZap, title: 'Anime', desc: 'Top anime collection', href: '/anime', color: 'bg-pink-500/10 text-pink-400' },
    { icon: FiHeart, title: 'Watchlist', desc: 'Your saved favorites', href: '/watchlist', color: 'bg-red-500/10 text-red-400' },
    { icon: FiDownload, title: 'Download Guide', desc: 'How to download content', href: '/guide', color: 'bg-green-500/10 text-green-400' },
    { icon: FiClock, title: 'New Releases', desc: 'Just added to clipX', href: '/movies/recent', color: 'bg-amber-500/10 text-amber-400' },
  ];

  return (
    <section className="px-4 md:px-12 py-12">
      <SectionHeader title="Quick Access" />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {links.map((link, i) => (
          <Link key={i} href={link.href}>
            <motion.div
              whileHover={{ scale: 1.04, y: -4 }}
              className="glass-card rounded-2xl p-5 flex flex-col items-center text-center gap-3 cursor-pointer hover:border-white/20 transition-all h-full"
            >
              <div className={`w-12 h-12 rounded-xl ${link.color} flex items-center justify-center`}>
                <link.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-0.5">{link.title}</h3>
                <p className="text-[11px] text-gray-500 leading-tight">{link.desc}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ─── FAQ Section ─────────────────────────────── */
const FAQ_ITEMS = [
  { q: 'Is clipX free to use?', a: 'Yes! clipX is completely free. Create an account and start streaming instantly — no credit card, no trials, no hidden fees.' },
  { q: 'What devices can I stream on?', a: 'clipX works on all modern browsers — Chrome, Firefox, Safari, Edge — on desktop, tablet, and mobile. No app download required.' },
  { q: 'Can I download movies for offline viewing?', a: 'Absolutely. Click the download button on any movie or series page and choose your preferred quality (480p to 4K).' },
  { q: 'How do AI recommendations work?', a: 'Our recommendation engine analyzes your watch history, ratings, and preferences to surface movies and series you\'re most likely to enjoy.' },
  { q: 'Is my data safe?', a: 'We take privacy seriously. Your data is encrypted, never sold, and you can delete your account and data at any time. See our Privacy Policy for details.' },
  { q: 'How do I report a broken link or issue?', a: 'Use the Report page accessible from the footer, or click the report button on any movie page. Our team reviews reports within 24 hours.' },
];

function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="px-4 md:px-12 py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="text-center mb-12">
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">Frequently Asked Questions</h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">Got questions? We&apos;ve got answers.</p>
      </motion.div>
      <div className="max-w-3xl mx-auto space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.05 * i }}
            className="glass-card rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span className="text-white font-bold text-sm md:text-base pr-4">{item.q}</span>
              <FiChevronRight className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${openIdx === i ? 'rotate-90' : ''}`} />
            </button>
            <motion.div
              initial={false}
              animate={{ height: openIdx === i ? 'auto' : 0, opacity: openIdx === i ? 1 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <p className="px-5 pb-5 text-gray-400 text-sm leading-relaxed">{item.a}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}