/**
 * Referrals Page — share referral link, track progress, earn rewards
 */

import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
    FiUsers, FiCopy, FiCheck, FiGift, FiArrowLeft,
    FiShare2, FiStar, FiAward, FiChevronRight
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';

const REWARDS = [
    { count: 1, reward: '1 week of Standard free', icon: FiStar },
    { count: 3, reward: '1 month of Standard free', icon: FiGift },
    { count: 5, reward: 'Permanent Standard plan', icon: FiAward },
    { count: 10, reward: '1 month Pro upgrade', icon: FiAward },
];

export default function ReferralsPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [copied, setCopied] = useState(false);

    const referralCode = user?.referralCode || user?.id?.slice(0, 8) || 'INVITE';
    const referralCount = user?.referralCount || 0;
    const referralLink = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/register?ref=${referralCode}`
        : `https://clipx.com/auth/register?ref=${referralCode}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = referralLink;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join me on clipX!',
                    text: 'Sign up for clipX and get access to thousands of movies and shows!',
                    url: referralLink,
                });
            } catch { }
        } else {
            handleCopy();
        }
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-950"><LoadingSpinner size="lg" /></div>;
    }
    if (!isAuthenticated) {
        router.push('/auth/login');
        return null;
    }

    const nextReward = REWARDS.find(r => r.count > referralCount);

    return (
        <>
            <Head>
                <title>Referrals - clipX</title>
                <meta name="description" content="Invite friends and earn rewards on clipX" />
            </Head>

            <div className="min-h-screen py-24 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <FiArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <h1 className="text-3xl md:text-4xl font-black text-white">Referrals</h1>
                        </div>
                        <p className="text-gray-400 ml-12">Invite friends and earn free premium access</p>
                    </motion.div>

                    {/* Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8 bg-gradient-to-br from-primary-600/10 to-purple-600/10 border border-primary-500/20 rounded-2xl p-8 text-center"
                    >
                        <div className="w-16 h-16 mx-auto mb-4 bg-primary-500/20 rounded-2xl flex items-center justify-center">
                            <FiUsers className="w-8 h-8 text-primary-400" />
                        </div>
                        <p className="text-5xl font-black text-white mb-2">{referralCount}</p>
                        <p className="text-gray-400 font-medium">
                            {referralCount === 1 ? 'friend referred' : 'friends referred'}
                        </p>

                        {nextReward && (
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-gray-500">Progress to next reward</p>
                                    <p className="text-xs text-primary-400 font-bold">{referralCount}/{nextReward.count}</p>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all"
                                        style={{ width: `${Math.min((referralCount / nextReward.count) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-400 mt-3">
                                    <span className="text-white font-bold">{nextReward.count - referralCount} more</span> to unlock: {nextReward.reward}
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* Referral Link */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mb-8 bg-white/[0.02] border border-white/10 rounded-2xl p-6"
                    >
                        <p className="text-white font-bold mb-3">Your Referral Link</p>
                        <div className="flex gap-2">
                            <div className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-gray-400 text-sm truncate select-all">
                                {referralLink}
                            </div>
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${copied
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-primary-600 text-white hover:bg-primary-500'
                                    }`}
                            >
                                {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleShare}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm font-bold hover:bg-white/10 transition-colors"
                            >
                                <FiShare2 className="w-4 h-4" />
                                Share Link
                            </button>
                        </div>
                    </motion.div>

                    {/* Reward Tiers */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white">Reward Tiers</h3>
                            <p className="text-gray-500 text-sm mt-1">The more friends you invite, the better it gets</p>
                        </div>
                        <div className="divide-y divide-white/5">
                            {REWARDS.map((tier) => {
                                const RewardIcon = tier.icon;
                                const unlocked = referralCount >= tier.count;
                                return (
                                    <div
                                        key={tier.count}
                                        className={`flex items-center gap-4 px-6 py-5 ${unlocked ? 'bg-primary-500/5' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${unlocked
                                            ? 'bg-primary-500/20'
                                            : 'bg-white/5'
                                            }`}>
                                            {unlocked ? (
                                                <FiCheck className="w-5 h-5 text-primary-400" />
                                            ) : (
                                                <RewardIcon className="w-5 h-5 text-gray-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${unlocked ? 'text-primary-400' : 'text-white'}`}>
                                                {tier.count} {tier.count === 1 ? 'Referral' : 'Referrals'}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-0.5">{tier.reward}</p>
                                        </div>
                                        {unlocked && (
                                            <span className="px-2.5 py-1 bg-primary-500/20 text-primary-400 text-xs font-bold rounded-lg">
                                                Unlocked ✓
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Bottom CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8"
                    >
                        <Link
                            href="/subscription"
                            className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/15 transition-colors group"
                        >
                            <span className="text-sm text-gray-300 font-medium">View subscription plans</span>
                            <FiChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
