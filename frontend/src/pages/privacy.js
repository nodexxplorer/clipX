// src/pages/privacy.js
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiShield } from 'react-icons/fi';

const LAST_UPDATED = 'February 27, 2026';

const sections = [
    {
        title: '1. Information We Collect',
        content: `We collect the following types of information:

• Account Information: email address, name, profile picture, and preferences you provide during registration.
• Usage Data: pages visited, movies watched, search queries, watch progress, and interaction patterns to improve recommendations.
• Device Information: browser type, OS, screen resolution, and IP address for security and analytics.
• Cookies & Local Storage: we use cookies and localStorage to maintain your session, preferences, and watch history.`,
    },
    {
        title: '2. How We Use Your Information',
        content: `We use your information to:

• Provide and personalize the Service (AI-powered recommendations, watchlist sync).
• Maintain your account and watch progress across devices.
• Improve the platform through usage analytics (anonymized aggregates only).
• Send important service updates (never marketing spam unless you opt in).
• Prevent fraud and abuse.`,
    },
    {
        title: '3. Information Sharing',
        content: `We do NOT sell, rent, or trade your personal data. We may share information with:

• Service Providers: hosting, analytics, and CDN providers who help us operate clipX (all under DPA agreements).
• Legal Requirements: if required by law or to protect our rights and users' safety.
• With Your Consent: only when you explicitly agree.`,
    },
    {
        title: '4. Data Security',
        content: `We implement industry-standard security measures including password hashing (bcrypt), HTTPS-only connections, JWT token authentication, and regular security audits. However, no method of transmission over the Internet is 100% secure — we cannot guarantee absolute security.`,
    },
    {
        title: '5. Your Rights',
        content: `Depending on your location, you may have the right to:

• Access the personal data we hold about you.
• Correct inaccurate or incomplete data.
• Delete your account and associated data.
• Export your data in a portable format.
• Opt out of analytics and personalized recommendations.

To exercise these rights, contact us at support@clipx.app or use the Settings in your profile.`,
    },
    {
        title: '6. Data Retention',
        content: `We retain your data for as long as your account is active. If you delete your account, we remove your personal data within 30 days, except where retention is required by law. Anonymized usage analytics may be retained indefinitely.`,
    },
    {
        title: '7. Third-Party Services',
        content: `clipX integrates with third-party services including Google OAuth (for authentication), ImgBB (for avatar hosting), and TMDb (for movie metadata). Each has their own privacy policy. We encourage you to review them.`,
    },
    {
        title: '8. Children\'s Privacy',
        content: `clipX is not intended for users under 13 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.`,
    },
    {
        title: '9. Changes to This Policy',
        content: `We may update this Privacy Policy from time to time. We will notify registered users of significant changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance.`,
    },
    {
        title: '10. Contact Us',
        content: `For privacy-related questions or data requests, contact us at:
Email: privacy@clipx.app
Or use our Contact page.`,
    },
];

export default function PrivacyPage() {
    return (
        <>
            <Head>
                <title>Privacy Policy - clipX</title>
                <meta name="description" content="Learn how clipX collects, uses, and protects your personal data." />
            </Head>

            <div className="min-h-screen pt-28 pb-24 px-4 md:px-12">
                <div className="max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                                <FiShield className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">Privacy Policy</h1>
                                <p className="text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="space-y-8">
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

                    <div className="mt-12 text-center text-sm text-gray-500">
                        See also: <Link href="/terms" className="text-primary-400 hover:text-primary-300">Terms of Service</Link> • <Link href="/cookies" className="text-primary-400 hover:text-primary-300">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </>
    );
}
