// frontend/src/pages/admin/settings/email.jsx
import { useState } from 'react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiMail, FiCheck, FiSend, FiSettings } from 'react-icons/fi';

export default function EmailSettingsPage() {
    const [smtp, setSmtp] = useState({
        host: process.env.NEXT_PUBLIC_SMTP_HOST || 'smtp.gmail.com',
        port: '587',
        user: '',
        from: 'noreply@clipx.com',
        tls: true,
    });
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="max-w-2xl space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">Email Settings</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Configure SMTP and email templates</p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-5">
                        <h3 className="text-white font-bold flex items-center gap-2"><FiSettings size={16} /> SMTP Configuration</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">SMTP Host</label>
                                <input value={smtp.host} onChange={e => setSmtp(s => ({ ...s, host: e.target.value }))} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Port</label>
                                <input value={smtp.port} onChange={e => setSmtp(s => ({ ...s, port: e.target.value }))} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Username / Email</label>
                            <input value={smtp.user} onChange={e => setSmtp(s => ({ ...s, user: e.target.value }))} placeholder="your-email@gmail.com" className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30" />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">From Address</label>
                            <input value={smtp.from} onChange={e => setSmtp(s => ({ ...s, from: e.target.value }))} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" />
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors">
                                {saved ? <FiCheck size={16} /> : <FiMail size={16} />}
                                {saved ? 'Saved!' : 'Save Settings'}
                            </button>
                            <button className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-colors">
                                <FiSend size={14} /> Send Test Email
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-3">Email Templates</h3>
                        <div className="space-y-3">
                            {['Welcome Email', 'Password Reset', 'Email Verification', 'Subscription Confirmation', 'Report Status Update'].map((t) => (
                                <div key={t} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
                                    <span className="text-white text-sm font-medium">{t}</span>
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">Active</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
