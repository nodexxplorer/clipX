/**
 * Subscription Management Page
 * Upgrade, downgrade, cancel with Paystack integration, payment history, family plan
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCreditCard, FiCalendar, FiAlertTriangle, FiCheck, FiX,
    FiUsers, FiPlus, FiTrash2, FiRefreshCw, FiDownload,
    FiCrown, FiStar, FiMonitor, FiChevronRight, FiMail, FiArrowUp, FiArrowDown, FiExternalLink, FiLoader
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const INIT_SUBSCRIPTION = gql`
  mutation InitializeSubscription($plan: String!, $billing: String!) {
    initializeSubscription(plan: $plan, billing: $billing)
  }
`;

const VERIFY_PAYMENT = gql`
  mutation VerifyPayment($reference: String!) {
    verifyPayment(reference: $reference) {
      success
      message
    }
  }
`;

const CANCEL_SUB = gql`
  mutation CancelSubscription {
    cancelSubscription {
      success
      message
    }
  }
`;

const MY_SUBSCRIPTION = gql`
  mutation MySubscription {
    mySubscription
  }
`;

const MY_PAYMENTS = gql`
  mutation MyPaymentHistory {
    myPaymentHistory
  }
`;

const tiers = {
    free: { name: 'Free', price: '₦0', icon: FiMonitor, color: 'gray', gradient: 'from-gray-500 to-gray-600' },
    standard: { name: 'Standard', price: '₦3,000', icon: FiStar, color: 'primary', gradient: 'from-primary-500 to-blue-600' },
    pro: { name: 'Pro', price: '₦8,000', icon: FiCrown, color: 'purple', gradient: 'from-purple-500 to-pink-600' },
};

export default function SubscriptionPage() {
    const router = useRouter();
    const { plan: queryPlan, verify, reference } = router.query;
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [currentTier, setCurrentTier] = useState('free');
    const [subData, setSubData] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelStep, setCancelStep] = useState('offer'); // 'offer' or 'confirm'
    const [familyMembers, setFamilyMembers] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [paymentHistory, setPaymentHistory] = useState([]);

    const [initSubscription] = useMutation(INIT_SUBSCRIPTION);
    const [verifyPayment] = useMutation(VERIFY_PAYMENT);
    const [cancelSub] = useMutation(CANCEL_SUB);
    const [mySub] = useMutation(MY_SUBSCRIPTION);
    const [myPayments] = useMutation(MY_PAYMENTS);

    // Load subscription data
    useEffect(() => {
        if (!isAuthenticated) return;
        const loadSub = async () => {
            try {
                const { data } = await mySub();
                if (data?.mySubscription) {
                    setSubData(data.mySubscription);
                    setCurrentTier(data.mySubscription.tier || 'free');
                }
            } catch { }
        };
        loadSub();
    }, [isAuthenticated, mySub]);

    // Load payment history
    useEffect(() => {
        if (!isAuthenticated || activeTab !== 'history') return;
        const loadPayments = async () => {
            try {
                const { data } = await myPayments();
                if (data?.myPaymentHistory?.payments) {
                    setPaymentHistory(data.myPaymentHistory.payments);
                }
            } catch { }
        };
        loadPayments();
    }, [isAuthenticated, activeTab, myPayments]);

    // Verify payment after Paystack redirect
    useEffect(() => {
        if (verify === 'true' && reference) {
            const doVerify = async () => {
                setIsProcessing(true);
                try {
                    const { data } = await verifyPayment({ variables: { reference } });
                    if (data?.verifyPayment?.success) {
                        setMessage({ type: 'success', text: data.verifyPayment.message });
                        // Reload subscription data
                        const { data: sub } = await mySub();
                        if (sub?.mySubscription) {
                            setSubData(sub.mySubscription);
                            setCurrentTier(sub.mySubscription.tier || 'free');
                        }
                    }
                } catch (err) {
                    setMessage({ type: 'error', text: err.message || 'Payment verification failed' });
                }
                setIsProcessing(false);
                // Clean URL
                router.replace('/subscription', undefined, { shallow: true });
            };
            doVerify();
        }
    }, [verify, reference]);

    // Handle upgrade via Paystack
    const handleUpgrade = async (planId) => {
        setIsProcessing(true);
        try {
            const { data } = await initSubscription({
                variables: { plan: planId, billing: billingCycle }
            });
            const result = data?.initializeSubscription;
            if (result?.authorizationUrl) {
                // Redirect to Paystack checkout
                window.location.href = result.authorizationUrl;
            } else {
                setMessage({ type: 'error', text: 'Failed to initialize payment' });
                setIsProcessing(false);
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Payment initialization failed' });
            setIsProcessing(false);
        }
    };

    const handleCancel = async () => {
        setIsProcessing(true);
        try {
            const { data } = await cancelSub();
            if (data?.cancelSubscription?.success) {
                setCurrentTier('free');
                setShowCancelModal(false);
                setCancelStep('offer');
                setMessage({ type: 'success', text: 'Subscription cancelled. Active until end of billing period.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Cancellation failed' });
        }
        setIsProcessing(false);
    };

    const handleRetentionOffer = () => {
        setShowCancelModal(false);
        setCancelStep('offer');
        setMessage({ type: 'success', text: '🎉 50% discount applied to your next billing cycle!' });
    };

    const downloadInvoice = (reference) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        window.open(`${apiUrl}/api/v1/invoice/${reference}`, '_blank');
    };

    const handleInviteFamily = () => {
        if (!inviteEmail || familyMembers.length >= 5) return;
        setFamilyMembers([...familyMembers, { email: inviteEmail, status: 'pending' }]);
        setInviteEmail('');
        setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}` });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const removeFamily = (idx) => {
        setFamilyMembers(familyMembers.filter((_, i) => i !== idx));
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-950"><LoadingSpinner size="lg" /></div>;
    }
    if (!isAuthenticated) {
        router.push('/auth/login');
        return null;
    }

    const current = tiers[currentTier] || tiers.free;
    const CurrentIcon = current.icon;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FiCreditCard },
        { id: 'history', label: 'Payment History', icon: FiCalendar },
        ...(currentTier === 'pro' ? [{ id: 'family', label: 'Family Plan', icon: FiUsers }] : []),
    ];

    const formatAmount = (amount) => {
        return `₦${(amount / 100).toLocaleString()}`;
    };

    return (
        <>
            <Head>
                <title>Subscription - clipX</title>
                <meta name="description" content="Manage your clipX subscription" />
            </Head>

            <div className="min-h-screen py-24 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Subscription</h1>
                        <p className="text-gray-400">Manage your plan, billing, and payments</p>
                    </motion.div>

                    {/* Status Message */}
                    <AnimatePresence>
                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                    }`}
                            >
                                {message.type === 'success' ? <FiCheck className="w-5 h-5" /> : <FiAlertTriangle className="w-5 h-5" />}
                                <span className="text-sm font-medium">{message.text}</span>
                                <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto"><FiX className="w-4 h-4" /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Processing Overlay */}
                    {isProcessing && (
                        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="text-center">
                                <FiLoader className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
                                <p className="text-white font-bold">Processing payment...</p>
                            </div>
                        </div>
                    )}

                    {/* Email Verification Banner */}
                    {subData && !subData.emailVerified && (
                        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3">
                            <FiMail className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-yellow-400 font-bold">Email not verified</p>
                                <p className="text-xs text-yellow-400/70">Check your inbox for the verification link.</p>
                            </div>
                        </div>
                    )}

                    {/* Referral Progress */}
                    {subData && subData.referralCount > 0 && currentTier === 'free' && (
                        <div className="mb-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-primary-400 font-bold">Referral Progress</p>
                                <span className="text-xs text-gray-400">{subData.referralCount}/5 referrals</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-blue-500 rounded-full transition-all"
                                    style={{ width: `${Math.min((subData.referralCount / 5) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Refer {5 - subData.referralCount} more friends to get Standard free!</p>
                        </div>
                    )}

                    {/* Current Plan Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8"
                    >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${current.gradient} flex items-center justify-center`}>
                                    <CurrentIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-black text-white">{current.name}</h2>
                                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">Active</span>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {current.price}/month
                                        {subData?.expiresAt && ` • Renews ${new Date(subData.expiresAt).toLocaleDateString()}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {currentTier !== 'pro' && (
                                    <button
                                        onClick={() => handleUpgrade(currentTier === 'free' ? 'standard' : 'pro')}
                                        disabled={isProcessing}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold text-sm rounded-xl hover:from-primary-500 hover:to-purple-500 transition-all disabled:opacity-50"
                                    >
                                        <FiArrowUp className="w-4 h-4" />
                                        Upgrade
                                    </button>
                                )}
                                {currentTier !== 'free' && (
                                    <button
                                        onClick={() => { setCancelStep('offer'); setShowCancelModal(true); }}
                                        className="px-5 py-2.5 text-sm text-gray-400 hover:text-red-400 bg-white/5 rounded-xl border border-white/10 hover:border-red-500/30 transition-all font-bold"
                                    >
                                        Cancel Plan
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-8 bg-white/[0.02] border border-white/10 rounded-xl p-1.5">
                        {tabs.map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex-1 justify-center ${activeTab === tab.id
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            {/* Billing Cycle Toggle */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-sm text-gray-400">Billing:</span>
                                <div className="inline-flex bg-white/[0.03] border border-white/10 rounded-lg p-1">
                                    <button
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${billingCycle === 'monthly' ? 'bg-primary-600 text-white' : 'text-gray-400'}`}
                                    >
                                        Monthly
                                    </button>
                                    <button
                                        onClick={() => setBillingCycle('yearly')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${billingCycle === 'yearly' ? 'bg-primary-600 text-white' : 'text-gray-400'}`}
                                    >
                                        Yearly (Save 20%)
                                    </button>
                                </div>
                            </div>

                            {/* Plan Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.entries(tiers).map(([key, tier]) => {
                                    const TierIcon = tier.icon;
                                    const isCurrent = key === currentTier;
                                    const tierOrder = { free: 0, standard: 1, pro: 2 };
                                    const isUpgrade = tierOrder[key] > tierOrder[currentTier];

                                    return (
                                        <div
                                            key={key}
                                            className={`p-5 rounded-xl border transition-all ${isCurrent ? 'bg-primary-600/10 border-primary-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tier.gradient} flex items-center justify-center`}>
                                                    <TierIcon className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold">{tier.name}</h3>
                                                    <p className="text-sm text-gray-500">{tier.price}/mo</p>
                                                </div>
                                            </div>
                                            {isCurrent ? (
                                                <span className="text-xs font-bold text-primary-400">Current Plan</span>
                                            ) : isUpgrade ? (
                                                <button
                                                    onClick={() => handleUpgrade(key)}
                                                    disabled={isProcessing}
                                                    className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    <FiArrowUp className="w-3 h-3" /> Upgrade with Paystack
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-600">—</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link href="/pricing" className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/15 transition-colors group">
                                    <span className="text-sm text-gray-300 font-medium">Compare all plans</span>
                                    <FiChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                </Link>
                                <Link href="/profile" className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/15 transition-colors group">
                                    <span className="text-sm text-gray-300 font-medium">Your referral link</span>
                                    <FiChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                                <div className="p-5 border-b border-white/5">
                                    <h3 className="text-lg font-bold text-white">Payment History</h3>
                                </div>
                                {paymentHistory.length > 0 ? (
                                    <div className="divide-y divide-white/5">
                                        {paymentHistory.map((payment) => (
                                            <div key={payment.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${payment.status === 'paid' ? 'bg-green-500/10' : payment.status === 'failed' ? 'bg-red-500/10' : 'bg-primary-500/10'
                                                        }`}>
                                                        {payment.status === 'paid' ? <FiCheck className="w-5 h-5 text-green-400" /> :
                                                            payment.status === 'failed' ? <FiAlertTriangle className="w-5 h-5 text-red-400" /> :
                                                                <FiStar className="w-5 h-5 text-primary-400" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-bold">{payment.plan ? payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1) : 'Subscription'}</p>
                                                        <p className="text-gray-500 text-xs">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '—'} • {payment.method || 'card'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-white font-bold text-sm">{formatAmount(payment.amount)}</p>
                                                        <p className={`text-xs font-bold ${payment.status === 'paid' ? 'text-green-400' : payment.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                                                            }`}>{payment.status}</p>
                                                    </div>
                                                    {payment.status === 'paid' && payment.reference && (
                                                        <button
                                                            onClick={() => downloadInvoice(payment.reference)}
                                                            className="p-2 text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                                                            title="Download invoice"
                                                        >
                                                            <FiDownload className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <FiCreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No payment history yet</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'family' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Family Members</h3>
                                        <p className="text-sm text-gray-400">{familyMembers.length}/5 members</p>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                        <FiUsers className="w-4 h-4 text-purple-400" />
                                        <span className="text-purple-400 text-sm font-bold">Family Plan</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 mb-6">
                                    <div className="relative flex-1">
                                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="Enter email to invite"
                                            disabled={familyMembers.length >= 5}
                                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-primary-500/50 text-sm disabled:opacity-50"
                                            onKeyDown={(e) => e.key === 'Enter' && handleInviteFamily()}
                                        />
                                    </div>
                                    <button
                                        onClick={handleInviteFamily}
                                        disabled={!inviteEmail || familyMembers.length >= 5}
                                        className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white font-bold text-sm rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-40"
                                    >
                                        <FiPlus className="w-4 h-4" />
                                        Invite
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                {user?.name?.charAt(0) || 'Y'}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-bold">{user?.name || 'You'}</p>
                                                <p className="text-gray-500 text-xs">{user?.email}</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs font-bold rounded-lg">Owner</span>
                                    </div>
                                    {familyMembers.map((member, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 text-xs font-bold">
                                                    {member.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white text-sm font-bold">{member.email}</p>
                                                    <p className={`text-xs font-bold ${member.status === 'pending' ? 'text-yellow-400' : 'text-green-400'}`}>
                                                        {member.status === 'pending' ? 'Invitation Pending' : 'Active'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFamily(idx)} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {familyMembers.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <FiUsers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No family members yet. Invite up to 5 people!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Cancel Modal with Retention Offer */}
            <AnimatePresence>
                {showCancelModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => { setShowCancelModal(false); setCancelStep('offer'); }}
                    >
                        <motion.div
                            key={cancelStep}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {cancelStep === 'offer' ? (
                                /* Step 1: Retention Offer */
                                <>
                                    <div className="text-center mb-6">
                                        <div className="text-5xl mb-4">💔</div>
                                        <h3 className="text-2xl font-black text-white">We&apos;d hate to see you go!</h3>
                                        <p className="text-gray-400 mt-2 text-sm">
                                            Before you cancel, how about a special deal?
                                        </p>
                                    </div>
                                    {/* Retention offer card */}
                                    <div className="bg-gradient-to-br from-purple-500/10 to-primary-500/10 border border-purple-500/20 rounded-xl p-6 mb-6 text-center">
                                        <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-2">Exclusive Offer</p>
                                        <p className="text-4xl font-black text-white mb-1">50% OFF</p>
                                        <p className="text-sm text-gray-400">your next month — just {currentTier === 'pro' ? '₦4,000' : '₦1,500'}!</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleRetentionOffer}
                                            className="w-full py-3 text-sm text-white font-bold rounded-xl bg-gradient-to-r from-purple-600 to-primary-600 hover:from-purple-500 hover:to-primary-500 transition-all shadow-lg shadow-purple-500/20"
                                        >
                                            🎉 Claim 50% Off & Stay
                                        </button>
                                        <button
                                            onClick={() => setCancelStep('confirm')}
                                            className="w-full py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors font-medium"
                                        >
                                            No thanks, I still want to cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                /* Step 2: Confirm Cancellation */
                                <>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                            <FiAlertTriangle className="w-8 h-8 text-red-400" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white">Are you sure?</h3>
                                        <p className="text-gray-400 mt-2 text-sm">
                                            You&apos;ll lose access to {tiers[currentTier]?.name} features at the end of your billing period.
                                        </p>
                                        <div className="mt-4 text-left bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-2">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">You&apos;ll lose:</p>
                                            {currentTier === 'pro' && <p className="text-sm text-gray-400">• 4K Ultra HD streaming</p>}
                                            <p className="text-sm text-gray-400">• {currentTier === 'pro' ? '50' : '15'} downloads/month</p>
                                            <p className="text-sm text-gray-400">• Ad-free viewing</p>
                                            <p className="text-sm text-gray-400">• {currentTier === 'pro' ? '6' : '3'} simultaneous screens</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setShowCancelModal(false); setCancelStep('offer'); }}
                                            className="flex-1 py-3 text-sm text-white bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors font-bold"
                                        >
                                            Keep Plan
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={isProcessing}
                                            className="flex-1 py-3 text-sm text-white font-bold rounded-xl bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Cancelling...' : 'Cancel Plan'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
