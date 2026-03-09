import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiHome, FiSearch } from 'react-icons/fi';
import Head from 'next/head';

export default function Custom404() {
    return (
        <>
            <Head>
                <title>404 - Page Not Found | clipX</title>
            </Head>
            <div className="min-h-screen bg-[#050607] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Glow effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/20 blur-[120px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center z-10"
                >
                    <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-400 to-purple-600 mb-6 text-shadow tracking-tighter">
                        404
                    </h1>
                    <h2 className="text-3xl font-bold text-white mb-4">Lost in the void</h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        It looks like this page was moved or doesn't exist anymore. Let's get you back to the movies.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/dashboard"
                            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            <FiHome className="w-5 h-5" /> Back to Home
                        </Link>
                        <Link
                            href="/movies"
                            className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            <FiSearch className="w-5 h-5" /> Browse Movies
                        </Link>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
