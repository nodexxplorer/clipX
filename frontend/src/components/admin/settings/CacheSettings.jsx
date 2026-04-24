// frontend/src/components/admin/settings/CacheSettings.jsx
import { useState } from 'react';
import { FiDatabase, FiTrash2, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';

export default function CacheSettings({ stats = {}, onFlush, onFlushPattern, loading }) {
  const [pattern, setPattern] = useState('');

  const cacheItems = [
    { label: 'Movie Cache', pattern: 'movie:*', count: stats.movieKeys || 0 },
    { label: 'Search Cache', pattern: 'search:*', count: stats.searchKeys || 0 },
    { label: 'User Sessions', pattern: 'session:*', count: stats.sessionKeys || 0 },
    { label: 'Rate Limits', pattern: 'rate:*', count: stats.rateKeys || 0 },
  ];

  return (
    <div className="space-y-5 max-w-xl">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <FiDatabase size={15} className="text-primary-400" /> Cache Management
      </h2>

      {/* Cache overview */}
      <div className="grid grid-cols-2 gap-3">
        {cacheItems.map((item, i) => (
          <div key={i} className="p-4 bg-white/[0.02] rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.count} keys</p>
            </div>
            <button
              onClick={() => onFlushPattern?.(item.pattern)}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
              title={`Flush ${item.label}`}
            >
              <FiTrash2 size={14} className="text-gray-600 group-hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>

      {/* Custom pattern */}
      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Flush by Pattern</label>
        <div className="flex gap-2">
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="e.g. movie:trending:*"
            className="flex-1 bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30 placeholder-gray-600 font-mono"
          />
          <button
            onClick={() => { onFlushPattern?.(pattern); setPattern(''); }}
            disabled={!pattern}
            className="px-4 py-2.5 bg-red-600/80 hover:bg-red-500 text-white text-sm font-bold rounded-xl disabled:opacity-30 transition-colors"
          >
            Flush
          </button>
        </div>
      </div>

      {/* Flush all */}
      <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
        <div className="flex items-start gap-3">
          <FiAlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={16} />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Flush All Cache</p>
            <p className="text-xs text-gray-500 mt-0.5">This will clear all cached data. Users may experience slower load times temporarily.</p>
            <button
              onClick={onFlush}
              disabled={loading}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? 'Flushing...' : 'Flush Entire Cache'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
