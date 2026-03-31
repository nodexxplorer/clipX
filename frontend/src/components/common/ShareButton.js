/**
 * ShareButton — Uses Navigator Share API on mobile, clipboard fallback on desktop
 */

import { useState } from 'react';
import { FiShare2, FiCheck, FiCopy } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShareButton({ title, text, url, className = '' }) {
    const [copied, setCopied] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    const handleShare = async () => {
        // Try native share API first (mobile)
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: title || 'Check this out on clipX',
                    text: text || 'Watch this on clipX!',
                    url: shareUrl,
                });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return; // User cancelled
            }
        }

        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setShowTooltip(true);
            setTimeout(() => {
                setCopied(false);
                setShowTooltip(false);
            }, 2000);
        } catch {
            // Final fallback: prompt
            prompt('Copy this link:', shareUrl);
        }
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={handleShare}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-gray-400 hover:text-white text-sm ${className}`}
                aria-label="Share"
                id="share-button"
            >
                {copied ? <FiCheck size={16} className="text-emerald-400" /> : <FiShare2 size={16} />}
                <span>Share</span>
            </button>

            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg"
                    >
                        Link copied!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
