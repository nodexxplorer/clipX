/**
 * Change Password Page
 * Allows authenticated users to update their password
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiArrowLeft, FiShield } from 'react-icons/fi';
import { useMutation } from '@apollo/client/react';
import { useAuth } from '@/contexts/AuthContext';
import { CHANGE_PASSWORD_MUTATION } from '@/graphql/mutations/authMutation';

export default function ChangePasswordPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [changePassword] = useMutation(CHANGE_PASSWORD_MUTATION);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    const passwordStrength = (pwd) => {
        if (!pwd) return { score: 0, label: '', color: '' };
        let score = 0;
        if (pwd.length >= 6) score++;
        if (pwd.length >= 10) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
        if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
        if (score <= 3) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
        if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-green-500' };
        return { score: 5, label: 'Very Strong', color: 'bg-emerald-500' };
    };

    const strength = passwordStrength(newPassword);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!currentPassword) {
            setMessage({ type: 'error', text: 'Please enter your current password' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (currentPassword === newPassword) {
            setMessage({ type: 'error', text: 'New password must be different from current password' });
            return;
        }

        setIsSubmitting(true);
        try {
            const { data } = await changePassword({
                variables: { currentPassword, newPassword }
            });

            if (data?.changePassword?.success) {
                setMessage({ type: 'success', text: 'Password changed successfully! Redirecting...' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => router.push('/profile'), 2000);
            } else {
                setMessage({ type: 'error', text: data?.changePassword?.message || 'Failed to change password' });
            }
        } catch (err) {
            const errorMsg = err.graphQLErrors?.[0]?.message || err.message || 'Failed to change password';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Change Password — clipX</title>
                <meta name="description" content="Update your clipX account password" />
            </Head>

            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Back button */}
                    <button
                        onClick={() => router.push('/profile')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        Back to Settings
                    </button>

                    <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                <FiShield className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Change Password</h1>
                                <p className="text-sm text-gray-400">Keep your account secure</p>
                            </div>
                        </div>

                        {/* Message */}
                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${message.type === 'success'
                                        ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                    }`}
                            >
                                {message.type === 'success' ? <FiCheck className="w-5 h-5 flex-shrink-0" /> : <FiLock className="w-5 h-5 flex-shrink-0" />}
                                {message.text}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Current Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type={showCurrent ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        {showCurrent ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        {showNew ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {/* Password Strength */}
                                {newPassword && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-gray-700'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className={`text-xs ${strength.color.replace('bg-', 'text-')}`}>
                                            {strength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className={`w-full pl-12 pr-12 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-500 outline-none focus:ring-1 transition-all ${confirmPassword && confirmPassword !== newPassword
                                                ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                                                : confirmPassword && confirmPassword === newPassword
                                                    ? 'border-green-500/50 focus:border-green-500/50 focus:ring-green-500/20'
                                                    : 'border-white/10 focus:border-primary-500/50 focus:ring-primary-500/20'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        {showConfirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {confirmPassword && confirmPassword !== newPassword && (
                                    <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                                className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:shadow-none"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Changing Password...
                                    </span>
                                ) : (
                                    'Change Password'
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
