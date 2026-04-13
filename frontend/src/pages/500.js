import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiHome, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import Head from 'next/head';

export default function Custom500() {
    const handleRetry = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    return (
        <>
            <Head>
                <title>500 - Server Error | clipX</title>
                <meta name="description" content="Something went wrong on our end. We're working on it." />
            </Head>
            <div className="min-h-screen bg-[#050607] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Animated glow effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/15 blur-[140px] rounded-full pointer-events-none animate-pulse" />
                <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="text-center z-10 max-w-lg"
                >
                    {/* Error icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center mb-8"
                    >
                        <FiAlertTriangle className="w-10 h-10 text-red-400" />
                    </motion.div>

                    <h1 className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 via-orange-500 to-yellow-500 mb-4 tracking-tighter leading-none">
                        500
                    </h1>

                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                        Something went wrong
                    </h2>

                    <p className="text-gray-400 mb-3 leading-relaxed">
                        Our servers hit an unexpected error. Don&apos;t worry &mdash; our team has been notified and we&apos;re working to fix it.
                    </p>
                    <p className="text-gray-500 text-sm mb-10">
                        If this keeps happening, please contact{' '}
                        <a href="mailto:support@clipx.app" className="text-primary-400 hover:text-primary-300 transition-colors underline underline-offset-2">
                            support@clipx.app
                        </a>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={handleRetry}
                            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
                            id="retry-button"
                        >
                            <FiRefreshCw className="w-5 h-5" /> Try Again
                        </button>
                        <Link
                            href="/dashboard"
                            className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
                            id="home-button"
                        >
                            <FiHome className="w-5 h-5" /> Back to Home
                        </Link>
                    </div>

                    {/* Status indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
                    >
                        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="text-xs text-gray-400">Our team has been automatically alerted</span>
                    </motion.div>
                </motion.div>
            </div>
        </>
    );
}
