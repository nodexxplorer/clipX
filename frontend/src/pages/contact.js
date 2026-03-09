// src/pages/contact.js
import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { FiMail, FiUser, FiMessageSquare, FiSend, FiCheck, FiMapPin, FiPhone } from 'react-icons/fi';

const CATEGORIES = [
    'General Inquiry',
    'Technical Support',
    'Billing & Payments',
    'Content Request',
    'Partnership',
    'Other',
];

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', category: 'General Inquiry', message: '' });
    const [status, setStatus] = useState('idle'); // idle | sending | success | error
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) return;

        setStatus('sending');
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || 'http://localhost:8000';
            const res = await fetch(`${baseUrl}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Failed to send message');
            setStatus('success');
            setForm({ name: '', email: '', category: 'General Inquiry', message: '' });
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
                <title>Contact Us - clipX</title>
                <meta name="description" content="Get in touch with the clipX team. We're here to help." />
            </Head>

            <div className="min-h-screen pt-28 pb-20 px-4 md:px-12">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4">
                            Get in Touch
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl mx-auto">
                            Have a question, suggestion, or issue? We&apos;d love to hear from you.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-5 gap-10">
                        {/* Info sidebar */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="md:col-span-2 space-y-8"
                        >
                            <div className="glass-card rounded-2xl p-8 space-y-8">
                                <InfoBlock icon={FiMail} title="Email" value="support@clipx.app" />
                                <InfoBlock icon={FiPhone} title="Phone" value="+1 (555) 123-4567" />
                                <InfoBlock icon={FiMapPin} title="Office" value="San Francisco, CA" />
                            </div>

                            <div className="glass-card rounded-2xl p-6">
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    We typically respond within <span className="text-primary-400 font-bold">24 hours</span>.
                                    For urgent issues, please use the <span className="text-primary-400 font-bold">Technical Support</span> category.
                                </p>
                            </div>
                        </motion.div>

                        {/* Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="md:col-span-3"
                        >
                            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <InputField icon={FiUser} label="Your Name" value={form.name} onChange={(v) => setForm(f => ({ ...f, name: v }))} placeholder="John Doe" required />
                                    <InputField icon={FiMail} label="Email" value={form.email} onChange={(v) => setForm(f => ({ ...f, email: v }))} placeholder="john@example.com" type="email" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                                        className="w-full bg-white/5 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none transition-colors"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Message</label>
                                    <div className="relative">
                                        <FiMessageSquare className="absolute top-3.5 left-4 text-gray-500" />
                                        <textarea
                                            value={form.message}
                                            onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                                            rows={5}
                                            placeholder="Tell us how we can help…"
                                            required
                                            className="w-full bg-white/5 text-white pl-11 pr-4 py-3 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none transition-colors resize-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'sending'}
                                    className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-50"
                                >
                                    {status === 'sending' ? 'Sending…' : status === 'success' ? <><FiCheck /> Sent!</> : <><FiSend /> Send Message</>}
                                </button>

                                {status === 'error' && (
                                    <p className="text-red-400 text-sm text-center">{errorMsg}</p>
                                )}
                                {status === 'success' && (
                                    <p className="text-green-400 text-sm text-center">Message sent successfully! We&apos;ll get back to you soon.</p>
                                )}
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}

function InputField({ icon: Icon, label, value, onChange, placeholder, type = 'text', required }) {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">{label}</label>
            <div className="relative">
                <Icon className="absolute top-3.5 left-4 text-gray-500" />
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    className="w-full bg-white/5 text-white pl-11 pr-4 py-3 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none transition-colors"
                />
            </div>
        </div>
    );
}

function InfoBlock({ icon: Icon, title, value }) {
    return (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary-500" />
            </div>
            <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</p>
                <p className="text-white font-semibold">{value}</p>
            </div>
        </div>
    );
}
