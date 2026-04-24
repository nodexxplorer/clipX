// src/pages/cookies.js
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiInfo } from 'react-icons/fi';

const LAST_UPDATED = 'April 2026';

const COOKIES_TABLE = [
    {
        name: 'auth_token',
        type: 'Essential',
        duration: '15 minutes',
        purpose: 'Short-lived httpOnly access token. Set by the server on login. JavaScript cannot read this cookie.',
    },
    {
        name: 'refresh_token',
        type: 'Essential',
        duration: '30 days',
        purpose: 'Long-lived httpOnly refresh token scoped to /api/auth/refresh. Used to silently issue new access tokens. JavaScript cannot read this cookie.',
    },
    {
        name: 'clipx_cookie_consent',
        type: 'Essential',
        duration: 'Persistent',
        purpose: 'Stores your cookie consent choice so the banner does not appear on every visit.',
    },
    {
        name: 'theme',
        type: 'Preference',
        duration: 'Persistent',
        purpose: 'Remembers your light/dark mode choice.',
    },
    {
        name: 'clipx_volume',
        type: 'Preference',
        duration: 'Persistent (localStorage)',
        purpose: 'Remembers your last-used player volume level.',
    },
    {
        name: 'clipx_history',
        type: 'Functional (localStorage)',
        duration: 'Persistent',
        purpose: 'Stores your local watch history for the Continue Watching feature.',
    },
    {
        name: 'clipx_watch_*',
        type: 'Functional (localStorage)',
        duration: 'Persistent',
        purpose: 'Individual progress snapshots for each video you have watched.',
    },
    {
        name: '_ga / _gid',
        type: 'Analytics',
        duration: '2 years / 24h',
        purpose: 'Google Analytics cookies for anonymised usage statistics (only if you accepted analytics cookies).',
    },
];

const sections = [
    {
        title: 'What Are Cookies?',
        content: `Cookies are small files stored on your device by your browser. clipX uses two kinds of storage:\n\n• httpOnly Cookies — set by our server and completely inaccessible to JavaScript. These store your authentication tokens so that no malicious script can steal them.\n\n• localStorage — a browser API used only for non-sensitive preferences such as your player volume and local watch history.`,
    },
    {
        title: 'How We Use Cookies',
        content: `• Authentication — two short-lived httpOnly cookies (auth_token, refresh_token) keep you signed in securely. They are never exposed to the page's JavaScript.\n• Preferences — theme and player volume stored in localStorage.\n• Watch Progress — your viewing history saved locally for the Continue Watching row.\n• Analytics — anonymised usage data, only if you accepted analytics cookies.`,
    },
    {
        title: 'Managing Cookies',
        content: `You can control cookies through your browser settings. Most browsers allow you to:\n• View and delete existing cookies\n• Block all or third-party cookies\n• Set rules for specific websites\n\nNote: Blocking the auth_token and refresh_token cookies will prevent you from staying logged in. All other features will still work without cookies.`,
    },
    {
        title: 'Third-Party Cookies',
        content: `Some third-party services we use may set their own cookies:\n• Google OAuth — for authentication (google.com cookies)\n• Google Analytics — for anonymised traffic data (if you enabled analytics)\n• Paystack — payment processing\n\nWe do not control these cookies. Please review the respective privacy policies of these services.`,
    },
    {
        title: 'Security Note',
        content: `Our authentication cookies are set with httpOnly=true, Secure=true (HTTPS only), and SameSite=Lax. This means:\n• JavaScript on the page — including any browser extension — cannot read them.\n• They are not sent on cross-origin requests unless you initiate them.\n• They automatically expire after 15 minutes (access token) or 30 days (refresh token).\n\nThis design is intentionally more secure than storing tokens in localStorage.`,
    },
];

export default function CookiesPage() {
    return (
        <>
            <Head>
                <title>Cookie Policy — clipX</title>
                <meta name="description" content="Learn how clipX uses httpOnly cookies and localStorage for authentication and preferences." />
            </Head>

            <div className="min-h-screen pt-28 pb-24 px-4 md:px-12">
                <div className="max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                <FiInfo className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">
                                    Cookie Policy
                                </h1>
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
                            Cookies &amp; Storage We Use
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
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                                                <td className="px-6 py-4 text-primary-400 font-mono text-xs whitespace-nowrap">{c.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                                        c.type.startsWith('Essential')  ? 'bg-red-500/10 text-red-400'    :
                                                        c.type.startsWith('Preference') ? 'bg-blue-500/10 text-blue-400'  :
                                                        c.type.startsWith('Functional') ? 'bg-green-500/10 text-green-400':
                                                                                          'bg-amber-500/10 text-amber-400'
                                                    }`}>
                                                        {c.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 hidden md:table-cell whitespace-nowrap">{c.duration}</td>
                                                <td className="px-6 py-4 text-gray-400 text-xs leading-relaxed">{c.purpose}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>

                    <div className="text-center text-sm text-gray-500">
                        See also:{' '}
                        <Link href="/terms" className="text-primary-400 hover:text-primary-300">Terms of Service</Link>
                        {' '}•{' '}
                        <Link href="/privacy" className="text-primary-400 hover:text-primary-300">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </>
    );
}