// frontend/src/components/admin/users/UserBanModal.jsx
import { useState } from 'react';
import { FiSlash, FiX } from 'react-icons/fi';

const BAN_REASONS = [
  'Spam or bot activity',
  'Abuse / harassment',
  'Terms of service violation',
  'Fraudulent account',
  'Other',
];

export default function UserBanModal({ open, user, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('permanent');

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm?.({ userId: user?.id, reason, duration });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#13151b] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10">
              <FiSlash className="text-red-400" size={16} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ban User</h2>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-600 hover:text-white transition-colors p-1">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick reasons */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Reason</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {BAN_REASONS.map((r) => (
                <button
                  key={r} type="button"
                  onClick={() => setReason(r)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    reason === r
                      ? 'border-red-500/40 bg-red-500/10 text-red-400'
                      : 'border-white/5 bg-white/[0.02] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the reason..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl outline-none focus:border-red-500/30 transition-colors resize-none text-sm placeholder-gray-600"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none cursor-pointer"
            >
              <option value="permanent">Permanent</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit" disabled={!reason.trim() || loading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
            >
              {loading ? 'Banning...' : 'Ban User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
