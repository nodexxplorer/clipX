/**
 * LoginActivityLog — Security log showing recent login activity
 * Displays device, IP, action, time for each login event
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiMonitor, FiSmartphone, FiGlobe, FiClock, FiCheck,
  FiX, FiAlertTriangle, FiShield, FiRefreshCw
} from 'react-icons/fi';
import { useQuery } from '@apollo/client/react';
import { GET_LOGIN_ACTIVITY } from '@/graphql/mutations/authMutation';

const ACTION_CONFIG = {
  login: { label: 'Sign In', icon: FiCheck, color: 'text-green-400', bg: 'bg-green-500/10' },
  login_failed: { label: 'Failed Login', icon: FiX, color: 'text-red-400', bg: 'bg-red-500/10' },
  '2fa_enabled': { label: '2FA Enabled', icon: FiShield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  '2fa_disabled': { label: '2FA Disabled', icon: FiShield, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  '2fa_failed': { label: 'Failed 2FA', icon: FiAlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  password_change: { label: 'Password Changed', icon: FiShield, color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

function getDeviceIcon(ua = '') {
  const lower = ua.toLowerCase();
  if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
    return FiSmartphone;
  }
  return FiMonitor;
}

function parseUserAgent(ua = '') {
  if (!ua) return 'Unknown Device';
  const lower = ua.toLowerCase();
  let browser = 'Browser';
  if (lower.includes('chrome') && !lower.includes('edg')) browser = 'Chrome';
  else if (lower.includes('firefox')) browser = 'Firefox';
  else if (lower.includes('safari') && !lower.includes('chrome')) browser = 'Safari';
  else if (lower.includes('edg')) browser = 'Edge';

  let os = '';
  if (lower.includes('windows')) os = 'Windows';
  else if (lower.includes('mac os')) os = 'macOS';
  else if (lower.includes('linux')) os = 'Linux';
  else if (lower.includes('android')) os = 'Android';
  else if (lower.includes('iphone') || lower.includes('ipad')) os = 'iOS';

  return `${browser}${os ? ` on ${os}` : ''}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function LoginActivityLog() {
  const { data, loading, refetch } = useQuery(GET_LOGIN_ACTIVITY, {
    variables: { limit: 20 },
    fetchPolicy: 'network-only',
  });

  const activities = data?.loginActivity || [];

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
            <FiGlobe className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Login Activity</h3>
            <p className="text-gray-500 text-xs">Recent security events on your account</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="Refresh"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && activities.length === 0 ? (
        <div className="p-8 text-center">
          <FiRefreshCw className="w-6 h-6 text-gray-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Loading activity...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="p-8 text-center">
          <FiShield className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No login activity recorded yet</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {activities.map((activity, i) => {
            const config = ACTION_CONFIG[activity.action] || ACTION_CONFIG.login;
            const ActionIcon = config.icon;
            const DeviceIcon = getDeviceIcon(activity.deviceInfo);
            const deviceLabel = parseUserAgent(activity.deviceInfo);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                {/* Action icon */}
                <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <ActionIcon className={`w-5 h-5 ${config.color}`} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-bold">{config.label}</p>
                    {!activity.success && (
                      <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-md uppercase">
                        Failed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <DeviceIcon className="w-3 h-3" /> {deviceLabel}
                    </span>
                    {activity.ipAddress && (
                      <span className="text-xs text-gray-600">{activity.ipAddress}</span>
                    )}
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                  <FiClock className="w-3 h-3" />
                  {timeAgo(activity.createdAt)}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
