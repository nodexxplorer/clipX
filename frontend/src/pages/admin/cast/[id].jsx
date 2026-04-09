// frontend/src/pages/admin/cast/[id].jsx
import { useRouter } from 'next/router';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiArrowLeft, FiUser } from 'react-icons/fi';
import Link from 'next/link';

export default function CastDetailPage() {
    const router = useRouter();
    const { id } = router.query;

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/cast" className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                            <FiArrowLeft size={16} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-white">Cast Member</h1>
                            <p className="text-sm text-gray-500 mt-0.5">ID: {id}</p>
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center">
                        <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-primary-500/30 to-purple-500/30 flex items-center justify-center mb-4">
                            <FiUser className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-400 text-sm">Cast member detail view</p>
                        <p className="text-gray-600 text-xs mt-1">Detailed cast profiles will appear here when the cast API is connected.</p>
                    </div>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}