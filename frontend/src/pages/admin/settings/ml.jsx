// frontend/src/pages/admin/settings/ml.jsx
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiCpu, FiZap, FiBarChart2, FiToggleRight, FiToggleLeft } from 'react-icons/fi';
import { useState } from 'react';

export default function MLSettingsPage() {
    const [models, setModels] = useState([
        { id: 'rec', name: 'Recommendation Engine', description: 'Suggests content based on viewing history and genre affinities', enabled: true, accuracy: 87 },
        { id: 'mod', name: 'Content Moderation', description: 'Auto-flags reviews with offensive language before human review', enabled: true, accuracy: 92 },
        { id: 'search', name: 'Smart Search', description: 'Natural language search with typo tolerance and synonym matching', enabled: true, accuracy: 95 },
        { id: 'churn', name: 'Churn Prediction', description: 'Predicts users likely to cancel subscription based on engagement', enabled: false, accuracy: 78 },
    ]);

    const toggleModel = (id) => {
        setModels(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
    };

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="max-w-2xl space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">ML & AI Models</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Configure machine learning models and AI features</p>
                    </div>

                    <div className="space-y-4">
                        {models.map((model) => (
                            <div key={model.id} className={`bg-white/[0.02] border rounded-2xl p-5 transition-all ${model.enabled ? 'border-primary-500/20' : 'border-white/5'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${model.enabled ? 'bg-primary-500/10' : 'bg-gray-500/10'}`}>
                                            <FiCpu className={`w-5 h-5 ${model.enabled ? 'text-primary-400' : 'text-gray-500'}`} />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">{model.name}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{model.description}</p>
                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="flex items-center gap-1">
                                                    <FiBarChart2 className="w-3 h-3 text-gray-500" />
                                                    <span className="text-xs text-gray-400">Accuracy: <span className="text-white font-bold">{model.accuracy}%</span></span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FiZap className="w-3 h-3 text-gray-500" />
                                                    <span className="text-xs text-gray-400">Status: <span className={`font-bold ${model.enabled ? 'text-green-400' : 'text-gray-500'}`}>{model.enabled ? 'Active' : 'Disabled'}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => toggleModel(model.id)} className="mt-1">
                                        {model.enabled ? (
                                            <FiToggleRight className="w-8 h-8 text-primary-400" />
                                        ) : (
                                            <FiToggleLeft className="w-8 h-8 text-gray-500" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
