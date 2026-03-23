// frontend/src/pages/admin/moderation/reviews.jsx
import { useState } from 'react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiStar, FiTrash2, FiFlag, FiCheck, FiEye, FiEyeOff, FiAward, FiSearch } from 'react-icons/fi';

export default function ReviewsModerationPage() {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const [reviews] = useState([
        { id: 1, user: 'John Doe', movie: 'Inception', rating: 9.0, content: 'Masterpiece! Nolan at his best. The layers of dreams were mind-blowing.', featured: true, flagged: false, date: '2026-03-22' },
        { id: 2, user: 'BadReviewer', movie: 'Breaking Bad', rating: 1.0, content: '*** inappropriate review content flagged by users ***', featured: false, flagged: true, date: '2026-03-21' },
        { id: 3, user: 'Sarah K.', movie: 'Oppenheimer', rating: 8.5, content: 'Incredible cinematography and Cillian Murphy was phenomenal.', featured: false, flagged: false, date: '2026-03-20' },
        { id: 4, user: 'MovieFan92', movie: 'Attack on Titan', rating: 10, content: 'Best anime ever made. Period. The final season was perfect.', featured: false, flagged: false, date: '2026-03-19' },
        { id: 5, user: 'Troll123', movie: 'The Crown', rating: 0, content: 'Spam spam spam spam', featured: false, flagged: true, date: '2026-03-18' },
    ]);

    const filtered = reviews.filter(r => {
        const matchFilter = filter === 'all' ||
            (filter === 'flagged' && r.flagged) ||
            (filter === 'featured' && r.featured);
        const matchSearch = !search || r.movie.toLowerCase().includes(search.toLowerCase()) || r.user.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">Reviews Moderation</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage movie reviews — feature, flag, or remove</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center cursor-pointer hover:border-white/10 transition-colors" onClick={() => setFilter('all')}>
                            <p className="text-xl font-black text-white">{reviews.length}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Total</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center cursor-pointer hover:border-white/10 transition-colors" onClick={() => setFilter('featured')}>
                            <p className="text-xl font-black text-yellow-400">{reviews.filter(r => r.featured).length}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Featured</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center cursor-pointer hover:border-red-500/20 transition-colors" onClick={() => setFilter('flagged')}>
                            <p className="text-xl font-black text-red-400">{reviews.filter(r => r.flagged).length}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Flagged</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                            <p className="text-xl font-black text-primary-400">{(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Avg Rating</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by movie or user..." className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30" />
                    </div>

                    {/* Reviews */}
                    <div className="space-y-4">
                        {filtered.map((review) => (
                            <div key={review.id} className={`bg-white/[0.02] border rounded-2xl p-5 ${review.flagged ? 'border-red-500/20' : review.featured ? 'border-yellow-500/20' : 'border-white/5'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                {review.user.charAt(0)}
                                            </div>
                                            <span className="text-white font-bold text-sm">{review.user}</span>
                                            <span className="text-gray-600 text-xs">on</span>
                                            <span className="text-primary-400 text-sm font-medium">{review.movie}</span>
                                            <div className="flex items-center gap-1 ml-2">
                                                <FiStar className="w-3 h-3 text-yellow-400" />
                                                <span className="text-yellow-400 text-xs font-bold">{review.rating}</span>
                                            </div>
                                            {review.featured && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded-full">⭐ Featured</span>}
                                            {review.flagged && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full">⚠ Flagged</span>}
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed">{review.content}</p>
                                        <p className="text-xs text-gray-600 mt-2">{review.date}</p>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button className="p-2 text-gray-600 hover:text-yellow-400 transition-colors rounded-lg hover:bg-yellow-500/10" title="Feature">
                                            <FiAward size={14} />
                                        </button>
                                        <button className="p-2 text-gray-600 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/5" title={review.flagged ? 'Show' : 'Hide'}>
                                            {review.flagged ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                                        </button>
                                        <button className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10" title="Delete">
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
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
