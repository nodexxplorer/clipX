// src/components/common/withPremium.jsx

import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { FiLock, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

// Tier hierarchy — must match what the backend stores in subscription_tier
export const TIER_ORDER = { free: 0, standard: 1, pro: 2 };

// ---------------------------------------------------------------------------
// PremiumGate — the actual gate component used by withPremium and directly
// ---------------------------------------------------------------------------
export function PremiumGate({ requiredTier, children }) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  // While the initial `me` query is in flight, render nothing to avoid
  // a flash of gated content before the user object arrives.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  // Not logged in at all
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
          <p className="text-gray-400 mb-6">
            You need to be logged in to access this content.
          </p>
          <Link
            href={`/auth/login?redirect=${encodeURIComponent(router.asPath)}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors"
          >
            Sign In
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  // ----- CRITICAL: read tier from server-verified user object only ----------
  // user.subscriptionTier is set by create_user_response() in schema.py which
  // maps it directly from the database row. It is never derived from any
  // client-supplied value, localStorage entry, or query parameter.
  const userTier     = user?.subscriptionTier ?? 'free';
  const userLevel    = TIER_ORDER[userTier]    ?? 0;
  const requiredLevel = TIER_ORDER[requiredTier] ?? 1;
  // -------------------------------------------------------------------------

  if (userLevel >= requiredLevel) {
    // User meets the tier requirement — render the protected content
    return children;
  }

  // Tier insufficient — show upgrade prompt
  const tierLabels = { standard: 'Standard', pro: 'Pro' };
  const tierLabel  = tierLabels[requiredTier] ?? 'Premium';

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
          {tierLabel} Required
        </h2>
        <p className="text-gray-400 mb-6">
          This content requires a <span className="text-white font-semibold">{tierLabel}</span> subscription
          or higher. Upgrade your plan to unlock access.
        </p>
        <Link
          href={`/subscription?plan=${requiredTier}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all"
        >
          Upgrade to {tierLabel}
          <FiArrowRight className="w-4 h-4" />
        </Link>
        <div className="mt-4">
          <Link
            href="/pricing"
            className="text-sm text-gray-500 hover:text-primary-400 transition-colors"
          >
            Compare all plans →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
export default function withPremium(Component, requiredTier = 'standard') {
  function PremiumWrapped(props) {
    return (
      <PremiumGate requiredTier={requiredTier}>
        <Component {...props} />
      </PremiumGate>
    );
  }

  PremiumWrapped.displayName = `withPremium(${
    Component.displayName || Component.name || 'Component'
  })`;

  return PremiumWrapped;
}