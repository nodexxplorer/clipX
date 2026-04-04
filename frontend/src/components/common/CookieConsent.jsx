// components/common/CookieConsent.jsx
// GDPR/ePrivacy compliant cookie consent banner
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShield, FiX } from 'react-icons/fi';

const CONSENT_KEY = 'clipx_cookie_consent';

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Only show if consent hasn't been given yet
        try {
            const consent = localStorage.getItem(CONSENT_KEY);
            if (!consent) {
                // Small delay so it doesn't flash on first paint
                const timer = setTimeout(() => setVisible(true), 1500);
                return () => clearTimeout(timer);
            }
        } catch {
            // localStorage not available (SSR, privacy mode)
        }
    }, []);

    const handleAcceptAll = () => {
        try {
            localStorage.setItem(CONSENT_KEY, JSON.stringify({
                essential: true,
                analytics: true,
                preferences: true,
                accepted_at: new Date().toISOString(),
            }));
        } catch {}
        setVisible(false);
    };

    const handleEssentialOnly = () => {
        try {
            localStorage.setItem(CONSENT_KEY, JSON.stringify({
                essential: true,
                analytics: false,
                preferences: false,
                accepted_at: new Date().toISOString(),
            }));
        } catch {}
        setVisible(false);
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6"
                >
                    <div className="max-w-4xl mx-auto bg-[#13151b]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl shadow-black/50">
                        <div className="flex items-start gap-4">
                            <div className="hidden sm:flex p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 flex-shrink-0">
                                <FiShield className="w-6 h-6 text-primary-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-white font-bold text-sm md:text-base">
                                            We respect your privacy
                                        </h3>
                                        <p className="text-gray-400 text-xs md:text-sm mt-1.5 leading-relaxed max-w-xl">
                                            We use cookies to keep you signed in, save your preferences, and improve your experience.
                                            Read our{' '}
                                            <Link href="/cookies" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
                                                Cookie Policy
                                            </Link>{' '}
                                            and{' '}
                                            <Link href="/privacy" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
                                                Privacy Policy
                                            </Link>.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleEssentialOnly}
                                        className="text-gray-500 hover:text-white transition-colors flex-shrink-0 p-1"
                                        aria-label="Dismiss"
                                    >
                                        <FiX size={18} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-4">
                                    <button
                                        onClick={handleAcceptAll}
                                        className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs md:text-sm font-bold rounded-xl transition-colors"
                                    >
                                        Accept All
                                    </button>
                                    <button
                                        onClick={handleEssentialOnly}
                                        className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs md:text-sm font-medium rounded-xl transition-colors"
                                    >
                                        Essential Only
                                    </button>
                                    <Link
                                        href="/cookies"
                                        className="px-3 py-2.5 text-gray-500 hover:text-white text-xs md:text-sm transition-colors"
                                    >
                                        Customize →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
