// src/pages/help.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch, FiChevronDown, FiChevronRight, FiMail, FiMessageSquare,
    FiPlay, FiCreditCard, FiUser, FiShield, FiDownload, FiMonitor,
    FiHelpCircle, FiExternalLink, FiSend, FiCheck
} from 'react-icons/fi';

const FAQ_CATEGORIES = [
    {
        id: 'getting-started',
        icon: FiPlay,
        title: 'Getting Started',
        color: 'from-cyan-500 to-blue-500',
        questions: [
            {
                q: 'How do I create a clipX account?',
                a: 'Click "Get Started" on the homepage or navigate to the sign-up page. You can register with your email address or sign in instantly with Google.'
            },
            {
                q: 'Is clipX free to use?',
                a: 'Yes! clipX offers a comprehensive free experience with access to thousands of movies and series. Browse, stream, and build your watchlist at no cost.'
            },
            {
                q: 'What devices can I use clipX on?',
                a: 'clipX works on any modern web browser (Chrome, Firefox, Safari, Edge) and has a dedicated mobile app for iOS and Android. You can also install it as a PWA on your device.'
            },
            {
                q: 'How do I find movies to watch?',
                a: 'Use the search bar, browse by genre, check trending titles on your dashboard, or try our AI Assistant for personalized recommendations based on your mood.'
            },
        ]
    },
    {
        id: 'account',
        icon: FiUser,
        title: 'Account & Profile',
        color: 'from-violet-500 to-purple-500',
        questions: [
            {
                q: 'How do I change my password?',
                a: 'Go to Profile → Security section → Change Password. Enter your current password and set a new one (minimum 8 characters with at least one letter and one number).'
            },
            {
                q: 'How do I update my profile picture?',
                a: 'Navigate to your Profile page, click on the avatar area, and upload a new image. We support JPG, PNG, and WebP formats.'
            },
            {
                q: 'Can I delete my account?',
                a: 'Yes. Go to Profile → Danger Zone → Delete Account. This action is permanent and will remove all your data including watchlist, history, and reviews.'
            },
            {
                q: 'How do I verify my email?',
                a: 'After registration, we send a verification link to your email. Click it to verify. You can resend it from Profile → Email Verification if needed.'
            },
        ]
    },
    {
        id: 'streaming',
        icon: FiMonitor,
        title: 'Streaming & Playback',
        color: 'from-emerald-500 to-teal-500',
        questions: [
            {
                q: 'Why is the video buffering?',
                a: 'Buffering usually indicates a slow internet connection. Try switching to a lower quality in the player settings, closing other tabs or apps using bandwidth, or connecting to a faster network.'
            },
            {
                q: 'Can I download videos for offline viewing?',
                a: 'Yes! The download feature is available on the mobile app. Look for the download icon on any movie or episode detail page.'
            },
            {
                q: 'How do I enable subtitles?',
                a: 'Click the CC (Closed Captions) button in the video player controls. You can choose from available subtitle languages.'
            },
            {
                q: 'Does clipX support 4K streaming?',
                a: 'Quality depends on the source content availability. We serve the highest available quality automatically, with manual quality switching in the player.'
            },
        ]
    },
    {
        id: 'billing',
        icon: FiCreditCard,
        title: 'Billing & Payments',
        color: 'from-amber-500 to-orange-500',
        questions: [
            {
                q: 'What payment methods do you accept?',
                a: 'We accept payments through Paystack, which supports credit/debit cards (Visa, Mastercard), bank transfers, and mobile money across Africa.'
            },
            {
                q: 'How do I view my payment history?',
                a: 'Go to your Profile → Payment History section to see all past transactions, invoices, and subscription changes.'
            },
            {
                q: 'How do I cancel my subscription?',
                a: 'Navigate to Profile → Subscription → Cancel. You\'ll retain access until the end of your current billing period.'
            },
        ]
    },
    {
        id: 'security',
        icon: FiShield,
        title: 'Security & Privacy',
        color: 'from-red-500 to-pink-500',
        questions: [
            {
                q: 'How does clipX protect my data?',
                a: 'We use industry-standard encryption (HTTPS/TLS), secure httpOnly cookies for authentication, CSRF protection, input sanitization, and rate limiting to protect your account.'
            },
            {
                q: 'I received a "New sign-in detected" notification. What should I do?',
                a: 'If you don\'t recognize the sign-in, change your password immediately from Profile → Security. You can also view all active sessions and revoke any suspicious ones.'
            },
            {
                q: 'How do I report a security vulnerability?',
                a: 'Please email security concerns directly to support@clipx.app with the subject line "Security Report". We take all reports seriously and will respond within 24 hours.'
            },
        ]
    },
    {
        id: 'downloads',
        icon: FiDownload,
        title: 'Downloads & Offline',
        color: 'from-blue-500 to-indigo-500',
        questions: [
            {
                q: 'Where are my downloads stored?',
                a: 'On mobile, downloads are stored securely within the app\'s internal storage. You can view and manage them from the Downloads tab.'
            },
            {
                q: 'Do downloads expire?',
                a: 'Downloaded content may expire after a set period depending on licensing. You\'ll see expiry indicators on your downloaded content.'
            },
            {
                q: 'How much storage do downloads use?',
                a: 'Storage varies by quality: a typical movie is ~500MB at 720p and ~1.5GB at 1080p. Check your storage usage in the Downloads section.'
            },
        ]
    },
];

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [expandedQuestion, setExpandedQuestion] = useState(null);
    const [ticketForm, setTicketForm] = useState({ subject: '', message: '', email: '' });
    const [ticketStatus, setTicketStatus] = useState('idle');

    // Filter FAQs based on search
    const filteredCategories = searchQuery.trim()
        ? FAQ_CATEGORIES.map(cat => ({
            ...cat,
            questions: cat.questions.filter(
                q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     q.a.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(cat => cat.questions.length > 0)
        : FAQ_CATEGORIES;

    const handleTicketSubmit = async (e) => {
        e.preventDefault();
        if (!ticketForm.subject || !ticketForm.message || !ticketForm.email) return;
        setTicketStatus('sending');
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || 'http://localhost:8000';
            const res = await fetch(`${baseUrl}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Help Centre Ticket',
                    email: ticketForm.email,
                    category: 'Technical Support',
                    message: `[${ticketForm.subject}]\n\n${ticketForm.message}`,
                }),
            });
            if (!res.ok) throw new Error('Failed');
            setTicketStatus('success');
            setTicketForm({ subject: '', message: '', email: '' });
            setTimeout(() => setTicketStatus('idle'), 5000);
        } catch {
            setTicketStatus('error');
            setTimeout(() => setTicketStatus('idle'), 4000);
        }
    };

    return (
        <>
            <Head>
                <title>Help Centre - clipX</title>
                <meta name="description" content="Get help with clipX. Browse FAQs, troubleshoot issues, or contact our support team." />
            </Head>

            <div className="min-h-screen pt-28 pb-20 px-4 md:px-12">
                <div className="max-w-5xl mx-auto">
                    {/* Hero */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-semibold mb-6">
                            <FiHelpCircle className="w-4 h-4" />
                            Help Centre
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                            How can we help?
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
                            Search our knowledge base or browse categories below.
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-xl mx-auto">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for answers…"
                                id="help-search"
                                className="w-full bg-white/5 text-white pl-12 pr-4 py-4 rounded-2xl border border-white/10 focus:border-primary-500 focus:outline-none transition-all text-lg placeholder-gray-500"
                            />
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-wrap justify-center gap-3 mb-14"
                    >
                        <QuickLink href="/contact" icon={FiMail} label="Contact Us" />
                        <QuickLink href="/report" icon={FiMessageSquare} label="Report Issue" />
                        <QuickLink href="/privacy" icon={FiShield} label="Privacy Policy" />
                        <QuickLink href="/terms" icon={FiExternalLink} label="Terms of Service" />
                    </motion.div>

                    {/* Category Grid */}
                    {!searchQuery && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-14"
                        >
                            {FAQ_CATEGORIES.map((cat, i) => (
                                <motion.button
                                    key={cat.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05 }}
                                    onClick={() => {
                                        setActiveCategory(activeCategory === cat.id ? null : cat.id);
                                        setExpandedQuestion(null);
                                    }}
                                    className={`group relative p-5 rounded-2xl border text-left transition-all duration-300 ${
                                        activeCategory === cat.id
                                            ? 'bg-white/10 border-primary-500/50 shadow-lg shadow-primary-500/10'
                                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                                    }`}
                                    id={`help-category-${cat.id}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} bg-opacity-20 flex items-center justify-center mb-3`}>
                                        <cat.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <p className="text-white font-bold text-sm">{cat.title}</p>
                                    <p className="text-gray-500 text-xs mt-1">{cat.questions.length} articles</p>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}

                    {/* FAQ Accordion */}
                    <div className="space-y-4 mb-20">
                        {filteredCategories
                            .filter(cat => searchQuery || !activeCategory || activeCategory === cat.id)
                            .map((cat) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass-card rounded-2xl overflow-hidden"
                            >
                                <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                                    <cat.icon className="w-5 h-5 text-primary-400" />
                                    <h2 className="text-white font-bold">{cat.title}</h2>
                                    <span className="text-xs text-gray-500 ml-auto">{cat.questions.length} questions</span>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {cat.questions.map((faq, qi) => {
                                        const key = `${cat.id}-${qi}`;
                                        const isOpen = expandedQuestion === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setExpandedQuestion(isOpen ? null : key)}
                                                className="w-full text-left px-6 py-4 hover:bg-white/[0.02] transition-colors"
                                                id={`faq-${cat.id}-${qi}`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <span className={`text-sm font-semibold transition-colors ${isOpen ? 'text-primary-400' : 'text-gray-200'}`}>
                                                        {faq.q}
                                                    </span>
                                                    <motion.div
                                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="flex-shrink-0 mt-0.5"
                                                    >
                                                        <FiChevronDown className={`w-4 h-4 ${isOpen ? 'text-primary-400' : 'text-gray-500'}`} />
                                                    </motion.div>
                                                </div>
                                                <AnimatePresence>
                                                    {isOpen && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <p className="text-gray-400 text-sm leading-relaxed mt-3 pr-8">
                                                                {faq.a}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ))}

                        {filteredCategories.length === 0 && searchQuery && (
                            <div className="text-center py-16">
                                <FiSearch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg font-semibold">No results found</p>
                                <p className="text-gray-500 text-sm mt-1">
                                    Try searching with different keywords or{' '}
                                    <button onClick={() => setSearchQuery('')} className="text-primary-400 hover:underline">
                                        browse all categories
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Support Ticket Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Still need help?</h2>
                            <p className="text-gray-400">
                                Submit a support ticket and we&apos;ll get back to you within 24 hours.
                                You can also email us directly at{' '}
                                <a href="mailto:support@clipx.app" className="text-primary-400 hover:text-primary-300 transition-colors font-semibold">
                                    support@clipx.app
                                </a>
                            </p>
                        </div>

                        <form onSubmit={handleTicketSubmit} className="glass-card rounded-2xl p-8 space-y-5" id="support-ticket-form">
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Your Email</label>
                                <input
                                    type="email"
                                    value={ticketForm.email}
                                    onChange={(e) => setTicketForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="you@example.com"
                                    required
                                    id="ticket-email"
                                    className="w-full bg-white/5 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Subject</label>
                                <input
                                    type="text"
                                    value={ticketForm.subject}
                                    onChange={(e) => setTicketForm(f => ({ ...f, subject: e.target.value }))}
                                    placeholder="Brief description of your issue"
                                    required
                                    id="ticket-subject"
                                    className="w-full bg-white/5 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Message</label>
                                <textarea
                                    value={ticketForm.message}
                                    onChange={(e) => setTicketForm(f => ({ ...f, message: e.target.value }))}
                                    rows={5}
                                    placeholder="Describe your issue in detail…"
                                    required
                                    id="ticket-message"
                                    className="w-full bg-white/5 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none transition-colors resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={ticketStatus === 'sending'}
                                id="ticket-submit"
                                className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
                            >
                                {ticketStatus === 'sending' ? 'Sending…'
                                    : ticketStatus === 'success' ? <><FiCheck /> Ticket Submitted!</>
                                    : <><FiSend /> Submit Support Ticket</>}
                            </button>

                            {ticketStatus === 'error' && (
                                <p className="text-red-400 text-sm text-center">
                                    Failed to submit. Please email us directly at support@clipx.app
                                </p>
                            )}
                            {ticketStatus === 'success' && (
                                <p className="text-green-400 text-sm text-center">
                                    We&apos;ve received your ticket! Check your email for a confirmation.
                                </p>
                            )}
                        </form>
                    </motion.div>
                </div>
            </div>
        </>
    );
}

function QuickLink({ href, icon: Icon, label }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
        >
            <Icon className="w-4 h-4" />
            {label}
        </Link>
    );
}
