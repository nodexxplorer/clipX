/**
 * GracePeriodBanner — Failed payment warning + retry CTA
 * Shows countdown before downgrade when grace period is active
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiCreditCard, FiClock } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function GracePeriodBanner() {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(null);

  const gracePeriodEnd = user?.grace_period_end || user?.gracePeriodEnd;

  useEffect(() => {
    if (!gracePeriodEnd) return;

    const calculateTime = () => {
      const end = new Date(gracePeriodEnd);
      const now = new Date();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [gracePeriodEnd]);

  // Don't show if no grace period or expired
  if (!gracePeriodEnd || !timeLeft) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <FiAlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-red-400 font-bold text-base">Payment Failed</h3>
            <p className="text-gray-400 text-sm">
              Your subscription will be downgraded in{' '}
              <span className="text-red-400 font-bold">
                {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
                {timeLeft.hours}h {timeLeft.minutes}m
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Countdown chips */}
          <div className="flex items-center gap-1">
            {timeLeft.days > 0 && (
              <div className="text-center px-2 py-1 bg-red-500/20 rounded-lg">
                <p className="text-red-400 text-lg font-black leading-none">{timeLeft.days}</p>
                <p className="text-[10px] text-red-400/60 uppercase font-bold">days</p>
              </div>
            )}
            <div className="text-center px-2 py-1 bg-red-500/20 rounded-lg">
              <p className="text-red-400 text-lg font-black leading-none">{timeLeft.hours}</p>
              <p className="text-[10px] text-red-400/60 uppercase font-bold">hrs</p>
            </div>
            <div className="text-center px-2 py-1 bg-red-500/20 rounded-lg">
              <p className="text-red-400 text-lg font-black leading-none">{timeLeft.minutes}</p>
              <p className="text-[10px] text-red-400/60 uppercase font-bold">min</p>
            </div>
          </div>

          <Link
            href="/subscription"
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-500 transition-colors whitespace-nowrap"
          >
            <FiCreditCard className="w-4 h-4" />
            Retry Payment
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
