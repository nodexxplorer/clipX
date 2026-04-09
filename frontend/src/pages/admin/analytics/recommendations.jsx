// frontend/src/pages/admin/analytics/recommendations.jsx
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiCpu, FiTrendingUp, FiSettings } from 'react-icons/fi';

export default function RecommendationsPage() {
    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">Recommendation Engine</h1>
                        <p className="text-sm text-gray-500 mt-0.5">AI-powered content recommendations configuration</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4">
                                <FiCpu className="w-6 h-6 text-primary-400" />
                            </div>
                            <h3 className="text-white font-bold mb-1">Collaborative Filtering</h3>
                            <p className="text-gray-500 text-sm">Recommends based on similar user viewing patterns and ratings.</p>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs text-green-400 font-bold">Active</span>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                                <FiTrendingUp className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-white font-bold mb-1">Trending Algorithm</h3>
                            <p className="text-gray-500 text-sm">Surfaces content gaining momentum based on recent views and engagement.</p>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs text-green-400 font-bold">Active</span>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
                                <FiSettings className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h3 className="text-white font-bold mb-1">Genre Affinity</h3>
                            <p className="text-gray-500 text-sm">Personalizes feeds based on individual genre preferences.</p>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs text-green-400 font-bold">Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-3">Recommendation Settings</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                                <div>
                                    <p className="text-white text-sm font-medium">Max recommendations per user</p>
                                    <p className="text-gray-500 text-xs">Number shown in "Recommended for you" section</p>
                                </div>
                                <span className="text-primary-400 font-bold text-lg">20</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                                <div>
                                    <p className="text-white text-sm font-medium">Recency bias weight</p>
                                    <p className="text-gray-500 text-xs">How much to favor new content in recommendations</p>
                                </div>
                                <span className="text-primary-400 font-bold text-lg">0.7</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                                <div>
                                    <p className="text-white text-sm font-medium">Diversity factor</p>
                                    <p className="text-gray-500 text-xs">Prevents echo chamber by mixing in diverse genres</p>
                                </div>
                                <span className="text-primary-400 font-bold text-lg">0.3</span>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
