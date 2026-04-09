// frontend/src/pages/admin/content/banners.jsx
import { useState } from 'react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiImage, FiPlus, FiTrash2, FiEye, FiEyeOff, FiMove } from 'react-icons/fi';

export default function BannersPage() {
    const [banners, setBanners] = useState([
        { id: 1, title: 'New Releases', subtitle: 'Check out the latest movies', image: '', active: true },
        { id: 2, title: 'Top Rated Series', subtitle: 'Binge-worthy series collection', image: '', active: true },
        { id: 3, title: 'Coming Soon', subtitle: 'Upcoming content preview', image: '', active: false },
    ]);

    const toggleActive = (id) => {
        setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
    };

    const handleDelete = (id) => {
        if (!confirm('Remove this banner?')) return;
        setBanners(prev => prev.filter(b => b.id !== id));
    };

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white">Banner Management</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Control homepage hero banners and promotional slides</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors">
                            <FiPlus size={14} /> Add Banner
                        </button>
                    </div>

                    <div className="space-y-4">
                        {banners.map((banner, idx) => (
                            <div key={banner.id} className={`bg-white/[0.02] border rounded-2xl p-5 transition-all ${banner.active ? 'border-primary-500/20' : 'border-white/5 opacity-60'}`}>
                                <div className="flex items-center gap-5">
                                    <div className="w-10 text-center flex-shrink-0">
                                        <FiMove className="w-5 h-5 text-gray-600 mx-auto cursor-grab" />
                                        <span className="text-[10px] text-gray-600 font-bold">#{idx + 1}</span>
                                    </div>

                                    <div className="w-32 h-20 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {banner.image ? (
                                            <img src={banner.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <FiImage className="w-6 h-6 text-gray-600" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-white font-bold text-sm">{banner.title}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">{banner.subtitle}</p>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => toggleActive(banner.id)} className={`p-2 rounded-lg transition-colors ${banner.active ? 'text-green-400 bg-green-500/10' : 'text-gray-500 hover:bg-white/5'}`}>
                                            {banner.active ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                                        </button>
                                        <button onClick={() => handleDelete(banner.id)} className="p-2 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {banners.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <FiImage className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No banners configured</p>
                        </div>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
