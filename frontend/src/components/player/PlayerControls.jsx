/**
 * Theatre Mode & PiP Controls
 * Theatre mode dims everything around the player
 * PiP mode uses browser's Picture-in-Picture API
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMaximize, FiMinimize, FiMonitor, FiAlertTriangle, FiCopy } from 'react-icons/fi';

// Theatre mode overlay
export function TheatreOverlay({ active }) {
    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/85 z-30 pointer-events-none"
                    style={{ backdropFilter: 'blur(8px)' }}
                />
            )}
        </AnimatePresence>
    );
}

// Report Broken Stream Modal
export function ReportStreamModal({ isOpen, onClose, movieTitle, onSubmit }) {
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit?.({ reason, details });
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setReason('');
            setDetails('');
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {submitted ? (
                    <div className="text-center py-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">✓</span>
                        </div>
                        <p className="text-white font-bold">Report Submitted</p>
                        <p className="text-gray-500 text-sm mt-1">We'll look into it shortly</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <FiAlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Report Broken Stream</h3>
                                <p className="text-xs text-gray-500">{movieTitle}</p>
                            </div>
                        </div>
                        <div className="space-y-3 mb-4">
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-primary-500/30"
                            >
                                <option value="">Select issue type</option>
                                <option value="not_loading">Video not loading</option>
                                <option value="buffering">Constant buffering</option>
                                <option value="wrong_content">Wrong content playing</option>
                                <option value="audio_issue">No audio / wrong audio</option>
                                <option value="subtitle_issue">Subtitle not synced</option>
                                <option value="expired_link">Link expired</option>
                                <option value="other">Other</option>
                            </select>
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder="Additional details (optional)"
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30 resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-400 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors font-bold">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!reason}
                                className="flex-1 py-2.5 text-sm text-white font-bold rounded-xl bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-40"
                            >
                                Submit Report
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}

// Player control bar with Theatre/PiP/Report buttons
export function PlayerControls({ videoRef, theatreMode, setTheatreMode }) {
    const [pipActive, setPipActive] = useState(false);
    const [showReport, setShowReport] = useState(false);

    const togglePiP = useCallback(async () => {
        if (!videoRef?.current) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setPipActive(false);
            } else if (document.pictureInPictureEnabled) {
                await videoRef.current.requestPictureInPicture();
                setPipActive(true);
            }
        } catch (err) {
            console.warn('PiP failed:', err);
        }
    }, [videoRef]);

    // Listen for PiP exit
    useEffect(() => {
        const el = videoRef?.current;
        if (!el) return;
        const onLeave = () => setPipActive(false);
        el.addEventListener('leavepictureinpicture', onLeave);
        return () => el.removeEventListener('leavepictureinpicture', onLeave);
    }, [videoRef]);

    return (
        <>
            <div className="flex items-center gap-1">
                {/* Theatre Mode */}
                <button
                    onClick={() => setTheatreMode?.(!theatreMode)}
                    className={`p-2 rounded-lg transition-colors ${theatreMode ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    title={theatreMode ? 'Exit Theatre Mode' : 'Theatre Mode'}
                >
                    <FiMonitor className="w-4 h-4" />
                </button>

                {/* PiP */}
                {typeof document !== 'undefined' && document.pictureInPictureEnabled && (
                    <button
                        onClick={togglePiP}
                        className={`p-2 rounded-lg transition-colors ${pipActive ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title={pipActive ? 'Exit PiP' : 'Picture in Picture'}
                    >
                        <FiCopy className="w-4 h-4" />
                    </button>
                )}

                {/* Report */}
                <button
                    onClick={() => setShowReport(true)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Report Broken Stream"
                >
                    <FiAlertTriangle className="w-4 h-4" />
                </button>
            </div>

            <ReportStreamModal
                isOpen={showReport}
                onClose={() => setShowReport(false)}
                movieTitle=""
                onSubmit={({ reason, details }) => console.log('Report:', reason, details)}
            />
        </>
    );
}

export default PlayerControls;
