/**
 * ReviewActions — Like/Dislike toggle + Report button for user reviews
 */

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { FiThumbsUp, FiThumbsDown, FiFlag, FiX } from 'react-icons/fi';
import { LIKE_REVIEW_MUTATION, REPORT_REVIEW_MUTATION } from '@/graphql/mutations/authMutation';

const REPORT_REASONS = [
    { value: 'spam', label: 'Spam or fake review' },
    { value: 'harassment', label: 'Harassment or hate speech' },
    { value: 'spoiler', label: 'Contains major spoilers' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'other', label: 'Other' },
];

export default function ReviewActions({ reviewId, initialLikes = 0, initialDislikes = 0, userLikeStatus = null }) {
    const [likeCount, setLikeCount] = useState(initialLikes);
    const [dislikeCount, setDislikeCount] = useState(initialDislikes);
    const [currentStatus, setCurrentStatus] = useState(userLikeStatus); // 'like' | 'dislike' | null
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [reported, setReported] = useState(false);

    const [likeReview] = useMutation(LIKE_REVIEW_MUTATION);
    const [reportReview] = useMutation(REPORT_REVIEW_MUTATION);

    const handleLike = async (type) => {
        try {
            // Toggle: if same type, remove it
            if (currentStatus === type) {
                // Remove vote
                setCurrentStatus(null);
                if (type === 'like') setLikeCount(prev => prev - 1);
                else setDislikeCount(prev => prev - 1);
            } else {
                // Switch vote
                if (currentStatus === 'like') setLikeCount(prev => prev - 1);
                if (currentStatus === 'dislike') setDislikeCount(prev => prev - 1);
                setCurrentStatus(type);
                if (type === 'like') setLikeCount(prev => prev + 1);
                else setDislikeCount(prev => prev + 1);
            }

            await likeReview({ variables: { reviewId, likeType: type } });
        } catch (err) {
            console.error('Like failed:', err);
        }
    };

    const handleReport = async (e) => {
        e.preventDefault();
        if (!reportReason) return;

        try {
            await reportReview({
                variables: { reviewId, reason: reportReason, description: reportDescription || null },
            });
            setReported(true);
            setTimeout(() => setShowReportModal(false), 1500);
        } catch (err) {
            console.error('Report failed:', err);
        }
    };

    return (
        <>
            <div className="flex items-center gap-3">
                {/* Like button */}
                <button
                    onClick={() => handleLike('like')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${currentStatus === 'like'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10 hover:text-gray-300'
                        }`}
                    aria-label="Like review"
                    id={`like-review-${reviewId}`}
                >
                    <FiThumbsUp size={14} />
                    <span>{likeCount}</span>
                </button>

                {/* Dislike button */}
                <button
                    onClick={() => handleLike('dislike')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${currentStatus === 'dislike'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10 hover:text-gray-300'
                        }`}
                    aria-label="Dislike review"
                    id={`dislike-review-${reviewId}`}
                >
                    <FiThumbsDown size={14} />
                    <span>{dislikeCount}</span>
                </button>

                {/* Report button */}
                <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-white/5 text-gray-600 border border-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
                    aria-label="Report review"
                    id={`report-review-${reviewId}`}
                >
                    <FiFlag size={13} />
                </button>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0f1115] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {reported ? (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                                    <FiFlag size={24} className="text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Report Submitted</h3>
                                <p className="text-gray-400 text-sm">Thank you. Our moderation team will review this.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-white">Report Review</h3>
                                    <button onClick={() => setShowReportModal(false)} className="text-gray-500 hover:text-white">
                                        <FiX size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleReport} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Reason</label>
                                        <div className="space-y-2">
                                            {REPORT_REASONS.map((r) => (
                                                <label key={r.value} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer transition-all">
                                                    <input
                                                        type="radio"
                                                        name="reason"
                                                        value={r.value}
                                                        checked={reportReason === r.value}
                                                        onChange={() => setReportReason(r.value)}
                                                        className="accent-emerald-500"
                                                    />
                                                    <span className="text-sm text-gray-300">{r.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Additional details (optional)</label>
                                        <textarea
                                            value={reportDescription}
                                            onChange={(e) => setReportDescription(e.target.value)}
                                            placeholder="Describe the issue..."
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                                            id="report-description"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!reportReason}
                                        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Submit Report
                                    </button>
                                </form>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </>
    );
}
