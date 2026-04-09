// frontend/src/pages/admin/logs/errors.jsx
import { useState } from 'react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiAlertTriangle, FiRefreshCw, FiCheck, FiClock, FiTrash2 } from 'react-icons/fi';

export default function ErrorLogsPage() {
    const [logs] = useState(() => {
        // Generate sample error logs from common patterns
        const types = [
            { level: 'error', message: 'GraphQL query timeout', source: 'schema.py:dashboardStats' },
            { level: 'warning', message: 'Rate limit approached for IP 45.33.x.x', source: 'middleware/rate_limit.py' },
            { level: 'error', message: 'Database connection pool exhausted', source: 'core/database.py' },
            { level: 'info', message: 'Scheduled backup completed successfully', source: 'tasks/backup.py' },
            { level: 'warning', message: 'Failed login attempt (5 consecutive)', source: 'auth/login.py' },
        ];
        return types.map((t, i) => ({
            id: i + 1,
            ...t,
            timestamp: new Date(Date.now() - i * 3600000).toISOString(),
            count: Math.floor(Math.random() * 10) + 1,
        }));
    });

    const levelColors = {
        error: 'bg-red-500/10 text-red-400 border-red-500/20',
        warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white">Error Logs</h1>
                            <p className="text-sm text-gray-500 mt-0.5">System errors and warnings</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-colors">
                                <FiTrash2 size={14} /> Clear All
                            </button>
                            <button className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                                <FiRefreshCw size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-center">
                            <p className="text-xl font-black text-red-400">{logs.filter(l => l.level === 'error').length}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Errors</p>
                        </div>
                        <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 text-center">
                            <p className="text-xl font-black text-yellow-400">{logs.filter(l => l.level === 'warning').length}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Warnings</p>
                        </div>
                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 text-center">
                            <p className="text-xl font-black text-blue-400">{logs.filter(l => l.level === 'info').length}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">Info</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {logs.map((log) => (
                            <div key={log.id} className={`border rounded-2xl p-5 ${levelColors[log.level]}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <FiAlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-white font-bold text-sm">{log.message}</p>
                                            <p className="text-gray-500 text-xs font-mono mt-1">{log.source}</p>
                                            <p className="text-gray-600 text-xs mt-1 flex items-center gap-1">
                                                <FiClock size={10} /> {new Date(log.timestamp).toLocaleString()} • {log.count} occurrence{log.count > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${levelColors[log.level]}`}>
                                        {log.level}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
