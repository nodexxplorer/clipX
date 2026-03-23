/**
 * Premium Route Guard
 * HOC that restricts page access based on user subscription tier.
 * 
 * Usage:
 *   export default withPremium(MyPage, 'standard');  // requires standard or higher
 *   export default withPremium(MyPage, 'pro');        // requires pro
 */

import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiLock, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

const TIER_ORDER = { free: 0, standard: 1, pro: 2 };

function getUserTier() {
    try {
        return localStorage.getItem('clipx_tier') || 'free';
    } catch {
        return 'free';
    }
}

function PremiumGate({ requiredTier, children }) {
    const { isAuthenticated, loading } = useAuth();
    const [userTier, setUserTier] = useState('free');
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        setUserTier(getUserTier());
        setChecked(true);
    }, []);

    if (loading || !checked) return null;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-md"
                >
                    <div className="w-20 h-20 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-6">
                        <FiLock className="w-10 h-10 text-primary-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Sign In Required</h2>
                    <p className="text-gray-400 mb-6">You need to be logged in to access this content.</p>
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors"
                    >
                        Sign In
                        <FiArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </div>
        );
    }

    const requiredLevel = TIER_ORDER[requiredTier] || 0;
    const userLevel = TIER_ORDER[userTier] || 0;

    if (userLevel < requiredLevel) {
        const tierNames = { standard: 'Standard', pro: 'Pro' };
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-md"
                >
                    <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
                        <FiLock className="w-10 h-10 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">
                        {tierNames[requiredTier] || 'Premium'} Required
                    </h2>
                    <p className="text-gray-400 mb-6">
                        This content requires a {tierNames[requiredTier] || 'Premium'} subscription or higher.
                        Upgrade your plan to unlock this feature.
                    </p>
                    <Link
                        href={`/subscription?plan=${requiredTier}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all"
                    >
                        Upgrade to {tierNames[requiredTier]}
                        <FiArrowRight className="w-4 h-4" />
                    </Link>
                    <div className="mt-4">
                        <Link href="/pricing" className="text-sm text-gray-500 hover:text-primary-400 transition-colors">
                            Compare all plans →
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return children;
}

export default function withPremium(Component, requiredTier = 'standard') {
    function PremiumWrapped(props) {
        return (
            <PremiumGate requiredTier={requiredTier}>
                <Component {...props} />
            </PremiumGate>
        );
    }
    PremiumWrapped.displayName = `withPremium(${Component.displayName || Component.name || 'Component'})`;
    return PremiumWrapped;
}

export { PremiumGate, getUserTier, TIER_ORDER };
