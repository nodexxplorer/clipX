// frontend/src/pages/admin/settings/api.jsx
import { useState } from 'react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiKey, FiCopy, FiCheck, FiShield, FiGlobe, FiRefreshCw } from 'react-icons/fi';

export default function ApiSettingsPage() {
    const [copied, setCopied] = useState('');

    const endpoints = [
        { name: 'GraphQL API', url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/graphql', status: 'active' },
        { name: 'REST Auth', url: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/graphql', '/api/auth'), status: 'active' },
        { name: 'Stream Proxy', url: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/graphql', '/api/proxy/stream'), status: 'active' },
        { name: 'Download Proxy', url: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/graphql', '/api/proxy/download'), status: 'active' },
    ];

    const handleCopy = (text, name) => {
        navigator.clipboard.writeText(text);
        setCopied(name);
        setTimeout(() => setCopied(''), 2000);
    };

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="max-w-2xl space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">API Configuration</h1>
                        <p className="text-sm text-gray-500 mt-0.5">API endpoints, keys, and rate limiting</p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><FiGlobe size={16} /> Endpoints</h3>
                        <div className="space-y-3">
                            {endpoints.map((ep) => (
                                <div key={ep.name} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-bold">{ep.name}</p>
                                        <p className="text-gray-500 text-xs font-mono mt-0.5">{ep.url}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        <button onClick={() => handleCopy(ep.url, ep.name)} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                                            {copied === ep.name ? <FiCheck size={14} className="text-green-400" /> : <FiCopy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><FiShield size={16} /> Rate Limiting</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                                <p className="text-white text-sm font-medium">Requests per minute (anonymous)</p>
                                <span className="text-primary-400 font-bold">30</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                                <p className="text-white text-sm font-medium">Requests per minute (authenticated)</p>
                                <span className="text-primary-400 font-bold">100</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                                <p className="text-white text-sm font-medium">Stream requests per minute</p>
                                <span className="text-primary-400 font-bold">10</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><FiKey size={16} /> API Keys</h3>
                        <p className="text-gray-500 text-sm">API keys for external integrations can be generated here.</p>
                        <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors">
                            <FiRefreshCw size={14} /> Generate New Key
                        </button>
                    </div>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
