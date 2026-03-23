/**
 * MovieReviews Component
 * Displays user reviews with rating stars and allows authenticated users to submit reviews
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiSend, FiUser } from 'react-icons/fi';
import { gql} from '@apollo/client';
import { useMutation, useQuery  } from '@apollo/client/react';
import { useAuth } from '@/contexts/AuthContext';

const GET_MOVIE_REVIEWS = gql`
  query GetMovieReviews($movieId: String!) {
    movieReviews(movieId: $movieId) {
      id
      content
      rating
      userName
      userAvatar
      createdAt
    }
  }
`;

const SUBMIT_MOVIE_REVIEW = gql`
  mutation SubmitMovieReview($movieId: String!, $content: String!, $rating: Float!) {
    submitMovieReview(movieId: $movieId, content: $content, rating: $rating) {
      id
      content
      rating
      userName
      userAvatar
      createdAt
    }
  }
`;

const StarRating = ({ rating, onRate, interactive = false, size = 'w-5 h-5' }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type="button"
                onClick={() => interactive && onRate?.(star)}
                className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                disabled={!interactive}
            >
                <FiStar
                    className={`${size} transition-colors ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                        }`}
                />
            </button>
        ))}
    </div>
);

const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
};

export default function MovieReviews({ movieId }) {
    const { isAuthenticated, user } = useAuth();
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(0);
    const [showForm, setShowForm] = useState(false);

    const { data, refetch } = useQuery(GET_MOVIE_REVIEWS, {
        variables: { movieId },
        skip: !movieId,
    });

    const [submitReview, { loading: submitting }] = useMutation(SUBMIT_MOVIE_REVIEW, {
        onCompleted: () => {
            setContent('');
            setRating(0);
            setShowForm(false);
            refetch();
        },
    });

    const reviews = data?.movieReviews || [];
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim() || content.trim().length < 10 || rating < 1) return;
        submitReview({ variables: { movieId, content: content.trim(), rating } });
    };

    return (
        <div className="mt-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white">Reviews</h2>
                    {avgRating && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 rounded-lg">
                            <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-yellow-400 font-bold text-sm">{avgRating}</span>
                            <span className="text-gray-500 text-xs">({reviews.length})</span>
                        </div>
                    )}
                </div>
                {isAuthenticated && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-primary-600/20 text-primary-400 font-bold text-sm rounded-lg hover:bg-primary-600/30 transition-colors"
                    >
                        Write a Review
                    </button>
                )}
            </div>

            {/* Review Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSubmit}
                        className="mb-8 p-6 bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0) || <FiUser />
                                )}
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">{user?.name || 'You'}</p>
                                <StarRating rating={rating} onRate={setRating} interactive size="w-4 h-4" />
                            </div>
                        </div>

                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share your thoughts about this movie... (min 10 characters)"
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 outline-none focus:border-primary-500/50 resize-none text-sm"
                        />

                        <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">{content.length}/500</span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setContent(''); setRating(0); }}
                                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || content.trim().length < 10 || rating < 1}
                                    className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white font-bold text-sm rounded-lg hover:bg-primary-500 transition-colors disabled:opacity-40"
                                >
                                    <FiSend className="w-4 h-4" />
                                    {submitting ? 'Posting...' : 'Post Review'}
                                </button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Reviews List */}
            {reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map((review, idx) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500/40 to-purple-600/40 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                                    {review.userAvatar ? (
                                        <img src={review.userAvatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        review.userName?.charAt(0) || '?'
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-white font-bold text-sm">{review.userName}</span>
                                        <StarRating rating={review.rating} size="w-3.5 h-3.5" />
                                        <span className="text-gray-500 text-xs">{timeAgo(review.createdAt)}</span>
                                    </div>
                                    <p className="text-gray-300 text-sm mt-2 leading-relaxed">{review.content}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-xl">
                    <FiStar className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No reviews yet</p>
                    <p className="text-gray-500 text-sm mt-1">Be the first to share your thoughts!</p>
                </div>
            )}
        </div>
    );
}
