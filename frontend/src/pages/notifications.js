/**
 * Notifications Page — user notification center with filtering and real-time updates
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBell, FiInfo, FiCheck, FiAlertTriangle, FiGift,
    FiStar, FiTrash2, FiCheckCircle, FiFilter, FiArrowLeft,
    FiShield, FiFilm, FiUsers, FiFlag
} from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { NotificationSkeleton, EmptyState } from '@/components/common/LoadingSpinner';

const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    notifications {
      id
      title
      message
      type
      isRead
      createdAt
    }
  }
`;

const MARK_READ = gql`
  mutation MarkNotificationRead($id: String!) {
    markNotificationRead(id: $id)
  }
`;

const MARK_ALL_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

const typeConfig = {
    info:     { icon: FiInfo,           color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
    success:  { icon: FiCheck,          color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20' },
    warning:  { icon: FiAlertTriangle,  color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
    error:    { icon: FiAlertTriangle,  color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
    promo:    { icon: FiGift,           color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
    update:   { icon: FiStar,           color: 'text-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
    security: { icon: FiShield,         color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
    system:   { icon: FiBell,           color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
    social:   { icon: FiUsers,          color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/20' },
    report:   { icon: FiFlag,           color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
    release:  { icon: FiFilm,           color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

function getTimeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [filter, setFilter] = useState('all'); // 'all', 'unread'

    const { data, loading, refetch } = useQuery(GET_NOTIFICATIONS, {
        skip: !isAuthenticated,
        fetchPolicy: 'cache-and-network',
    });
    const [markRead] = useMutation(MARK_READ);
    const [markAllRead] = useMutation(MARK_ALL_READ);

    const notifications = data?.notifications || [];
    const filtered = filter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkRead = async (id) => {
        try {
            await markRead({ variables: { id } });
            refetch();
        } catch { }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllRead();
            refetch();
        } catch { }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen py-24 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto">
                    <NotificationSkeleton />
                </div>
            </div>
        );
    }
    if (!isAuthenticated) {
        router.push('/auth/login');
        return null;
    }

    return (
        <>
            <Head>
                <title>Notifications - clipX</title>
                <meta name="description" content="View your notifications on clipX" />
            </Head>

            <div className="min-h-screen py-24 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-8"
                    >
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <FiArrowLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="px-2.5 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </h1>
                                <p className="text-gray-400 text-sm mt-1">Stay updated on your activity</p>
                            </div>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-primary-400 hover:text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 rounded-xl border border-primary-500/20 transition-all font-bold"
                            >
                                <FiCheckCircle className="w-4 h-4" />
                                Mark all read
                            </button>
                        )}
                    </motion.div>

                    {/* Filter Tabs */}
                    <div className="flex gap-1 mb-6 bg-white/[0.02] border border-white/10 rounded-xl p-1.5">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'unread', label: `Unread (${unreadCount})` },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id)}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${filter === tab.id
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Notification List */}
                    {loading && !data ? (
                        <NotificationSkeleton />
                    ) : filtered.length > 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                            {filtered.map((notif, idx) => {
                                const config = typeConfig[notif.type] || typeConfig.info;
                                const Icon = config.icon;
                                return (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className={`flex items-start gap-4 p-5 rounded-xl border transition-all cursor-pointer hover:bg-white/[0.03] ${notif.isRead
                                            ? 'bg-white/[0.01] border-white/5'
                                            : `bg-white/[0.03] ${config.border}`
                                            }`}
                                        onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                                    >
                                        <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`w-5 h-5 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-sm font-bold ${notif.isRead ? 'text-gray-400' : 'text-white'}`}>
                                                    {notif.title}
                                                </p>
                                                {!notif.isRead && (
                                                    <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                                            <p className="text-xs text-gray-600 mt-2">{getTimeAgo(notif.createdAt)}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <EmptyState
                            icon={FiBell}
                            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                            message="We'll notify you about new releases, updates, and more"
                        />
                    )}
                </div>
            </div>
        </>
    );
}
