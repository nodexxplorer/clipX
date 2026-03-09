// src/pages/guide.js
import Head from 'next/head';
import { motion } from 'framer-motion';
import { FiDownload, FiMonitor, FiSmartphone, FiGlobe, FiWifi, FiCheck, FiAlertCircle } from 'react-icons/fi';

const STEPS = [
    {
        icon: FiGlobe,
        title: 'Find Your Content',
        desc: 'Browse movies or series, then open the detail page of the title you want to download.',
    },
    {
        icon: FiDownload,
        title: 'Click Download',
        desc: 'Hit the Download button. You\'ll see available quality options — 480p, 720p, 1080p, or 4K.',
    },
    {
        icon: FiCheck,
        title: 'Pick a Quality',
        desc: 'Select the resolution you prefer. Higher quality means larger file size but better picture.',
    },
    {
        icon: FiWifi,
        title: 'Wait for Download',
        desc: 'Your download will begin immediately. Make sure you have a stable internet connection.',
    },
];

const PLATFORMS = [
    { icon: FiMonitor, name: 'Desktop', desc: 'Chrome, Firefox, Edge on Windows, macOS, or Linux.' },
    { icon: FiSmartphone, name: 'Mobile', desc: 'Use Safari (iOS) or Chrome (Android). Some browsers may require a download manager.' },
];

const TIPS = [
    'Use Wi-Fi for large files to avoid mobile data charges.',
    '720p is the best balance between quality and file size.',
    'For series, you can download individual episodes.',
    'Downloaded files are typically MP4 format — compatible with all devices.',
    'If a download fails, try refreshing the page and clicking Download again.',
    'Some titles may not be available for download due to licensing.',
];

export default function DownloadGuidePage() {
    return (
        <>
            <Head>
                <title>Download Guide - clipX</title>
                <meta name="description" content="Learn how to download movies and series from clipX to watch offline." />
            </Head>

            <div className="min-h-screen pt-28 pb-20 px-4 md:px-12">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
                        <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-6">
                            <FiDownload className="w-8 h-8 text-primary-500" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
                            Download Guide
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl mx-auto">
                            Follow these simple steps to download movies and series for offline viewing.
                        </p>
                    </motion.div>

                    {/* Steps */}
                    <div className="space-y-6 mb-16">
                        {STEPS.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + i * 0.1 }}
                                className="glass-card rounded-2xl p-6 flex items-start gap-5"
                            >
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black text-lg">
                                        {i + 1}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                                    <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Supported Platforms */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mb-16"
                    >
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-6">
                            Supported Platforms
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {PLATFORMS.map((p, i) => (
                                <div key={i} className="glass-card rounded-2xl p-6 flex items-start gap-4">
                                    <p.icon className="w-8 h-8 text-primary-500 flex-shrink-0 mt-1" />
                                    <div>
                                        <h3 className="text-white font-bold mb-1">{p.name}</h3>
                                        <p className="text-gray-400 text-sm">{p.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Tips */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-6">
                            Tips & Notes
                        </h2>
                        <div className="glass-card rounded-2xl p-6 space-y-4">
                            {TIPS.map((tip, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <FiAlertCircle className="w-4 h-4 text-primary-500 mt-1 flex-shrink-0" />
                                    <p className="text-gray-300 text-sm">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
