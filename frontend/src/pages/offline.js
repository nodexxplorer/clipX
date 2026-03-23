/**
 * Offline Fallback Page
 * Shown when the user is offline and the page isn't cached
 */

import Head from 'next/head';
import { FiWifiOff, FiRefreshCw } from 'react-icons/fi';

export default function OfflinePage() {
    return (
        <>
            <Head>
                <title>Offline - clipX</title>
            </Head>
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="text-center max-w-md">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-3xl scale-150" />
                        <div className="relative bg-white/[0.03] p-8 rounded-2xl border border-white/5 inline-block">
                            <FiWifiOff className="w-16 h-16 text-gray-500" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white mb-3">You're Offline</h1>
                    <p className="text-gray-400 leading-relaxed mb-8">
                        It looks like you've lost your internet connection.
                        Check your connection and try again.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors"
                    >
                        <FiRefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            </div>
        </>
    );
}
