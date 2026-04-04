/**
 * Invoice Detail Page — displays single payment invoice with download option
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
    FiDownload, FiArrowLeft, FiCreditCard, FiCalendar,
    FiCheckCircle, FiAlertTriangle, FiPrinter
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function InvoicePage() {
    const router = useRouter();
    const { id } = router.query;
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || !isAuthenticated) return;
        const fetchInvoice = async () => {
            setLoading(true);
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const token = localStorage.getItem('token');
                const res = await fetch(`${apiUrl}/api/v1/invoice/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setInvoice(data);
                }
            } catch (err) {
                console.error('Failed to fetch invoice:', err);
            }
            setLoading(false);
        };
        fetchInvoice();
    }, [id, isAuthenticated]);

    const handleDownloadPDF = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        window.open(`${apiUrl}/api/v1/invoice/${id}?format=pdf`, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-950"><LoadingSpinner size="lg" /></div>;
    }
    if (!isAuthenticated) {
        router.push('/auth/login');
        return null;
    }

    const formatAmount = (amount) => {
        if (!amount) return '₦0';
        return `₦${(amount / 100).toLocaleString()}`;
    };

    return (
        <>
            <Head>
                <title>Invoice {id ? `#${String(id).slice(0, 8)}` : ''} - clipX</title>
                <meta name="description" content="View your clipX payment invoice" />
            </Head>

            <div className="min-h-screen py-24 px-4 sm:px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-8"
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <FiArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <h1 className="text-2xl md:text-3xl font-black text-white">Invoice</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all font-bold print:hidden"
                            >
                                <FiPrinter className="w-4 h-4" />
                                Print
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 rounded-xl border border-primary-500/20 transition-all font-bold print:hidden"
                            >
                                <FiDownload className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20"><LoadingSpinner /></div>
                    ) : invoice ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden"
                        >
                            {/* Invoice Header */}
                            <div className="p-6 md:p-8 border-b border-white/5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black text-white">clipX</h2>
                                        <p className="text-gray-500 text-sm mt-1">Payment Invoice</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Invoice #</p>
                                        <p className="text-white font-mono text-sm mt-1">{String(id).slice(0, 12).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="px-6 md:px-8 py-4 border-b border-white/5 flex items-center gap-3">
                                {invoice.status === 'paid' ? (
                                    <>
                                        <FiCheckCircle className="w-5 h-5 text-green-400" />
                                        <span className="text-green-400 font-bold text-sm">Payment Successful</span>
                                    </>
                                ) : (
                                    <>
                                        <FiAlertTriangle className="w-5 h-5 text-yellow-400" />
                                        <span className="text-yellow-400 font-bold text-sm">{invoice.status || 'Pending'}</span>
                                    </>
                                )}
                            </div>

                            {/* Details */}
                            <div className="p-6 md:p-8 space-y-6">
                                {/* Billed To */}
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Billed To</p>
                                    <p className="text-white font-bold">{user?.name || 'Customer'}</p>
                                    <p className="text-gray-400 text-sm">{user?.email}</p>
                                </div>

                                {/* Line Items */}
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Items</p>
                                    <div className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 text-xs text-gray-500 font-bold uppercase tracking-wider">
                                            <span>Description</span>
                                            <span>Amount</span>
                                        </div>
                                        <div className="flex items-center justify-between px-5 py-4">
                                            <div>
                                                <p className="text-white font-bold text-sm">
                                                    {invoice.plan
                                                        ? `${invoice.plan.charAt(0).toUpperCase() + invoice.plan.slice(1)} Plan`
                                                        : 'Subscription'
                                                    }
                                                </p>
                                                <p className="text-gray-500 text-xs mt-0.5">Monthly subscription</p>
                                            </div>
                                            <p className="text-white font-bold">{formatAmount(invoice.amount)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Payment Method</p>
                                        <div className="flex items-center gap-2">
                                            <FiCreditCard className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-300 text-sm">{invoice.method || 'Card'}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Date</p>
                                        <div className="flex items-center gap-2">
                                            <FiCalendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-300 text-sm">
                                                {invoice.paidAt
                                                    ? new Date(invoice.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                                    : '—'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                    <p className="text-lg font-bold text-white">Total Paid</p>
                                    <p className="text-2xl font-black text-white">{formatAmount(invoice.amount)}</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 md:px-8 py-4 bg-white/[0.01] border-t border-white/5 text-center">
                                <p className="text-gray-600 text-xs">
                                    Reference: {invoice.reference || id}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-center py-20">
                            <FiCreditCard className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">Invoice not found</p>
                            <p className="text-gray-600 text-sm mt-2">This invoice may not exist or you don't have access.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
