/**
 * Subscription Management Page — TEMPORARILY DISABLED
 * Payments and subscription management will be enabled in a future release.
 */

import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCreditCard, FiArrowLeft, FiClock } from 'react-icons/fi';

export default function SubscriptionPage() {
    return (
        <>
            <Head>
                <title>Subscription - clipX</title>
                <meta name="description" content="Manage your clipX subscription" />
            </Head>

            <div className="min-h-screen py-24 px-4 sm:px-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full text-center"
                >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/20 flex items-center justify-center mx-auto mb-6">
                        <FiClock className="w-10 h-10 text-primary-400" />
                    </div>

                    <h1 className="text-3xl font-black text-white mb-3">Coming Soon</h1>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8">
                        Subscription plans and payment management are being prepared.
                        You&apos;ll be able to upgrade your account, manage billing, and access
                        premium features here soon.
                    </p>

                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <FiCreditCard className="w-5 h-5 text-primary-400" />
                            <h3 className="text-white font-bold">Current Plan</h3>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-bold text-lg">Free</p>
                                <p className="text-gray-500 text-xs">Full access during beta</p>
                            </div>
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                                Active
                            </span>
                        </div>
                    </div>

                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all font-medium"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </motion.div>
            </div>
        </>
    );
}
