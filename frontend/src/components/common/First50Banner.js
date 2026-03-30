/**
 * First50Banner — Shows remaining premium slots countdown
 * "First 50 users get premium free!"
 */

import { motion } from 'framer-motion';
import { FiStar, FiArrowRight } from 'react-icons/fi';
import { useQuery } from '@apollo/client/react';
import { GET_PREMIUM_STATS } from '@/graphql/mutations/authMutation';
import Link from 'next/link';

export default function First50Banner() {
  const { data, loading } = useQuery(GET_PREMIUM_STATS, {
    fetchPolicy: 'cache-and-network',
  });

  const stats = data?.premiumSignupStats;
  if (loading || !stats || !stats.isActive || stats.remainingSlots <= 0) return null;

  const progress = ((50 - stats.remainingSlots) / 50) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-600/10 via-primary-600/10 to-pink-600/10 border border-purple-500/20 rounded-2xl p-5 relative overflow-hidden"
    >
      {/* Decorative glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <FiStar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-black text-base">🔥 First 50 Get Premium Free!</h3>
            <p className="text-gray-400 text-sm">
              Only <span className="text-purple-400 font-bold">{stats.remainingSlots}</span> spots remaining
            </p>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{50 - stats.remainingSlots} claimed</span>
            <span>{stats.remainingSlots} left</span>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-primary-500 rounded-full"
            />
          </div>
        </div>

        <Link href="/subscription" className="flex items-center gap-1 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/20 whitespace-nowrap">
          Claim Now <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
