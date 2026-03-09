// src/pages/terms.js
import Head from 'next/head';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiFileText } from 'react-icons/fi';

const LAST_UPDATED = 'February 27, 2026';

const sections = [
    {
        title: '1. Acceptance of Terms',
        content: `By accessing or using clipX ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Service. clipX reserves the right to modify these terms at any time without prior notice.`,
    },
    {
        title: '2. User Accounts',
        content: `To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You must provide accurate information and keep it up to date. clipX reserves the right to suspend or terminate accounts that violate these terms.`,
    },
    {
        title: '3. Content & Streaming',
        content: `clipX provides streaming links and metadata for educational and informational purposes. We do not host, upload, or distribute any copyrighted material on our servers. All streaming links are sourced from third-party providers. Users are responsible for ensuring their use complies with their local laws and regulations.`,
    },
    {
        title: '4. Acceptable Use',
        content: `You agree not to: (a) use the Service for any unlawful purpose; (b) distribute malicious software; (c) attempt to gain unauthorized access to our systems; (d) interfere with other users' enjoyment of the Service; (e) use automated scripts or bots to scrape content; (f) resell or redistribute any Service content.`,
    },
    {
        title: '5. Intellectual Property',
        content: `The clipX name, logo, design, and original content are owned by clipX and are protected by intellectual property laws. Movie metadata, posters, and descriptions may be provided by TMDb (The Movie Database) and are used under their API terms. Third-party trademarks belong to their respective owners.`,
    },
    {
        title: '6. Privacy',
        content: `Your privacy is important to us. Please review our Privacy Policy, which governs how we collect, use, and share your information. By using clipX, you consent to the practices described in our Privacy Policy.`,
    },
    {
        title: '7. Disclaimers',
        content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. clipX DOES NOT GUARANTEE UNINTERRUPTED ACCESS, BUG-FREE OPERATION, OR THE AVAILABILITY OF ANY SPECIFIC CONTENT. YOUR USE OF THE SERVICE IS AT YOUR OWN RISK.`,
    },
    {
        title: '8. Limitation of Liability',
        content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, clipX SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, PROFITS, OR BUSINESS OPPORTUNITIES.`,
    },
    {
        title: '9. Modifications',
        content: `clipX reserves the right to modify or discontinue the Service at any time. We may also update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms.`,
    },
    {
        title: '10. Contact',
        content: `If you have questions about these Terms, please contact us at support@clipx.app or use our Contact page.`,
    },
];

export default function TermsPage() {
    return (
        <>
            <Head>
                <title>Terms of Service - clipX</title>
                <meta name="description" content="Read the clipX Terms of Service and user agreement." />
            </Head>
            <LegalPageLayout
                icon={FiFileText}
                title="Terms of Service"
                lastUpdated={LAST_UPDATED}
                sections={sections}
            />
        </>
    );
}

function LegalPageLayout({ icon: Icon, title, lastUpdated, sections }) {
    return (
        <div className="min-h-screen pt-28 pb-24 px-4 md:px-12">
            <div className="max-w-3xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-primary-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">{title}</h1>
                            <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
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
                    See also: <Link href="/privacy" className="text-primary-400 hover:text-primary-300">Privacy Policy</Link> • <Link href="/cookies" className="text-primary-400 hover:text-primary-300">Cookie Policy</Link>
                </div>
            </div>
        </div>
    );
}
