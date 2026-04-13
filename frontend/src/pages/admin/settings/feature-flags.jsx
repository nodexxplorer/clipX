// frontend/src/pages/admin/settings/feature-flags.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { GET_FEATURE_FLAGS, UPDATE_FEATURE_FLAG } from '@/graphql/queries/adminQueries';
import { FiToggleLeft, FiToggleRight, FiRefreshCw, FiZap, FiSearch, FiCheck, FiAlertCircle } from 'react-icons/fi';

export default function FeatureFlagsPage() {
  const { data, loading, refetch } = useQuery(GET_FEATURE_FLAGS);
  const [updateFlag, { loading: updating }] = useMutation(UPDATE_FEATURE_FLAG);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const flags = data?.featureFlags || [];
  const filtered = search
    ? flags.filter(f => f.key.includes(search.toLowerCase()) || f.label?.toLowerCase().includes(search.toLowerCase()))
    : flags;

  const handleToggle = async (flag) => {
    try {
      await updateFlag({
        variables: { input: { key: flag.key, enabled: !flag.enabled, label: flag.label, description: flag.description } },
      });
      setToast({ type: 'success', message: `${flag.label || flag.key} ${!flag.enabled ? 'enabled' : 'disabled'}` });
      refetch();
    } catch (e) {
      setToast({ type: 'error', message: e.message });
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Feature Flags</h1>
              <p className="text-sm text-gray-500 mt-0.5">Toggle platform features on or off in real-time</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search flags..." id="flag-search"
                  className="bg-white/[0.03] text-sm text-gray-300 pl-9 pr-4 py-2 rounded-xl border border-white/5 outline-none focus:border-primary-500/30 transition-colors w-56"
                />
              </div>
              <button onClick={() => refetch()} className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                  toast.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {toast.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flags Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/[0.02] rounded-2xl p-6 animate-pulse h-28 border border-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((flag, i) => (
                <motion.div
                  key={flag.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative rounded-2xl border p-5 transition-all duration-300 ${
                    flag.enabled
                      ? 'bg-primary-500/[0.04] border-primary-500/20 hover:border-primary-500/40'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        flag.enabled ? 'bg-primary-500/15 text-primary-400' : 'bg-gray-700/50 text-gray-500'
                      }`}>
                        <FiZap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm truncate">{flag.label || flag.key}</p>
                        <p className="text-gray-500 text-xs mt-0.5 font-mono">{flag.key}</p>
                        {flag.description && (
                          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">{flag.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(flag)} disabled={updating}
                      className="flex-shrink-0 text-2xl transition-colors disabled:opacity-50"
                      id={`flag-toggle-${flag.key}`}
                      aria-label={`Toggle ${flag.label || flag.key}`}
                    >
                      {flag.enabled ? (
                        <FiToggleRight className="text-primary-400 w-8 h-8" />
                      ) : (
                        <FiToggleLeft className="text-gray-600 w-8 h-8" />
                      )}
                    </button>
                  </div>
                  {flag.updatedAt && (
                    <p className="text-gray-600 text-[10px] mt-3 font-mono">
                      Updated: {new Date(flag.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-20">
              <FiZap className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-bold">No flags found</p>
              <p className="text-gray-600 text-sm mt-1">{search ? 'Try a different search term.' : 'Feature flags will appear here once created.'}</p>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
