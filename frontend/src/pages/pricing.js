/**
 * Pricing Page
 * Free / Standard / Pro tier comparison with beautiful UI
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
    FiCheck, FiX, FiZap, FiStar, FiFrown, FiArrowRight,
    FiMonitor, FiDownload, FiFilm, FiMessageCircle, FiShield,
    FiUsers, FiClock, FiSearch, FiHelpCircle
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

const plans = [
    {
        id: 'free',
        name: 'Free',
        price: '₦0',
        period: '/month',
        tagline: 'Get started for free',
        icon: FiMonitor,
        gradient: 'from-gray-500 to-gray-600',
        borderColor: 'border-white/10',
        popular: false,
        features: [
            { text: '480p SD quality', included: true },
            // { text: '1 screen at a time', included: true },
            { text: '5 downloads/month', included: true },
            { text: 'Limited content library', included: true },
            { text: 'Basic watchlist (10 titles)', included: true },
            { text: 'Watch history (last 30 days)', included: true },
            { text: 'Basic title search', included: true },
            { text: 'FAQ support only', included: true },
            { text: 'Heavy ads (pre-roll, mid-roll, banners)', included: 'warn' },
            { text: 'HD / 4K quality', included: false },
            { text: 'AI recommendations', included: false },
            { text: 'Family plan', included: false },
        ],
        cta: 'Current Plan',
        ctaStyle: 'bg-white/5 text-gray-400 border border-white/10 cursor-default',
    },
    {
        id: 'standard',
        name: 'Standard',
        price: '₦3,000',
        period: '/month',
        tagline: 'For the everyday viewer',
        icon: FiStar,
        gradient: 'from-primary-500 to-blue-600',
        borderColor: 'border-primary-500/30',
        popular: true,
        features: [
            { text: '720p HD quality', included: true },
            // { text: '2 screens at a time', included: true },
            { text: '15 downloads/month', included: true },
            { text: 'Full content library', included: true },
            { text: 'Watchlist (20 titles)', included: true },
            { text: 'Full watch history', included: true },
            { text: 'Advanced search & filters', included: true },
            { text: 'Email support', included: true },
            { text: 'Reduced ads', included: true },
            { text: '24/7 Community Chat', included: true },
            { text: 'AI recommendations', included: false },
            { text: 'Family plan', included: false },
        ],
        cta: 'Upgrade to Standard',
        ctaStyle: 'bg-gradient-to-r from-primary-600 to-blue-600 text-white hover:from-primary-500 hover:to-blue-500 shadow-lg shadow-primary-600/20',
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '₦8,000',
        period: '/month',
        tagline: 'The ultimate experience',
        icon: FiFrown,
        gradient: 'from-purple-500 to-pink-600',
        borderColor: 'border-purple-500/30',
        popular: false,
        features: [
            { text: '1080p + 4K Ultra HD', included: true },
            // { text: '5 screens at a time', included: true },
            { text: 'Unlimited downloads', included: true },
            // { text: 'Full content library + early access', included: true },
            { text: 'Unlimited watchlist', included: true },
            { text: 'Watch history & yearly stats', included: true },
            { text: 'AI-powered search & recommendations', included: true },
            { text: 'Priority email support', included: true },
            { text: 'Zero ads', included: true },
            { text: 'Resume across devices', included: true },
            { text: 'Family plan (up to 4 members)', included: true },
            { text: 'Early access to new releases', included: true },
        ],
        cta: 'Go Pro',
        ctaStyle: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/20',
    },
    {
        id: 'family',
        name: 'Family',
        price: '₦12,000',
        period: '/month',
        tagline: 'Stream together, save together',
        icon: FiUsers,
        gradient: 'from-emerald-500 to-teal-600',
        borderColor: 'border-emerald-500/30',
        popular: false,
        features: [
            { text: '1080p + 4K Ultra HD', included: true },
            { text: 'Up to 5 member accounts', included: true },
            { text: 'Individual profiles & watchlists', included: true },
            { text: 'Unlimited downloads', included: true },
            { text: 'Full content library', included: true },
            { text: 'AI-powered recommendations', included: true },
            { text: 'Zero ads', included: true },
            { text: 'Parental controls per profile', included: true },
            { text: 'Invite members via email', included: true },
            { text: 'Family dashboard', included: true },
            { text: 'Priority support', included: true },
        ],
        cta: 'Start Family Plan',
        ctaStyle: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/20',
    },
];

const faqs = [
    {
        q: 'Can I cancel anytime?',
        a: 'Yes! You can cancel your subscription at any time from your account settings. Your plan will remain active until the end of the billing period.',
    },
    {
        q: 'Is there a free trial?',
        a: 'Every new subscription starts with 1 month free! No credit card required for the free tier.',
    },
    {
        q: 'How does the family plan work?',
        a: 'The Pro family plan allows you to invite up to 5 members. Each member gets their own profile and watchlist. The subscription cost is shared via joint payment.',
    },
    {
        q: 'What happens if my payment fails?',
        a: 'We\'ll retry the payment 3 times over 7 days and notify you. Your content remains accessible during this period. After that, your plan is paused until payment succeeds.',
    },
    {
        q: 'Can I upgrade or downgrade my plan?',
        a: 'Absolutely. Changes take effect immediately when upgrading, or at the end of your billing period when downgrading. The price difference is prorated.',
    },
    {
        q: 'How do referral rewards work?',
        a: 'Refer 5 friends who sign up and your account is automatically upgraded to Standard tier for free as a promotional reward!',
    },
];

export default function PricingPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [openFaq, setOpenFaq] = useState(null);

    const handleSelectPlan = (planId) => {
        if (!isAuthenticated) {
            router.push('/auth/register');
            return;
        }
        router.push(`/subscription?plan=${planId}`);
    };

    return (
        <>
            <Head>
                <title>Pricing - clipX</title>
                <meta name="description" content="Choose the perfect plan for your streaming needs. Free, Standard, or Pro." />
            </Head>

            <div className="min-h-screen py-24 px-4 sm:px-6">
                {/* Hero */}
                <div className="text-center max-w-4xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/10 text-primary-400 text-sm font-bold rounded-full border border-primary-500/20 mb-6">
                            <FiZap className="w-4 h-4" />
                            Simple, transparent pricing
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                            Pick Your Perfect
                            <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Plan</span>
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                            Start free, upgrade when you're ready. Every plan includes a{' '}
                            <strong className="text-primary-400">1-month free trial</strong> on your first subscription.
                        </p>
                    </motion.div>

                    {/* Billing Toggle */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8 inline-flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl p-1.5"
                    >
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${billingCycle === 'monthly'
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly'
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Yearly
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
                                Save 20%
                            </span>
                        </button>
                    </motion.div>
                </div>

                {/* Plans Grid */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                    {plans.map((plan, idx) => {
                        const yearlyPrice = plan.id === 'standard' ? '₦28,800' : plan.id === 'pro' ? '₦76,800' : plan.id === 'family' ? '₦115,200' : '₦0';
                        const displayPrice = billingCycle === 'yearly' && plan.id !== 'free' ? yearlyPrice : plan.price;
                        const displayPeriod = billingCycle === 'yearly' && plan.id !== 'free' ? '/year' : '/month';
                        const Icon = plan.icon;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 + 0.3 }}
                                className={`relative bg-white/[0.02] backdrop-blur-sm rounded-2xl border ${plan.borderColor} p-8 flex flex-col ${plan.popular ? 'ring-1 ring-primary-500/30 scale-[1.02] md:scale-105 z-10' : ''
                                    } hover:border-white/20 transition-all group`}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="px-4 py-1.5 bg-gradient-to-r from-primary-600 to-blue-600 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-lg shadow-primary-600/30">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {/* Plan Header */}
                                <div className="mb-6">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} mb-4`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{plan.tagline}</p>
                                </div>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-end gap-1">
                                        <span className="text-4xl font-black text-white">{displayPrice}</span>
                                        <span className="text-gray-500 text-sm mb-1">{displayPeriod}</span>
                                    </div>
                                    {billingCycle === 'yearly' && plan.id !== 'free' && (
                                        <p className="text-green-400 text-xs font-bold mt-1">
                                            Save {plan.id === 'standard' ? '₦7,200' : '₦19,200'}/year
                                        </p>
                                    )}
                                </div>

                                {/* Features List */}
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            {feature.included === true ? (
                                                <FiCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            ) : feature.included === 'warn' ? (
                                                <FiX className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <FiX className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                            )}
                                            <span className={`text-sm leading-relaxed ${feature.included === true ? 'text-gray-300' :
                                                    feature.included === 'warn' ? 'text-yellow-500/80' :
                                                        'text-gray-600 line-through'
                                                }`}>
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <button
                                    onClick={() => plan.id !== 'free' && handleSelectPlan(plan.id)}
                                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${plan.ctaStyle}`}
                                >
                                    {plan.cta}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Referral Promo Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto mb-24"
                >
                    <div className="relative overflow-hidden bg-gradient-to-br from-primary-600/20 to-purple-600/20 border border-primary-500/20 rounded-2xl p-8 md:p-12">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="relative flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <FiUsers className="w-5 h-5 text-primary-400" />
                                    <span className="text-primary-400 font-bold text-sm uppercase tracking-wider">Referral Reward</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-white mb-3">
                                    Refer 5 Friends, Get Standard Free!
                                </h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Share your unique referral link. When 5 friends sign up through your link,
                                    your account is automatically upgraded to the Standard tier — completely free.
                                </p>
                            </div>
                            <Link
                                href={isAuthenticated ? '/profile' : '/auth/register'}
                                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold rounded-xl hover:from-primary-500 hover:to-purple-500 transition-all shadow-lg shadow-primary-600/20 whitespace-nowrap"
                            >
                                {isAuthenticated ? 'Get My Referral Link' : 'Sign Up to Start'}
                                <FiArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto mb-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-white mb-3">Frequently Asked Questions</h2>
                        <p className="text-gray-400">Everything you need to know about our plans</p>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full text-left p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="font-bold text-white text-sm">{faq.q}</span>
                                        <FiHelpCircle className={`w-5 h-5 flex-shrink-0 transition-colors ${openFaq === idx ? 'text-primary-400' : 'text-gray-600'}`} />
                                    </div>
                                    {openFaq === idx && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="text-gray-400 text-sm mt-3 leading-relaxed"
                                        >
                                            {faq.a}
                                        </motion.p>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="text-center">
                    <p className="text-gray-500 text-sm">
                        All plans include our core streaming features. Need help choosing?{' '}
                        <Link href="/help" className="text-primary-400 hover:text-primary-300 font-bold">Contact us</Link>
                    </p>
                </div>
            </div>
        </>
    );
}
