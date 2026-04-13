// frontend/src/pages/admin/logs/audit-log.jsx
import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { GET_ADMIN_AUDIT_LOGS } from '@/graphql/queries/adminQueries';
import {
  FiShield, FiRefreshCw, FiSearch, FiUser, FiTrash2, FiToggleRight,
  FiEdit, FiLock, FiUserX, FiUserCheck, FiFlag, FiAlertTriangle
} from 'react-icons/fi';

const ACTION_ICONS = {
  ban_user: FiUserX,
  unban_user: FiUserCheck,
  delete_user: FiTrash2,
  update_role: FiShield,
  update_feature_flag: FiToggleRight,
  delete_review: FiTrash2,
  feature_review: FiFlag,
  revoke_session: FiLock,
  default: FiEdit,
};

const ACTION_COLORS = {
  ban_user: 'text-red-400 bg-red-500/10',
  unban_user: 'text-green-400 bg-green-500/10',
  delete_user: 'text-red-400 bg-red-500/10',
  update_role: 'text-violet-400 bg-violet-500/10',
  update_feature_flag: 'text-cyan-400 bg-cyan-500/10',
  delete_review: 'text-orange-400 bg-orange-500/10',
  feature_review: 'text-amber-400 bg-amber-500/10',
  revoke_session: 'text-pink-400 bg-pink-500/10',
  default: 'text-gray-400 bg-gray-700/50',
};

export default function AuditLogPage() {
  const { data, loading, refetch } = useQuery(GET_ADMIN_AUDIT_LOGS, { variables: { limit: 100 } });
  const [search, setSearch] = useState('');

  const logs = data?.adminAuditLogs || [];
  const filtered = search
    ? logs.filter(l =>
        l.action.includes(search.toLowerCase()) ||
        l.adminEmail?.toLowerCase().includes(search.toLowerCase()) ||
        l.details?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const formatAction = (action) => action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Audit Log</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track all admin actions — bans, permission changes, flag updates</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search logs..." id="audit-search"
                  className="bg-white/[0.03] text-sm text-gray-300 pl-9 pr-4 py-2 rounded-xl border border-white/5 outline-none focus:border-primary-500/30 transition-colors w-56"
                />
              </div>
              <button onClick={() => refetch()} className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white/[0.02] rounded-2xl p-4 animate-pulse h-16 border border-white/5" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <FiShield className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-bold">No audit entries</p>
              <p className="text-gray-600 text-sm mt-1">Admin actions will be logged here automatically.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((entry, i) => {
                const Icon = ACTION_ICONS[entry.action] || ACTION_ICONS.default;
                const colorClass = ACTION_COLORS[entry.action] || ACTION_COLORS.default;
                return (
                  <motion.div
                    key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-bold">{formatAction(entry.action)}</span>
                        {entry.targetType && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-500 font-mono">
                            {entry.targetType}:{entry.targetId?.substring(0, 8)}
                          </span>
                        )}
                      </div>
                      {entry.details && (
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{entry.details}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-gray-500 text-xs">{entry.adminEmail?.split('@')[0] || 'System'}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">{formatDate(entry.createdAt)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
