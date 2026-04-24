/**
 * What's New Changelog Popup
 * Shows latest features and updates to returning users
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiZap, FiGift, FiStar, FiShield } from 'react-icons/fi';

const CHANGELOG_VERSION = '2.4.0';

const CHANGELOG_ITEMS = [
    {
        icon: FiZap,
        title: 'Theatre Mode',
        description: 'Dim your surroundings for an immersive cinema experience while watching.',
        tag: 'New',
        color: 'text-purple-400 bg-purple-500/10',
    },
    {
        // icon: FiGift,
        // title: 'Subscription Plans',
        // description: 'Unlock Standard & Pro tiers with enhanced quality, downloads, and no ads.',
        // tag: 'New',
        // color: 'text-primary-400 bg-primary-500/10',
    },
    {
        icon: FiStar,
        title: 'Continue Watching',
        description: 'Pick up right where you left off — your progress is saved automatically.',
        tag: 'Improved',
        color: 'text-yellow-400 bg-yellow-500/10',
    },
    {
        icon: FiShield,
        title: 'Enhanced Security',
        description: 'Email verification, 2FA support, and improved session management.',
        tag: 'Security',
        color: 'text-green-400 bg-green-500/10',
    },
];

export default function WhatsNewPopup() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const lastSeen = localStorage.getItem('clipx_changelog_version');
        if (lastSeen !== CHANGELOG_VERSION) {
            const timer = setTimeout(() => setShow(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = () => {
        localStorage.setItem('clipx_changelog_version', CHANGELOG_VERSION);
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={dismiss}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="bg-gray-900 border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative p-6 pb-0">
                            <button onClick={dismiss} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                                <FiX className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">🎉</span>
                                <span className="text-xs font-bold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">v{CHANGELOG_VERSION}</span>
                            </div>
                            <h2 className="text-2xl font-black text-white mt-2">What&apos;s New</h2>
                            <p className="text-sm text-gray-400 mt-1">Here&apos;s what we&apos;ve been building for you</p>
                        </div>

                        {/* Items */}
                        <div className="p-6 space-y-4">
                            {CHANGELOG_ITEMS.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + i * 0.08 }}
                                        className="flex items-start gap-3 group"
                                    >
                                        <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-white text-sm font-bold">{item.title}</p>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${item.tag === 'New' ? 'bg-primary-500/20 text-primary-400' :
                                                        item.tag === 'Improved' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-green-500/20 text-green-400'
                                                    }`}>{item.tag}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-2">
                            <button
                                onClick={dismiss}
                                className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm rounded-xl transition-colors"
                            >
                                Got it!
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
