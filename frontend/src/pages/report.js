// src/pages/report.js
import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiLink, FiMessageSquare, FiSend, FiCheck, FiMail } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

const REPORT_TYPES = [
    'Broken Stream / Link',
    'Wrong Subtitles',
    'Audio Sync Issue',
    'Wrong Movie/Episode Info',
    'Offensive Content',
    'Copyright Concern',
    'Bug / App Issue',
    'Other',
];

const PRIORITIES = [
    { value: 'low', label: 'Low', color: 'text-green-400' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { value: 'high', label: 'High', color: 'text-red-400' },
];

export default function ReportPage() {
    const { user, isAuthenticated } = useAuth();
    const [form, setForm] = useState({
        type: 'Broken Stream / Link',
        priority: 'medium',
        url: '',
        email: user?.email || '',
        description: '',
    });
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.description) return;

        setStatus('sending');
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || 'http://localhost:8000';
            const res = await fetch(`${baseUrl}/api/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(isAuthenticated && { Authorization: `Bearer ${localStorage.getItem('token')}` }),
                },
                body: JSON.stringify({
                    ...form,
                    userId: user?.id || null,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                }),
            });
            if (!res.ok) throw new Error('Failed to submit report');
            setStatus('success');
            setForm(f => ({ ...f, url: '', description: '' }));
            setTimeout(() => setStatus('idle'), 5000);
        } catch (err) {
            setErrorMsg(err.message || 'Something went wrong');
            setStatus('error');
            setTimeout(() => setStatus('idle'), 4000);
        }
    };

    return (
        <>
            <Head>
                <title>Report an Issue - clipX</title>
                <meta name="description" content="Report a broken link, bug, or issue with clipX content." />
            </Head>

            <div className="min-h-screen pt-28 pb-20 px-4 md:px-12">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <FiAlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-3">
                            Report an Issue
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Help us improve clipX by reporting problems you encounter.
                        </p>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        onSubmit={handleSubmit}
                        className="glass-card rounded-2xl p-8 space-y-6"
                    >
                        {/* Report Type */}
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-3">Issue Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {REPORT_TYPES.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, type }))}
                                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all text-left ${form.type === type
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-3">Priority</label>
                            <div className="flex gap-3">
                                {PRIORITIES.map((p) => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${form.priority === p.value
                                                ? `bg-white/10 ${p.color} border border-current`
                                                : 'bg-white/5 text-gray-500 hover:bg-white/8'
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* URL */}
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Page / Stream URL (optional)</label>
                            <div className="relative">
                                <FiLink className="absolute top-3.5 left-4 text-gray-500" />
                                <input
                                    type="url"
                                    value={form.url}
                                    onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
                                    placeholder="https://clipx.app/watch/..."
                                    className="w-full bg-white/5 text-white pl-11 pr-4 py-3 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Email (for guests) */}
                        {!isAuthenticated && (
                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Your Email (optional)</label>
                                <div className="relative">
                                    <FiMail className="absolute top-3.5 left-4 text-gray-500" />
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                        placeholder="you@example.com"
                                        className="w-full bg-white/5 text-white pl-11 pr-4 py-3 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-2">Description *</label>
                            <div className="relative">
                                <FiMessageSquare className="absolute top-3.5 left-4 text-gray-500" />
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={5}
                                    required
                                    placeholder="Describe the issue in detail…"
                                    className="w-full bg-white/5 text-white pl-11 pr-4 py-3 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none transition-colors resize-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'sending'}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
                        >
                            {status === 'sending' ? 'Submitting…' : status === 'success' ? <><FiCheck /> Submitted!</> : <><FiSend /> Submit Report</>}
                        </button>

                        {status === 'error' && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
                        {status === 'success' && <p className="text-green-400 text-sm text-center">Report submitted! Thank you for helping us improve.</p>}
                    </motion.form>
                </div>
            </div>
        </>
    );
}
