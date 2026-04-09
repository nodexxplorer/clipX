// frontend/src/pages/admin/moderation/reviews.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiStar, FiTrash2, FiCheck, FiAward, FiSearch } from 'react-icons/fi';
import {
    GET_ADMIN_ALL_REVIEWS,
    ADMIN_FEATURE_REVIEW,
    ADMIN_DELETE_REVIEW,
    ADMIN_BULK_DELETE_REVIEWS,
} from '@/graphql/queries/adminQueries';

export default function ReviewsModerationPage() {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState([]);

    const { data, loading, refetch } = useQuery(GET_ADMIN_ALL_REVIEWS, {
        variables: { limit: 50, offset: 0, filter: filter === 'all' ? undefined : filter },
        fetchPolicy: 'cache-and-network',
    });

    const [featureReview] = useMutation(ADMIN_FEATURE_REVIEW);
    const [deleteReview] = useMutation(ADMIN_DELETE_REVIEW);
    const [bulkDeleteReviews] = useMutation(ADMIN_BULK_DELETE_REVIEWS);

    const reviewData = data?.adminAllReviews || { reviews: [], totalCount: 0, flaggedCount: 0, featuredCount: 0 };
    const reviews = reviewData.reviews || [];

    const filtered = reviews.filter(r => {
        if (!search) return true;
        return (r.userName || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.content || '').toLowerCase().includes(search.toLowerCase());
    });

    const handleFeature = async (id, current) => {
        await featureReview({ variables: { id, featured: !current } });
        refetch();
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this review permanently?')) return;
        await deleteReview({ variables: { id } });
        refetch();
    };

    const handleBulkDelete = async () => {
        if (selected.length === 0) return;
        if (!confirm(`Delete ${selected.length} selected review(s)?`)) return;
        await bulkDeleteReviews({ variables: { reviewIds: selected } });
        setSelected([]);
        refetch();
    };

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white">Reviews Moderation</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Manage movie reviews — feature, flag, or remove</p>
                        </div>
                        {selected.length > 0 && (
                            <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/30 transition-colors">
                                <FiTrash2 size={14} /> Delete {selected.length} Selected
                            </button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center cursor-pointer hover:border-white/10 transition-colors" onClick={() => setFilter('all')}>
                            <p className="text-xl font-black text-white">{reviewData.totalCount}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Total</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center cursor-pointer hover:border-white/10 transition-colors" onClick={() => setFilter('featured')}>
                            <p className="text-xl font-black text-yellow-400">{reviewData.featuredCount}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Featured</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center cursor-pointer hover:border-red-500/20 transition-colors" onClick={() => setFilter('flagged')}>
                            <p className="text-xl font-black text-red-400">{reviewData.flaggedCount}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Reported</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews..." className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30" />
                    </div>

                    {/* Reviews */}
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white/[0.02] rounded-2xl p-5 animate-pulse h-28 border border-white/5" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map((review) => (
                                <div key={review.id} className={`bg-white/[0.02] border rounded-2xl p-5 ${review.reportCount > 0 ? 'border-red-500/20' : review.isFeatured ? 'border-yellow-500/20' : 'border-white/5'}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(review.id)}
                                                onChange={() => toggleSelect(review.id)}
                                                className="mt-1.5 rounded"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                        {(review.userName || 'U').charAt(0)}
                                                    </div>
                                                    <span className="text-white font-bold text-sm">{review.userName || 'Unknown'}</span>
                                                    {review.rating && (
                                                        <div className="flex items-center gap-1 ml-2">
                                                            <FiStar className="w-3 h-3 text-yellow-400" />
                                                            <span className="text-yellow-400 text-xs font-bold">{review.rating}</span>
                                                        </div>
                                                    )}
                                                    {review.isFeatured && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded-full">⭐ Featured</span>}
                                                    {review.reportCount > 0 && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full">⚠ {review.reportCount} Report{review.reportCount > 1 ? 's' : ''}</span>}
                                                </div>
                                                <p className="text-gray-300 text-sm leading-relaxed">{review.content}</p>
                                                <p className="text-xs text-gray-600 mt-2">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button onClick={() => handleFeature(review.id, review.isFeatured)} className={`p-2 transition-colors rounded-lg ${review.isFeatured ? 'text-yellow-400 bg-yellow-500/10' : 'text-gray-600 hover:text-yellow-400 hover:bg-yellow-500/10'}`} title="Feature">
                                                <FiAward size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(review.id)} className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10" title="Delete">
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <FiCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No reviews match your filter</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
