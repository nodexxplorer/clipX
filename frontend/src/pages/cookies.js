// src/pages/cookies.js
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiInfo } from 'react-icons/fi';

const LAST_UPDATED = 'February 27, 2026';

const COOKIES_TABLE = [
    { name: 'token', type: 'Essential', duration: 'Session / 7 days', purpose: 'Stores your authentication JWT so you stay logged in.' },
    { name: 'theme', type: 'Preference', duration: 'Persistent', purpose: 'Remembers your light/dark mode choice.' },
    { name: 'reducedMotion', type: 'Preference', duration: 'Persistent', purpose: 'Stores your reduced-motion accessibility preference.' },
    { name: 'clipx_avatar', type: 'Preference', duration: 'Persistent', purpose: 'Caches your profile avatar locally for faster load.' },
    { name: 'clipx_history', type: 'Functional', duration: 'Persistent', purpose: 'Stores your watch history for the Continue Watching feature.' },
    { name: 'clipx_watch_*', type: 'Functional', duration: 'Persistent', purpose: 'Individual progress for each video you watch.' },
    { name: '_ga / _gid', type: 'Analytics', duration: '2 years / 24h', purpose: 'Google Analytics cookies for anonymous usage statistics (if enabled).' },
];

const sections = [
    {
        title: 'What Are Cookies?',
        content: `Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience. clipX also uses localStorage (a browser storage API) for performance-critical data like watch progress.`,
    },
    {
        title: 'How We Use Cookies',
        content: `We use cookies and local storage for:
• Authentication — keeping you logged in across sessions.
• Preferences — remembering theme, accessibility, and language settings.
• Watch Progress — saving where you left off in a movie or series.
• Analytics — understanding how users interact with the platform (anonymized).`,
    },
    {
        title: 'Managing Cookies',
        content: `You can control cookies through your browser settings. Most browsers allow you to:
• View and delete existing cookies
• Block all or third-party cookies
• Set rules for specific websites

Note: Blocking essential cookies may prevent you from logging in or saving watch progress. clipX will still function in a limited capacity without cookies.`,
    },
    {
        title: 'Third-Party Cookies',
        content: `Some third-party services we use may set their own cookies:
• Google OAuth: for authentication (google.com cookies)
• Google Analytics: for anonymized traffic data (if enabled)
We do not control these cookies. Please review the respective privacy policies of these services.`,
    },
];

export default function CookiesPage() {
    return (
        <>
            <Head>
                <title>Cookie Policy - clipX</title>
                <meta name="description" content="Learn about how clipX uses cookies and local storage." />
            </Head>

            <div className="min-h-screen pt-28 pb-24 px-4 md:px-12">
                <div className="max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                <FiInfo className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Cookie Policy</h1>
                                <p className="text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Sections */}
                    <div className="space-y-8 mb-12">
                        {sections.map((s, i) => (
                            <motion.section
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                                className="glass-card rounded-2xl p-6"
                            >
                                <h2 className="text-lg font-bold text-white mb-3">{s.title}</h2>
                                <p className="text-gray-400 leading-relaxed text-sm whitespace-pre-line">{s.content}</p>
                            </motion.section>
                        ))}
                    </div>

                    {/* Cookies Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-12"
                    >
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-6">
                            Cookies We Use
                        </h2>
                        <div className="glass-card rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left px-6 py-4 text-gray-400 font-bold uppercase tracking-widest text-xs">Name</th>
                                            <th className="text-left px-6 py-4 text-gray-400 font-bold uppercase tracking-widest text-xs">Type</th>
                                            <th className="text-left px-6 py-4 text-gray-400 font-bold uppercase tracking-widest text-xs hidden md:table-cell">Duration</th>
                                            <th className="text-left px-6 py-4 text-gray-400 font-bold uppercase tracking-widest text-xs">Purpose</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {COOKIES_TABLE.map((c, i) => (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                                <td className="px-6 py-4 text-primary-400 font-mono text-xs">{c.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.type === 'Essential' ? 'bg-red-500/10 text-red-400' :
                                                            c.type === 'Preference' ? 'bg-blue-500/10 text-blue-400' :
                                                                c.type === 'Functional' ? 'bg-green-500/10 text-green-400' :
                                                                    'bg-amber-500/10 text-amber-400'
                                                        }`}>
                                                        {c.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 hidden md:table-cell">{c.duration}</td>
                                                <td className="px-6 py-4 text-gray-400">{c.purpose}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>

                    <div className="text-center text-sm text-gray-500">
                        See also: <Link href="/terms" className="text-primary-400 hover:text-primary-300">Terms of Service</Link> • <Link href="/privacy" className="text-primary-400 hover:text-primary-300">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </>
    );
}
